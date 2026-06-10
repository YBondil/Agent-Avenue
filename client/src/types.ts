export type AgentType = 'agentDouble' | 'saboteur' | 'mercenaire' | 'risqueTout'
  | 'cryptologue' | 'sentinelle' | 'acolyte' | 'taupe';
export type PlayerId = 'p1' | 'p2';
export type Mode = 'base' | 'advanced';

export type BlackMarketType =
  | 'cheffeDeMeute' | 'planDesOperations' | 'systemeDeSecurite' | 'fuiteEnVoiture'
  | 'cabaneObservation' | 'superordinateur' | 'dispositifDiversion' | 'jumelleMalefique'
  | 'vehiculeSurveillance' | 'ecranDeFumee' | 'avantPoste' | 'recrueSecrete'
  | 'coupDouble' | 'petitRepos' | 'manipulationEsprit';

export type Phase = 'lobby' | 'play' | 'recruit' | 'market' | 'capacity' | 'ended';
export type WinReason =
  | 'catch' | '3-crypto' | '3-risque' | 'hand-empty'
  | '3-risque-meute' | '7-agents' | 'maison';

export type PlayerView = {
  code: string;
  you: PlayerId | null;              // null = spectator
  players: { p1: boolean; p2: boolean }; // seat occupied?
  yourHand: AgentType[];
  oppHandCount: number;
  deckCount: number;
  inPlay: { p1: AgentType[]; p2: AgentType[] }; // recruited cards, public
  positions: { p1: number; p2: number };        // 0..13 on a 14-cell ring
  activePlayer: PlayerId;
  phase: Phase;
  proposed: { faceUp: AgentType; faceDown: AgentType | null } | null; // faceDown null = hidden from you
  winner: PlayerId | null;
  winReason?: WinReason;

  // --- Mode Avancé only ---
  mode: Mode;
  market: (BlackMarketType | null)[];
  marketDeckCount: number;
  blackMarket: { p1: BlackMarketType[]; p2: BlackMarketType[] };
  pendingMarket: PlayerId | null;
  pendingCapacity:
    | { player: PlayerId; card: BlackMarketType; agents: AgentType[]; optional: boolean }
    | null;
};
