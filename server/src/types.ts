// Shared type definitions for Agent Avenue (Mode de Base).
// The client mirrors the `PlayerView` and message types from this file.

export type AgentType =
  | 'agentDouble'
  | 'saboteur'
  | 'mercenaire'
  | 'risqueTout'
  | 'cryptologue'
  | 'sentinelle'
  | 'acolyte'
  | 'taupe';

export type PlayerId = 'p1' | 'p2';

export type Phase = 'lobby' | 'play' | 'recruit' | 'ended';

export type WinReason = 'catch' | '3-crypto' | '3-risque' | 'hand-empty';

// Authoritative server-side room state. Never sent verbatim to a client
// (it would leak hands and the face-down card); use `viewFor` instead.
export type RoomState = {
  code: string;
  players: { p1: string | null; p2: string | null }; // role -> client id
  deck: AgentType[];
  hands: { p1: AgentType[]; p2: AgentType[] };
  inPlay: { p1: AgentType[]; p2: AgentType[] };
  positions: { p1: number; p2: number }; // 0..13 on a 14-cell ring
  discardsUsed: { p1: number; p2: number };
  activePlayer: PlayerId;
  phase: Phase;
  // Cards the active player committed in the play phase. The opponent picks one.
  proposedCards: { faceUp: AgentType; faceDown: AgentType } | null;
  winner: PlayerId | null;
  winReason?: WinReason;
  createdAt: number;
};

// Redacted, per-player projection of RoomState sent over the WebSocket.
export type PlayerView = {
  code: string;
  you: PlayerId | null; // null for a spectator (room full)
  players: { p1: boolean; p2: boolean }; // seat occupied?
  yourHand: AgentType[];
  oppHandCount: number;
  deckCount: number;
  inPlay: { p1: AgentType[]; p2: AgentType[] }; // recruited cards are public
  positions: { p1: number; p2: number };
  discardsUsed: { p1: number; p2: number };
  activePlayer: PlayerId;
  phase: Phase;
  // faceDown is null until you are allowed to see it (you played it, or it
  // has been resolved into a play zone).
  proposed: { faceUp: AgentType; faceDown: AgentType | null } | null;
  winner: PlayerId | null;
  winReason?: WinReason;
};

// Messages: client -> server
export type ClientMessage =
  | { type: 'start' }
  | { type: 'discard'; card: AgentType }
  | { type: 'play'; faceUp: AgentType; faceDown: AgentType }
  | { type: 'recruit'; choice: 'faceUp' | 'faceDown' }
  | { type: 'reset' };

// Messages: server -> client
export type ServerMessage =
  | { type: 'state'; view: PlayerView }
  | { type: 'error'; message: string };
