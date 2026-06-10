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

export type Mode = 'base' | 'advanced';

// Marché Noir cards (Mode Avancé). See reports/marche-noir-cards.md.
export type BlackMarketType =
  | 'cheffeDeMeute'
  | 'planDesOperations'
  | 'systemeDeSecurite'
  | 'fuiteEnVoiture'
  | 'cabaneObservation'
  | 'superordinateur'
  | 'dispositifDiversion'
  | 'jumelleMalefique'
  | 'vehiculeSurveillance'
  | 'ecranDeFumee'
  | 'avantPoste'
  | 'recrueSecrete'
  | 'coupDouble'
  | 'petitRepos'
  | 'manipulationEsprit';

// 'market' = a player must pick a Marché Noir card; 'capacity' = an interactive
// immediate capability awaits the player's choice.
export type Phase = 'lobby' | 'play' | 'recruit' | 'market' | 'capacity' | 'ended';

export type WinReason =
  | 'catch'
  | '3-crypto'
  | '3-risque'
  | 'hand-empty'
  | '3-risque-meute' // Cheffe de meute: 3 Risque-tout wins
  | '7-agents' // Plan des opérations
  | 'maison'; // Système de sécurité

// Authoritative server-side room state. Never sent verbatim to a client
// (it would leak hands and the face-down card); use `viewFor` instead.
export type RoomState = {
  code: string;
  mode: Mode;
  players: { p1: string | null; p2: string | null }; // role -> client id
  deck: AgentType[];
  hands: { p1: AgentType[]; p2: AgentType[] };
  inPlay: { p1: AgentType[]; p2: AgentType[] };
  positions: { p1: number; p2: number }; // 0..13 on a 14-cell ring
  activePlayer: PlayerId;
  phase: Phase;
  // Cards the active player committed in the play phase. The opponent picks one.
  proposedCards: { faceUp: AgentType; faceDown: AgentType } | null;
  winner: PlayerId | null;
  winReason?: WinReason;
  createdAt: number;

  // --- Mode Avancé only ---
  marketDeck: BlackMarketType[];          // face-down Marché Noir pile
  market: (BlackMarketType | null)[];     // 3 face-up slots (null if pile dry)
  marketDiscard: BlackMarketType[];
  blackMarket: { p1: BlackMarketType[]; p2: BlackMarketType[] }; // permanents in play
  pendingMarket: PlayerId[];              // players owed a Marché Noir pick (FIFO)
  pendingCapacity: { player: PlayerId; card: BlackMarketType } | null;
  // Catch flags accumulated during a turn, resolved once the market/capacity
  // sub-steps finish (win is only decided at "Terminer le tour").
  pendingCaught: { p1: boolean; p2: boolean };
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
  activePlayer: PlayerId;
  phase: Phase;
  // faceDown is null until you are allowed to see it (you played it, or it
  // has been resolved into a play zone).
  proposed: { faceUp: AgentType; faceDown: AgentType | null } | null;
  winner: PlayerId | null;
  winReason?: WinReason;

  // --- Mode Avancé only ---
  mode: Mode;
  market: (BlackMarketType | null)[];
  marketDeckCount: number;
  blackMarket: { p1: BlackMarketType[]; p2: BlackMarketType[] };
  pendingMarket: PlayerId | null; // who must currently pick from the market
  // When an interactive immediate capability awaits you, the eligible choices.
  pendingCapacity:
    | { player: PlayerId; card: BlackMarketType; agents: AgentType[]; optional: boolean }
    | null;
};

// Messages: client -> server
export type ClientMessage =
  | { type: 'start' }
  | { type: 'play'; faceUp: AgentType; faceDown: AgentType }
  | { type: 'recruit'; choice: 'faceUp' | 'faceDown' }
  | { type: 'market'; slot: number } // pick a Marché Noir card (advanced)
  | { type: 'capacity'; agent?: AgentType; recruit?: boolean } // resolve interactive immediate
  | { type: 'reset' };

// Messages: server -> client
export type ServerMessage =
  | { type: 'state'; view: PlayerView }
  | { type: 'error'; message: string };
