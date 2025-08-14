import type { FastifyInstance } from 'fastify';
import { SessionState, Player, CreateSessionResponse, JoinSessionResponse } from '../types';
import { gameStore } from '../game/store';
import { generateSessionCode, generatePlayerId, generatePlayerToken } from '../game/ids';
import { assignEmoji, getUsedEmojis } from '../game/emoji';
import { 
  createSessionSchema, 
  joinSessionSchema, 
  updateSeatingSchema,
  kickPlayerSchema
} from './schemas';

export async function sessionRoutes(fastify: FastifyInstance) {
  // Middleware to extract player from bearer token
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    const authHeader = (request.headers as any).authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const sessionCode = (request.params as any)?.code as string | undefined;
      
      if (sessionCode) {
        const playerId = gameStore.getPlayerIdFromToken(sessionCode, token);
        if (playerId) {
          request.playerId = playerId;
          request.sessionCode = sessionCode;
        }
      }
    }
  });

  // Create session
  fastify.post('/sessions', async (request: any, reply: any) => {
    // Validate request body
    const validation = createSessionSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }
    
    const { name, settings = {}, category } = validation.data;
    
    const sessionCode = generateSessionCode(gameStore.getAllActiveCodes());
    const playerId = generatePlayerId();
    const playerToken = generatePlayerToken();
    const emoji = assignEmoji(new Set());

    const defaultSettings = {
      voteSeconds: 120,
      whiteGuessSeconds: 30,
      maxRounds: null,
      allowLateJoin: false,
      recordClues: false,
      ...settings
    };

    const player: Player = {
      id: playerId,
      name,
      emoji,
      isWhite: false,
      isConnected: false,
      isEliminated: false
    };

    const sessionState: SessionState = {
      code: sessionCode,
      hostPlayerId: playerId,
      createdAt: Date.now(),
      phase: 'lobby',
      players: [player],
      secretWordCategory: category,
      secretWord: null,
      whitePlayerId: null,
      round: null,
      vote: null,
      whiteGuess: null,
      settings: defaultSettings
    };

    const session = gameStore.createSession(sessionState);
    gameStore.addPlayerToken(sessionCode, playerToken, playerId);

    const response: CreateSessionResponse = {
      code: sessionCode,
      playerToken,
      playerId,
      emoji
    };

    return response;
  });

  // Join session
  fastify.post('/sessions/:code/join', async (request: any, reply: any) => {
    // Validate request body
    const validation = joinSessionSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }
    
    const { code } = request.params;
    const { name } = validation.data;

    const session = gameStore.getSession(code);
    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (session.state.phase !== 'lobby' && !session.state.settings.allowLateJoin) {
      reply.status(409);
      return { error: 'Game has already started' };
    }

    const playerId = generatePlayerId();
    const playerToken = generatePlayerToken();
    const usedEmojis = getUsedEmojis(session.state.players);
    const emoji = assignEmoji(usedEmojis);

    const player: Player = {
      id: playerId,
      name,
      emoji,
      isWhite: false,
      isConnected: false,
      isEliminated: false
    };

    session.state.players.push(player);
    gameStore.addPlayerToken(code, playerToken, playerId);
    gameStore.updateState(code, session.state);

    const response: JoinSessionResponse = {
      playerToken,
      playerId,
      emoji
    };

    return response;
  });

  // Get session state
  fastify.get('/sessions/:code', async (request: any, reply: any) => {
    const { code } = request.params;
    const session = gameStore.getSession(code);
    
    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    // Return sanitized state (no secret word)
    const sanitizedState = {
      ...session.state,
      secretWord: null
    };

    return sanitizedState;
  });

  // Start game (host only)
  fastify.post('/sessions/:code/start', async (request: any, reply: any) => {
    const { code } = request.params;
    const session = gameStore.getSession(code);
    
    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId || request.playerId !== session.state.hostPlayerId) {
      reply.status(403);
      return { error: 'Only the host can start the game' };
    }

    if (session.state.phase !== 'lobby') {
      reply.status(409);
      return { error: 'Game has already started' };
    }

    if (session.state.players.length < 4) {
      reply.status(409);
      return { error: 'Need at least 4 players to start' };
    }

    // Import and use game engine
    const { GameEngine } = await import('../game/engine');
    const engine = new GameEngine(fastify.io);
    engine.startGame(code);

    return { ok: true };
  });

  // Update seating order (host only)
  fastify.post('/sessions/:code/seating', async (request: any, reply: any) => {
    // Validate request body
    const validation = updateSeatingSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }
    
    const { code } = request.params;
    const { playerIds } = validation.data;
    const session = gameStore.getSession(code);
    
    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId || request.playerId !== session.state.hostPlayerId) {
      reply.status(403);
      return { error: 'Only the host can update seating' };
    }

    if (session.state.phase !== 'lobby') {
      reply.status(409);
      return { error: 'Cannot change seating after game starts' };
    }

    // Validate that all current players are included
    const currentPlayerIds = new Set(session.state.players.map(p => p.id));
    const newPlayerIds = new Set(playerIds);
    
    if (currentPlayerIds.size !== newPlayerIds.size || 
        !playerIds.every((id: string) => currentPlayerIds.has(id))) {
      reply.status(400);
      return { error: 'Invalid player arrangement' };
    }

    // Reorder players
    const playerMap = new Map(session.state.players.map(p => [p.id, p]));
    session.state.players = playerIds.map((id: string) => playerMap.get(id)!);
    
    gameStore.updateState(code, session.state);

    return { ok: true };
  });

  // Kick player (host only)
  fastify.post('/sessions/:code/kick', async (request: any, reply: any) => {
    // Validate request body
    const validation = kickPlayerSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }
    
    const { code } = request.params;
    const { playerId: targetPlayerId } = validation.data;
    const session = gameStore.getSession(code);
    
    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId || request.playerId !== session.state.hostPlayerId) {
      reply.status(403);
      return { error: 'Only the host can kick players' };
    }

    if (targetPlayerId === session.state.hostPlayerId) {
      reply.status(400);
      return { error: 'Cannot kick the host' };
    }

    const playerIndex = session.state.players.findIndex(p => p.id === targetPlayerId);
    if (playerIndex === -1) {
      reply.status(404);
      return { error: 'Player not found' };
    }

    // Remove player
    session.state.players.splice(playerIndex, 1);
    gameStore.updateState(code, session.state);

    return { ok: true };
  });
}