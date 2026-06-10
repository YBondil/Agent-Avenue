// Pure game logic for Agent Avenue (Mode de Base). No IO, no networking.
import type { AgentType, PlayerId } from "./types";

export const TRACK = 14; // cells on the ring
export const HAND_SIZE = 4;

// Mode Avancé board geometry: Maison (start) cells and the 4 Marché Noir corners.
export const MAISON: Record<PlayerId, number> = { p1: 0, p2: 7 };
export const MARCHE_NOIR_CELLS = [3, 4, 10, 11];
export const isMarcheNoir = (cell: number) => MARCHE_NOIR_CELLS.includes(cell);
export const isMaison = (cell: number) => cell === MAISON.p1 || cell === MAISON.p2;

// Quantities in the 38-card deck.
export const DECK_COMPOSITION: Record<AgentType, number> = {
  agentDouble: 6,
  saboteur: 6,
  mercenaire: 6,
  risqueTout: 6,
  cryptologue: 6,
  sentinelle: 6,
  acolyte: 1,
  taupe: 1,
};

export const AGENT_LABELS: Record<AgentType, string> = {
  agentDouble: "Agent Double",
  saboteur: "Saboteur",
  mercenaire: "Mercenaire",
  risqueTout: "Risque-tout",
  cryptologue: "Cryptologue",
  sentinelle: "Sentinelle",
  acolyte: "Acolyte",
  taupe: "Taupe",
};

// Movement delta as a function of how many copies of the agent are in the
// player's zone (counting the freshly recruited card). The 3+ cells that read
// VICTORY (cryptologue) or DEFEAT (risque-tout) produce no movement here; those
// outcomes are detected separately as win/lose conditions.
export function deltaFor(type: AgentType, count: number): number {
  switch (type) {
    case "agentDouble":
      return count === 1 ? -1 : count === 2 ? 6 : -1;
    case "saboteur":
      return count === 1 ? -1 : count === 2 ? -1 : -2;
    case "mercenaire":
      return count === 1 ? 1 : count === 2 ? 2 : 3;
    case "risqueTout":
      return count === 1 ? 2 : count === 2 ? 3 : 0;
    case "cryptologue":
      return 0;
    case "sentinelle":
      return count === 1 ? 0 : count === 2 ? 2 : 6;
    case "acolyte":
      return 4;
    case "taupe":
      return -3;
  }
}
export function buildDeck(): AgentType[] {
  const deck: AgentType[] = [];
  (Object.keys(DECK_COMPOSITION) as AgentType[]).forEach((type) => {
    for (let i = 0; i < DECK_COMPOSITION[type]; i++) deck.push(type);
  });
  return deck;
}

// Fisher-Yates. Accepts an injectable rng for deterministic tests.
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const mod14 = (n: number) => ((n % TRACK) + TRACK) % TRACK;

// Clockwise gap from `from` to `to`: number of clockwise steps to reach `to`.
export const clockwiseGap = (from: number, to: number) => mod14(to - from);

export const countOf = (zone: AgentType[], type: AgentType) =>
  zone.filter((c) => c === type).length;

export const other = (p: PlayerId): PlayerId => (p === "p1" ? "p2" : "p1");

// Both pawns move simultaneously. A player catches the opponent when its net
// clockwise gain (own delta minus opponent delta) covers the pre-move clockwise
// gap to the opponent. This correctly handles overtaking, an opponent backing
// onto your cell, and an opponent escaping forward on the same turn.
export function catches(
  myPos: number,
  oppPos: number,
  myDelta: number,
  oppDelta: number,
): boolean {
  const gap = clockwiseGap(myPos, oppPos); // 0..13
  if (gap === 0) return false; // shouldn't happen at turn start
  return myDelta - oppDelta >= gap;
}
