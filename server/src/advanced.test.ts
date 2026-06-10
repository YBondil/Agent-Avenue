import { test, expect } from 'bun:test';
import { applyAction, createRoom, startGame } from './engine';
import { countOf, mod14 } from './game';
import type { AgentType, BlackMarketType, RoomState } from './types';

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function advGame(): RoomState {
  const room = createRoom('ADV', seeded(7), 'advanced');
  room.players.p1 = 'a';
  room.players.p2 = 'b';
  startGame(room);
  // Disable the market by default so tests opt in explicitly.
  room.market = [null, null, null];
  room.marketDeck = [];
  return room;
}

// p1 (active) plays `card` face up and a filler face down; p2 recruits the
// filler, so p1 keeps `card` as a fresh recruit.
function p1Keeps(room: RoomState, card: AgentType, filler: AgentType = 'cryptologue') {
  const f = filler === card ? 'taupe' : filler;
  room.hands.p1 = [card, f, f, f];
  applyAction(room, 'p1', { type: 'play', faceUp: card, faceDown: f });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' });
}

test('advanced setup: 15-card market, 3 revealed, 12 in pile', () => {
  const room = createRoom('X', seeded(1), 'advanced');
  expect(room.mode).toBe('advanced');
  expect(room.market.filter((c) => c !== null).length).toBe(3);
  expect(room.marketDeck.length).toBe(12);
});

test('base mode has no market', () => {
  const room = createRoom('X', seeded(1), 'base');
  expect(room.mode).toBe('base');
  expect(room.market.length).toBe(0);
  expect(room.marketDeck.length).toBe(0);
});

test('landing exactly on a corner triggers a Marché Noir pick', () => {
  const room = advGame();
  room.market = ['cabaneObservation', 'superordinateur', 'vehiculeSurveillance'];
  room.marketDeck = ['ecranDeFumee'];
  room.positions = { p1: 1, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'acolyte'); // +4 -> cell 5 (corner)
  expect(room.positions.p1).toBe(5);
  expect(room.phase).toBe('market');
  expect(room.pendingMarket).toEqual(['p1']);
  // pick the permanent in slot 0
  applyAction(room, 'p1', { type: 'market', slot: 0 });
  expect(room.blackMarket.p1).toEqual(['cabaneObservation']);
  expect(room.market[0]).toBe('ecranDeFumee'); // refilled from the pile
  expect(room.phase).toBe('play');
});

test('crossing a corner without stopping grants nothing', () => {
  const room = advGame();
  room.market = ['cabaneObservation', null, null];
  room.positions = { p1: 3, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'acolyte'); // 3 -> 7, crosses corner 5 but stops on 7
  expect(room.positions.p1).toBe(7);
  expect(room.phase).toBe('play');
  expect(room.pendingMarket).toEqual([]);
});

test('retreating exactly onto a corner triggers a pick', () => {
  const room = advGame();
  room.market = ['cabaneObservation', null, null];
  room.positions = { p1: 3, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'saboteur'); // -1 -> cell 2 (corner)
  expect(room.positions.p1).toBe(2);
  expect(room.phase).toBe('market');
});

test('permanent: Dispositif de diversion makes Saboteur advance', () => {
  const room = advGame();
  room.blackMarket.p1 = ['dispositifDiversion'];
  room.positions = { p1: 0, p2: 9 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'saboteur'); // base -1 -> negated to +1
  expect(room.positions.p1).toBe(1);
});

test('permanent: Jumelle maléfique doubles Agent Double', () => {
  const room = advGame();
  room.blackMarket.p1 = ['jumelleMalefique'];
  room.positions = { p1: 5, p2: 0 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'agentDouble'); // base -1 -> doubled to -2
  expect(room.positions.p1).toBe(mod14(5 - 2)); // 3
});

test('permanent: Cabane (+2 Mercenaire) and Superordinateur (+3 Cryptologue)', () => {
  let room = advGame();
  room.blackMarket.p1 = ['cabaneObservation'];
  room.positions = { p1: 0, p2: 9 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'mercenaire'); // base +1, +2 -> +3
  expect(room.positions.p1).toBe(3);

  room = advGame();
  room.blackMarket.p1 = ['superordinateur'];
  room.positions = { p1: 0, p2: 9 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'cryptologue', 'taupe'); // base 0, +3 -> +3
  expect(room.positions.p1).toBe(3);
});

test('permanent: Fuite en voiture adds +3 when stopping on a Maison', () => {
  const room = advGame();
  room.blackMarket.p1 = ['fuiteEnVoiture'];
  room.positions = { p1: 6, p2: 0 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'mercenaire'); // +1 -> lands on 7 (Maison) -> +3 -> 10
  expect(room.positions.p1).toBe(10);
});

test('win: Cheffe de meute turns 3 Risque-tout into a victory', () => {
  const room = advGame();
  room.blackMarket.p1 = ['cheffeDeMeute'];
  room.inPlay = { p1: ['risqueTout', 'risqueTout'], p2: [] };
  room.positions = { p1: 5, p2: 9 };
  p1Keeps(room, 'risqueTout'); // 3rd risque-tout (delta 0)
  expect(countOf(room.inPlay.p1, 'risqueTout')).toBe(3);
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('3-risque-meute');
});

test('win: Plan des opérations with 7 different agents', () => {
  const room = advGame();
  room.blackMarket.p1 = ['planDesOperations'];
  room.inPlay = {
    p1: ['agentDouble', 'saboteur', 'mercenaire', 'risqueTout', 'sentinelle', 'taupe'],
    p2: [],
  };
  room.positions = { p1: 1, p2: 9 };
  p1Keeps(room, 'acolyte'); // 7th distinct agent (+4: 1 -> 5, no catch vs 9)
  expect(new Set(room.inPlay.p1).size).toBe(7);
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('7-agents');
});

test('win: Système de sécurité when opponent ends on your Maison', () => {
  const room = advGame();
  room.blackMarket.p1 = ['systemeDeSecurite']; // p1 Maison = cell 0
  room.inPlay = { p1: [], p2: [] };
  room.positions = { p1: 3, p2: 1 };
  // p1 plays cryptologue (stays) face up + saboteur face down; p2 recruits the
  // saboteur (-1): 1 -> 0 = p1's Maison.
  room.hands.p1 = ['cryptologue', 'saboteur', 'taupe', 'sentinelle'];
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'saboteur' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' });
  expect(room.positions.p2).toBe(0);
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('maison');
});

test('immediate: Véhicule de surveillance advances 1 after acquisition', () => {
  const room = advGame();
  room.market = ['vehiculeSurveillance', null, null];
  room.positions = { p1: 1, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'acolyte'); // 1 -> 5 (corner)
  expect(room.phase).toBe('market');
  applyAction(room, 'p1', { type: 'market', slot: 0 });
  expect(room.positions.p1).toBe(6); // +1 from the immediate
  expect(room.marketDiscard).toContain('vehiculeSurveillance');
  expect(room.phase).toBe('play');
});

test('immediate: Écran de fumée recruits the top Agent card', () => {
  const room = advGame();
  room.market = ['ecranDeFumee', null, null];
  room.deck = ['mercenaire']; // pop() -> mercenaire
  room.positions = { p1: 1, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  p1Keeps(room, 'acolyte'); // 1 -> 5 (corner)
  applyAction(room, 'p1', { type: 'market', slot: 0 });
  expect(room.inPlay.p1).toContain('mercenaire');
  expect(room.positions.p1).toBe(6); // mercenaire 1st copy +1 from cell 5
});

test('immediate interactive: Manipulation steals opponent 3rd Cryptologue', () => {
  const room = advGame();
  room.market = ['manipulationEsprit', null, null];
  room.inPlay = { p1: [], p2: ['cryptologue', 'cryptologue', 'cryptologue'] };
  room.positions = { p1: 1, p2: 8 };
  p1Keeps(room, 'acolyte', 'saboteur'); // p1 1 -> 5 (corner); p2 keeps 3 crypto
  expect(room.phase).toBe('market');
  applyAction(room, 'p1', { type: 'market', slot: 0 });
  expect(room.phase).toBe('capacity');
  expect(room.pendingCapacity?.card).toBe('manipulationEsprit');
  applyAction(room, 'p1', { type: 'capacity', agent: 'cryptologue' });
  expect(countOf(room.inPlay.p2, 'cryptologue')).toBe(2); // stripped one
  expect(room.hands.p1).toContain('cryptologue');
  expect(room.winner).toBeNull(); // p2 no longer has 3 -> no win
  expect(room.phase).toBe('play');
});

test('immediate interactive: Coup double recruits 1 of a pair, keeps the other', () => {
  const room = advGame();
  room.market = ['coupDouble', null, null];
  room.positions = { p1: 1, p2: 8 };
  room.inPlay = { p1: [], p2: [] };
  // p1 will land on a corner; give p1 a pair in hand after the play resolves.
  room.hands.p1 = ['acolyte', 'cryptologue', 'mercenaire', 'mercenaire'];
  applyAction(room, 'p1', { type: 'play', faceUp: 'acolyte', faceDown: 'cryptologue' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' }); // p1 keeps acolyte -> cell 5
  // hand now refilled but still has the two mercenaires plus draws; ensure a pair exists
  room.hands.p1 = ['mercenaire', 'mercenaire', 'taupe'];
  applyAction(room, 'p1', { type: 'market', slot: 0 });
  expect(room.phase).toBe('capacity');
  applyAction(room, 'p1', { type: 'capacity', agent: 'mercenaire' });
  expect(countOf(room.inPlay.p1, 'mercenaire')).toBe(1); // recruited one
  expect(countOf(room.hands.p1, 'mercenaire')).toBe(1); // kept the other
});

test('reset preserves the mode', () => {
  const room = advGame();
  applyAction(room, 'p1', { type: 'reset' });
  expect(room.mode).toBe('advanced');
  expect(room.market.filter((c: BlackMarketType | null) => c !== null).length).toBe(3);
});
