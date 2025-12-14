export type SessionCode = string;
export type PlayerId = string;
export type GameMode = "word" | "places_roles";

export interface PlaceWithRoles {
  place: string;
  roles: string[];
}

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
  gameMode: GameMode;
  secretWordCategory: string;
  secretWord: string | null;
  // For places_roles mode
  secretPlace: string | null;
  playerRoles: Record<PlayerId, string> | null;
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
  gameMode?: GameMode;
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
  role: "white" | "word" | "place_role";
  word?: string;
  // For places_roles mode
  place?: string;
  playerRole?: string;
}

export interface GameEndResult {
  whitePlayerId: PlayerId;
  secretWord: string;
  winner: "white" | "others";
  whiteGuess?: string;
  // For places_roles mode
  secretPlace?: string;
  playerRoles?: Record<PlayerId, string>;
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