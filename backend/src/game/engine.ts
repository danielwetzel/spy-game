import { SessionState, GamePhase, PlayerId, Player, PrivateRole, GameEndResult } from '../types';
import { gameStore, SessionStore } from './store';
import { selectSecretWord, isCorrectGuess } from './words';

export class GameEngine {
  private io: any;

  constructor(io: any) {
    this.io = io;
  }

  startGame(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session || session.state.phase !== 'lobby') return;

    const { state } = session;
    
    // Validate minimum players
    if (state.players.length < 4) {
      this.emitError(sessionCode, 'Need at least 4 players to start');
      return;
    }

    // Transition to dealing phase
    state.phase = 'dealing';
    this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));

    // Select secret word and assign White
    state.secretWord = selectSecretWord(state.secretWordCategory);
    const whiteIndex = Math.floor(Math.random() * state.players.length);
    state.whitePlayerId = state.players[whiteIndex].id;
    
    // Update player white status
    state.players.forEach((player, index) => {
      player.isWhite = index === whiteIndex;
    });

    // Choose starting player (non-White)
    const nonWhitePlayers = state.players.filter(p => !p.isWhite);
    const startingPlayer = nonWhitePlayers[Math.floor(Math.random() * nonWhitePlayers.length)];
    const startingIndex = state.players.findIndex(p => p.id === startingPlayer.id);

    // Initialize round
    state.round = {
      roundNumber: 1,
      startingPlayerId: startingPlayer.id,
      currentTurnIndex: startingIndex,
      turnsCompleted: 0
    };

    // Send private roles
    state.players.forEach(player => {
      const role: PrivateRole = player.isWhite 
        ? { role: 'white' }
        : { role: 'word', word: state.secretWord! };
      
      this.emitToPlayer(sessionCode, player.id, 'game/dealt_private', role);
    });

    // Transition to round play
    state.phase = 'round_play';
    gameStore.updateState(sessionCode, state);

    this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));
    this.emitToRoom(sessionCode, 'turn/started', {
      playerId: startingPlayer.id,
      roundNumber: 1,
      turnNumber: 1
    });
  }

  confirmSpoken(sessionCode: string, playerId: PlayerId): void {
    const session = gameStore.getSession(sessionCode);
    if (!session || session.state.phase !== 'round_play') return;

    const { state } = session;
    if (!state.round) return;

    // Verify it's the current player's turn
    const currentPlayer = state.players[state.round.currentTurnIndex];
    if (currentPlayer.id !== playerId) return;

    this.emitToRoom(sessionCode, 'turn/ended', { playerId });

    // Move to next turn
    state.round.turnsCompleted++;
    
    const activePlayers = state.players.filter(p => !p.isEliminated);
    if (state.round.turnsCompleted >= activePlayers.length) {
      // Round complete, start voting
      this.startVoting(sessionCode);
    } else {
      // Find next active player's turn
      let nextTurnIndex = (state.round.currentTurnIndex + 1) % state.players.length;
      while (state.players[nextTurnIndex].isEliminated) {
        nextTurnIndex = (nextTurnIndex + 1) % state.players.length;
      }
      
      state.round.currentTurnIndex = nextTurnIndex;
      const nextPlayer = state.players[nextTurnIndex];
      
      gameStore.updateState(sessionCode, state);
      this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));
      this.emitToRoom(sessionCode, 'turn/started', {
        playerId: nextPlayer.id,
        roundNumber: state.round.roundNumber,
        turnNumber: state.round.turnsCompleted + 1
      });
    }
  }

  private startVoting(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    state.phase = 'voting';
    
    const votingEndsAt = Date.now() + (state.settings.voteSeconds * 1000);
    state.vote = {
      votingEndsAt,
      votes: {}
    };

    gameStore.updateState(sessionCode, state);
    this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));
    this.emitToRoom(sessionCode, 'voting/started', { votingEndsAt });

    // Set timer for vote end
    session.timers.vote = setTimeout(() => {
      this.resolveVotes(sessionCode);
    }, state.settings.voteSeconds * 1000);
  }

  castVote(sessionCode: string, voterId: PlayerId, targetId: PlayerId | null): void {
    const session = gameStore.getSession(sessionCode);
    if (!session || session.state.phase !== 'voting') return;

    const { state } = session;
    if (!state.vote) return;

    // Validate voter and target
    const voter = state.players.find(p => p.id === voterId);
    if (!voter || voter.isEliminated) return; // Eliminated players cannot vote

    // Players cannot vote for themselves
    if (targetId === voterId) return;

    if (targetId && !state.players.find(p => p.id === targetId)) return;

    state.vote.votes[voterId] = targetId;
    gameStore.updateState(sessionCode, state);

    // Check if all active players have voted
    const activePlayers = state.players.filter(p => !p.isEliminated);
    const allVoted = activePlayers.every(p => p.id in state.vote!.votes);
    if (allVoted) {
      if (session.timers.vote) {
        clearTimeout(session.timers.vote);
        session.timers.vote = undefined;
      }
      this.resolveVotes(sessionCode);
    }
  }

  private resolveVotes(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    if (!state.vote) return;

    const { accused, isTie } = this.tallyVotes(state.vote.votes);
    
    state.phase = 'resolution';
    gameStore.updateState(sessionCode, state);

    this.emitToRoom(sessionCode, 'voting/ended', { accusedPlayerId: accused, isTie });

    if (accused && accused === state.whitePlayerId) {
      // White player accused - start guess phase
      this.startWhiteGuess(sessionCode);
    } else if (accused && !isTie) {
      // Non-white player eliminated
      this.eliminatePlayer(sessionCode, accused);
    } else {
      // No elimination, continue to next round
      this.startNextRound(sessionCode);
    }
  }

  private startWhiteGuess(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    state.phase = 'white_guess';
    
    const guessEndsAt = Date.now() + (state.settings.whiteGuessSeconds * 1000);
    state.whiteGuess = {
      guessEndsAt,
      guess: null
    };

    gameStore.updateState(sessionCode, state);

    // Send private message to White player
    this.emitToPlayer(sessionCode, state.whitePlayerId!, 'white/guess_started', { guessEndsAt });
    
    // Send public message to others
    this.emitToRoom(sessionCode, 'white/guess_pending', { guessEndsAt });

    // Set timer for guess end
    session.timers.whiteGuess = setTimeout(() => {
      this.resolveWhiteGuess(sessionCode);
    }, state.settings.whiteGuessSeconds * 1000);
  }

  submitWhiteGuess(sessionCode: string, playerId: PlayerId, guess: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session || session.state.phase !== 'white_guess') return;

    const { state } = session;
    if (!state.whiteGuess || playerId !== state.whitePlayerId) return;

    state.whiteGuess.guess = guess;
    gameStore.updateState(sessionCode, state);

    // Clear timer and resolve immediately
    if (session.timers.whiteGuess) {
      clearTimeout(session.timers.whiteGuess);
      session.timers.whiteGuess = undefined;
    }

    this.resolveWhiteGuess(sessionCode);
  }

  private resolveWhiteGuess(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    if (!state.whiteGuess) return;

    const isCorrect = state.whiteGuess.guess && 
                     isCorrectGuess(state.whiteGuess.guess, state.secretWord!);

    this.emitToRoom(sessionCode, 'white/guess_result', { isCorrect });

    // End game
    this.endGame(sessionCode, isCorrect ? 'white' : 'others', state.whiteGuess.guess || undefined);
  }

  private eliminatePlayer(sessionCode: string, playerId: PlayerId): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    
    // Mark player as eliminated instead of removing them
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isEliminated = true;
    }
    
    // Broadcast elimination result
    this.emitToRoom(sessionCode, 'player/eliminated', { 
      playerId, 
      wasWhite: playerId === state.whitePlayerId,
      playerName: player?.name 
    });
    
    // Check if White was eliminated
    if (playerId === state.whitePlayerId) {
      // White was eliminated, others win
      this.endGame(sessionCode, 'others');
    } else {
      // Continue to next round
      this.startNextRound(sessionCode);
    }
  }

  private startNextRound(sessionCode: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    if (!state.round) return;

    // Check max rounds
    if (state.settings.maxRounds && state.round.roundNumber >= state.settings.maxRounds) {
      this.endGame(sessionCode, 'others'); // Max rounds reached, others win
      return;
    }

    // Keep the same starting player for consistency (if not eliminated)
    const currentStarter = state.players.find(p => p.id === state.round!.startingPlayerId);
    let nextStarterIndex: number;
    let nextStarter: Player;
    
    if (currentStarter && !currentStarter.isEliminated) {
      // Current starter is still in game, keep them
      nextStarterIndex = state.players.findIndex(p => p.id === state.round!.startingPlayerId);
      nextStarter = currentStarter;
    } else {
      // Current starter eliminated, find next non-eliminated, non-White player
      nextStarterIndex = state.players.findIndex(p => 
        !p.isEliminated && p.id !== state.whitePlayerId
      );
      nextStarter = state.players[nextStarterIndex];
    }

    state.round = {
      roundNumber: state.round.roundNumber + 1,
      startingPlayerId: nextStarter.id,
      currentTurnIndex: nextStarterIndex,
      turnsCompleted: 0
    };

    state.phase = 'round_play';
    state.vote = null;
    state.whiteGuess = null;

    gameStore.updateState(sessionCode, state);

    this.emitToRoom(sessionCode, 'round/advanced', {
      roundNumber: state.round.roundNumber,
      startingPlayerId: nextStarter.id
    });

    this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));
    
    this.emitToRoom(sessionCode, 'turn/started', {
      playerId: nextStarter.id,
      roundNumber: state.round.roundNumber,
      turnNumber: 1
    });
  }

  private endGame(sessionCode: string, winner: 'white' | 'others', whiteGuess?: string): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const { state } = session;
    state.phase = 'ended';

    const result: GameEndResult = {
      whitePlayerId: state.whitePlayerId!,
      secretWord: state.secretWord!,
      winner,
      whiteGuess
    };

    gameStore.updateState(sessionCode, state);

    this.emitToRoom(sessionCode, 'game/ended', result);
    this.emitToRoom(sessionCode, 'session/state', this.sanitizeStateFor(null, state));
  }

  private tallyVotes(votes: Record<PlayerId, PlayerId | null>): { accused: PlayerId | null; isTie: boolean } {
    const counts = new Map<PlayerId, number>();
    
    for (const target of Object.values(votes)) {
      if (!target) continue; // Skip votes
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }

    if (counts.size === 0) {
      return { accused: null, isTie: true };
    }

    let top: { id: PlayerId | null; count: number } = { id: null, count: 0 };
    let secondHighest = 0;

    for (const [id, count] of counts) {
      if (count > top.count) {
        secondHighest = top.count;
        top = { id, count };
      } else if (count > secondHighest) {
        secondHighest = count;
      }
    }

    if (!top.id || top.count === secondHighest) {
      return { accused: null, isTie: true };
    }

    return { accused: top.id, isTie: false };
  }

  private sanitizeStateFor(playerId: PlayerId | null, state: SessionState): SessionState {
    return {
      ...state,
      secretWord: null // Never include secret word in state broadcasts
    };
  }

  private emitToRoom(sessionCode: string, event: string, data: any): void {
    this.io.to(sessionCode).emit(event, data);
  }

  private emitToPlayer(sessionCode: string, playerId: PlayerId, event: string, data: any): void {
    const session = gameStore.getSession(sessionCode);
    if (!session) return;

    const sockets = session.sockets.get(playerId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  private emitError(sessionCode: string, message: string): void {
    this.emitToRoom(sessionCode, 'error', { message });
  }
}