import type { FastifyInstance } from 'fastify';
import { SessionState, Player, CreateSessionResponse, JoinSessionResponse } from '../types';
import { gameStore } from '../game/store';
import { generateSessionCode, generatePlayerId, generatePlayerToken } from '../game/ids';
import { assignEmoji, getUsedEmojis } from '../game/emoji';
import {
  createSessionSchema,
  joinSessionSchema,
  updateSeatingSchema,
  kickPlayerSchema,
  updateEmojiSchema,
  updateGameModeSchema
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

    const { name, settings = {}, category, gameMode = 'word' } = validation.data;

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
      isEliminated: false,
      isReady: false
    };

    const sessionState: SessionState = {
      code: sessionCode,
      hostPlayerId: playerId,
      createdAt: Date.now(),
      phase: 'lobby',
      players: [player],
      gameMode: gameMode as 'word' | 'places_roles',
      secretWordCategory: category,
      secretWord: null,
      secretPlace: null,
      playerRoles: null,
      whitePlayerId: null,
      round: null,
      vote: null,
      whiteGuess: null,
      scoreboard: null,
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

    // Check if a player with this name already exists (reconnection scenario)
    // This check must happen BEFORE the "game started" check to allow rejoins
    const existingPlayer = session.state.players.find(p => p.name === name);
    if (existingPlayer) {
      // Check actual socket connections, not just isConnected flag (handles race conditions)
      const hasActiveSockets = gameStore.isPlayerConnected(code, existingPlayer.id);

      console.log(`Rejoin attempt for "${name}" - Player ID: ${existingPlayer.id}, hasActiveSockets: ${hasActiveSockets}, isConnected flag: ${existingPlayer.isConnected}`);

      if (!hasActiveSockets) {
        // Player exists but has no active sockets - allow them to rejoin with a new token
        // This works even if the game has already started (reconnection)
        const newToken = generatePlayerToken();
        gameStore.addPlayerToken(code, newToken, existingPlayer.id);

        console.log(`Allowing rejoin for "${name}" with new token`);

        const response: JoinSessionResponse = {
          playerToken: newToken,
          playerId: existingPlayer.id,
          emoji: existingPlayer.emoji
        };
        return response;
      }

      // Player with same name has active connections - reject (prevent duplicates)
      console.log(`Rejecting rejoin for "${name}" - still has active sockets`);
      reply.status(409);
      return { error: 'A player with this name is already in the game' };
    }

    // For NEW players (not reconnecting), check if game has started
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
      isEliminated: false,
      isReady: false
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

    // Check if all non-host players are ready (host doesn't need to be ready)
    const notReadyPlayers = session.state.players.filter(
      p => p.id !== session.state.hostPlayerId && !p.isReady
    );
    if (notReadyPlayers.length > 0) {
      reply.status(409);
      return { error: `${notReadyPlayers.length} player(s) not ready` };
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

  // Restart game (host only) - Play Again
  fastify.post('/sessions/:code/restart', async (request: any, reply: any) => {
    const { code } = request.params;
    const session = gameStore.getSession(code);

    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId || request.playerId !== session.state.hostPlayerId) {
      reply.status(403);
      return { error: 'Only the host can restart the game' };
    }

    if (session.state.phase !== 'ended') {
      reply.status(409);
      return { error: 'Game has not ended yet' };
    }

    // Import and use game engine
    const { GameEngine } = await import('../game/engine');
    const engine = new GameEngine(fastify.io);
    engine.restartGame(code);

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

  // Update player emoji
  fastify.post('/sessions/:code/emoji', async (request: any, reply: any) => {
    // Validate request body
    const validation = updateEmojiSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }

    const { code } = request.params;
    const { emoji } = validation.data;
    const session = gameStore.getSession(code);

    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    if (session.state.phase !== 'lobby') {
      reply.status(409);
      return { error: 'Cannot change emoji after game starts' };
    }

    // Check if emoji is already used by another player
    const emojiUsedBy = session.state.players.find(
      p => p.emoji === emoji && p.id !== request.playerId
    );

    if (emojiUsedBy) {
      reply.status(409);
      return { error: 'Emoji already taken by another player' };
    }

    // Update player's emoji
    const player = session.state.players.find(p => p.id === request.playerId);
    if (!player) {
      reply.status(404);
      return { error: 'Player not found' };
    }

    player.emoji = emoji;
    gameStore.updateState(code, session.state);

    // Broadcast update to all players
    fastify.io.to(code).emit('session/players_update', session.state.players);

    return { ok: true, emoji };
  });

  // Toggle player ready status
  fastify.post('/sessions/:code/ready', async (request: any, reply: any) => {
    const { code } = request.params;
    const session = gameStore.getSession(code);

    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    if (session.state.phase !== 'lobby') {
      reply.status(409);
      return { error: 'Game has already started' };
    }

    // Find and toggle player's ready status
    const player = session.state.players.find(p => p.id === request.playerId);
    if (!player) {
      reply.status(404);
      return { error: 'Player not found' };
    }

    player.isReady = !player.isReady;
    gameStore.updateState(code, session.state);

    // Broadcast update to all players
    fastify.io.to(code).emit('session/players_update', session.state.players);

    return { ok: true, isReady: player.isReady };
  });

  // Update game mode (host only)
  fastify.post('/sessions/:code/gamemode', async (request: any, reply: any) => {
    // Validate request body
    const validation = updateGameModeSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(400);
      return { error: 'Invalid request data', details: validation.error.issues };
    }

    const { code } = request.params;
    const { gameMode } = validation.data;
    const session = gameStore.getSession(code);

    if (!session) {
      reply.status(404);
      return { error: 'Session not found' };
    }

    if (!request.playerId || request.playerId !== session.state.hostPlayerId) {
      reply.status(403);
      return { error: 'Only the host can change the game mode' };
    }

    if (session.state.phase !== 'lobby') {
      reply.status(409);
      return { error: 'Cannot change game mode after game starts' };
    }

    // Update game mode
    session.state.gameMode = gameMode;
    gameStore.updateState(code, session.state);

    // Broadcast update to all players
    fastify.io.to(code).emit('session/state', {
      ...session.state,
      secretWord: null,
      secretPlace: null,
      playerRoles: null
    });

    return { ok: true, gameMode };
  });
}