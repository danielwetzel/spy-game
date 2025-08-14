import { SessionState, SessionCode, PlayerId } from '../types';

export interface SessionStore {
  state: SessionState;
  tokens: Map<string, PlayerId>;
  sockets: Map<PlayerId, Set<string>>;
  timers: {
    vote?: NodeJS.Timeout;
    whiteGuess?: NodeJS.Timeout;
    disconnectGrace?: Map<PlayerId, NodeJS.Timeout>;
  };
}

class GameStore {
  private sessions = new Map<SessionCode, SessionStore>();

  createSession(state: SessionState): SessionStore {
    const store: SessionStore = {
      state,
      tokens: new Map(),
      sockets: new Map(),
      timers: {
        disconnectGrace: new Map()
      }
    };
    this.sessions.set(state.code, store);
    return store;
  }

  getSession(code: SessionCode): SessionStore | undefined {
    return this.sessions.get(code);
  }

  deleteSession(code: SessionCode): void {
    const session = this.sessions.get(code);
    if (session) {
      // Clean up timers
      if (session.timers.vote) clearTimeout(session.timers.vote);
      if (session.timers.whiteGuess) clearTimeout(session.timers.whiteGuess);
      session.timers.disconnectGrace?.forEach(timer => clearTimeout(timer));
      this.sessions.delete(code);
    }
  }

  getAllActiveCodes(): Set<SessionCode> {
    return new Set(this.sessions.keys());
  }

  addPlayerToken(code: SessionCode, token: string, playerId: PlayerId): void {
    const session = this.sessions.get(code);
    if (session) {
      session.tokens.set(token, playerId);
    }
  }

  getPlayerIdFromToken(code: SessionCode, token: string): PlayerId | undefined {
    const session = this.sessions.get(code);
    return session?.tokens.get(token);
  }

  addSocket(code: SessionCode, playerId: PlayerId, socketId: string): void {
    const session = this.sessions.get(code);
    if (session) {
      if (!session.sockets.has(playerId)) {
        session.sockets.set(playerId, new Set());
      }
      session.sockets.get(playerId)!.add(socketId);
    }
  }

  removeSocket(code: SessionCode, playerId: PlayerId, socketId: string): void {
    const session = this.sessions.get(code);
    if (session) {
      const sockets = session.sockets.get(playerId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          session.sockets.delete(playerId);
        }
      }
    }
  }

  isPlayerConnected(code: SessionCode, playerId: PlayerId): boolean {
    const session = this.sessions.get(code);
    if (!session) return false;
    const sockets = session.sockets.get(playerId);
    return sockets ? sockets.size > 0 : false;
  }

  updateState(code: SessionCode, newState: SessionState): void {
    const session = this.sessions.get(code);
    if (session) {
      session.state = newState;
    }
  }
}

export const gameStore = new GameStore();