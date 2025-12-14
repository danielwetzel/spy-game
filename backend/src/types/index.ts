export type SessionCode = string;
export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  emoji: string;
  isWhite: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  isReady: boolean;
}

export type GamePhase =
  | "lobby"
  | "dealing"
  | "round_play"
  | "voting"
  | "white_guess"
  | "resolution"
  | "ended";

export interface RoundInfo {
  roundNumber: number;
  startingPlayerId: PlayerId;
  currentTurnIndex: number;
  turnsCompleted: number;
}

export interface VoteState {
  votingEndsAt: number;
  votes: Record<PlayerId, PlayerId | null>;
}

export interface WhiteGuessState {
  guessEndsAt: number;
  guess: string | null;
}

export interface SessionState {
  code: SessionCode;
  hostPlayerId: PlayerId;
  createdAt: number;
  phase: GamePhase;
  players: Player[];
  secretWordCategory: string;
  secretWord: string | null;
  whitePlayerId: PlayerId | null;
  round: RoundInfo | null;
  vote: VoteState | null;
  whiteGuess: WhiteGuessState | null;
  scoreboard: Scoreboard | null;
  settings: {
    voteSeconds: number;
    whiteGuessSeconds: number;
    maxRounds: number | null;
    allowLateJoin: boolean;
    recordClues: boolean;
  };
}

export interface CreateSessionRequest {
  name: string;
  settings: {
    voteSeconds?: number;
    whiteGuessSeconds?: number;
    maxRounds?: number | null;
    allowLateJoin?: boolean;
    recordClues?: boolean;
  };
  category: string;
}

export interface CreateSessionResponse {
  code: SessionCode;
  playerToken: string;
  playerId: PlayerId;
  emoji: string;
}

export interface JoinSessionRequest {
  name: string;
}

export interface JoinSessionResponse {
  playerToken: string;
  playerId: PlayerId;
  emoji: string;
}

export interface PrivateRole {
  role: "white" | "word";
  word?: string;
}

export interface GameEndResult {
  whitePlayerId: PlayerId;
  secretWord: string;
  winner: "white" | "others";
  whiteGuess?: string;
}

export interface PlayerScore {
  playerName: string; // Track by name so scores persist across rejoins
  gamesPlayed: number;
  score: number; // Total score: White wins = +3, Word bearer wins = +1
  whiteWins: number;
  wordBearerWins: number;
}

export interface Scoreboard {
  scores: Record<string, PlayerScore>; // Keyed by player name
  gamesPlayed: number;
}