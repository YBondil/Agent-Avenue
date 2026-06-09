import { test, expect } from 'bun:test';
import {
  buildDeck,
  catches,
  clockwiseGap,
  countOf,
  deltaFor,
  mod14,
} from './game';
import { applyAction, createRoom, startGame, viewFor } from './engine';
import type { RoomState } from './types';

test('deck has 38 cards with correct composition', () => {
  const deck = buildDeck();
  expect(deck.length).toBe(38);
  expect(countOf(deck, 'agentDouble')).toBe(6);
  expect(countOf(deck, 'cryptologue')).toBe(6);
  expect(countOf(deck, 'acolyte')).toBe(1);
  expect(countOf(deck, 'taupe')).toBe(1);
});

// Values taken from the definitive card sprites (client/assets/cards/*.png).
test('effect table matches the card sprites', () => {
  expect([deltaFor('agentDouble', 1), deltaFor('agentDouble', 2), deltaFor('agentDouble', 3)])
    .toEqual([-1, 6, -1]);
  expect([deltaFor('saboteur', 1), deltaFor('saboteur', 2), deltaFor('saboteur', 3)])
    .toEqual([-1, -1, -2]);
  expect([deltaFor('mercenaire', 1), deltaFor('mercenaire', 2), deltaFor('mercenaire', 3)])
    .toEqual([1, 2, 3]);
  // risque-tout 3+ = DEFAITE (no movement)
  expect([deltaFor('risqueTout', 1), deltaFor('risqueTout', 2), deltaFor('risqueTout', 3)])
    .toEqual([2, 3, 0]);
  // cryptologue 3+ = VICTOIRE (no movement)
  expect([deltaFor('cryptologue', 1), deltaFor('cryptologue', 2), deltaFor('cryptologue', 3)])
    .toEqual([0, 0, 0]);
  expect([deltaFor('sentinelle', 1), deltaFor('sentinelle', 2), deltaFor('sentinelle', 3)])
    .toEqual([0, 2, 6]);
  expect(deltaFor('acolyte', 1)).toBe(4);
  expect(deltaFor('taupe', 1)).toBe(-3);
});

test('mod14 wraps both directions', () => {
  expect(mod14(14)).toBe(0);
  expect(mod14(-1)).toBe(13);
  expect(mod14(15)).toBe(1);
});

test('clockwise gap', () => {
  expect(clockwiseGap(0, 7)).toBe(7);
  expect(clockwiseGap(7, 0)).toBe(7);
  expect(clockwiseGap(13, 0)).toBe(1);
});

test('catch: advancing to reach opponent', () => {
  expect(catches(0, 7, 7, 0)).toBe(true);
  expect(catches(0, 7, 6, 0)).toBe(false);
});

test('catch: opponent escapes forward the same turn (rulebook p.9)', () => {
  // You advance 6, opponent advances 2: net 4 < gap 7 -> not caught.
  expect(catches(0, 7, 6, 2)).toBe(false);
  // You advance 6, opponent retreats 1: net 7 >= 7 -> caught.
  expect(catches(0, 7, 6, -1)).toBe(true);
});

test('catch: opponent retreats onto/past your cell (rulebook p.9)', () => {
  expect(catches(0, 3, 0, -3)).toBe(true); // p2 backs from 3 onto p1 at 0
  expect(catches(3, 0, -3, 0)).toBe(false); // p2 is the one caught, not p1
});

test('catch is never mutual', () => {
  for (let g = 1; g < 14; g++) {
    for (let d1 = -3; d1 <= 6; d1++) {
      for (let d2 = -3; d2 <= 6; d2++) {
        expect(catches(0, g, d1, d2) && catches(g, 0, d2, d1)).toBe(false);
      }
    }
  }
});

// Deterministic rng for reproducible deals.
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function newGame(): RoomState {
  const room = createRoom('TEST', seeded(42));
  room.players.p1 = 'a';
  room.players.p2 = 'b';
  startGame(room);
  return room;
}

test('start deals 4 cards each and 30 remain', () => {
  const room = newGame();
  expect(room.hands.p1.length).toBe(4);
  expect(room.hands.p2.length).toBe(4);
  expect(room.deck.length).toBe(30);
  expect(room.phase).toBe('play');
});

test('play requires two different cards unless hand identical', () => {
  const room = newGame();
  room.hands.p1 = ['mercenaire', 'mercenaire', 'saboteur', 'taupe'];
  const err = applyAction(room, 'p1', {
    type: 'play',
    faceUp: 'mercenaire',
    faceDown: 'mercenaire',
  });
  expect(err).toContain('différentes');
});

test('identical hand may play two identical', () => {
  const room = newGame();
  room.hands.p1 = ['saboteur', 'saboteur', 'saboteur', 'saboteur'];
  const err = applyAction(room, 'p1', {
    type: 'play',
    faceUp: 'saboteur',
    faceDown: 'saboteur',
  });
  expect(err).toBeNull();
  expect(room.phase).toBe('recruit');
});

test('full turn: asymmetric movement and redraw', () => {
  const room = newGame();
  room.hands.p1 = ['mercenaire', 'saboteur', 'taupe', 'sentinelle'];
  room.hands.p2 = ['acolyte', 'mercenaire', 'saboteur', 'sentinelle'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'mercenaire', faceDown: 'taupe' });
  // p2 recruits mercenaire (count 1 -> +1): 7 -> 8. p1 keeps taupe (-3): 0 -> 11.
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' });
  expect(room.positions.p2).toBe(8);
  expect(room.positions.p1).toBe(11);
  expect(room.inPlay.p1).toEqual(['taupe']);
  expect(room.inPlay.p2).toEqual(['mercenaire']);
  expect(room.hands.p1.length).toBe(4);
  expect(room.hands.p2.length).toBe(4);
  expect(room.activePlayer).toBe('p2');
});

test('saboteur stacked to 3 moves -2', () => {
  const room = newGame();
  room.inPlay.p1 = ['saboteur', 'saboteur'];
  room.hands.p1 = ['saboteur', 'saboteur', 'saboteur', 'saboteur'];
  room.positions = { p1: 5, p2: 11 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'saboteur', faceDown: 'saboteur' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' }); // p1 keeps a saboteur -> 3rd
  expect(countOf(room.inPlay.p1, 'saboteur')).toBe(3);
  expect(room.positions.p1).toBe(mod14(5 - 2)); // 3
});

test('non-active player cannot play', () => {
  const room = newGame();
  const err = applyAction(room, 'p2', {
    type: 'play',
    faceUp: room.hands.p2[0],
    faceDown: room.hands.p2[1] === room.hands.p2[0] ? room.hands.p2[2] : room.hands.p2[1],
  });
  expect(err).toContain('tour');
});

test('win by catch ends the game', () => {
  const room = newGame();
  room.hands.p1 = ['acolyte', 'saboteur', 'taupe', 'sentinelle'];
  room.positions = { p1: 4, p2: 7 }; // gap 3
  applyAction(room, 'p1', { type: 'play', faceUp: 'acolyte', faceDown: 'saboteur' });
  // p2 recruits saboteur (-1); p1 keeps acolyte (+4) -> net 5 >= 3 -> catch.
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' });
  expect(room.phase).toBe('ended');
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('catch');
});

test('win by 3 cryptologues', () => {
  const room = newGame();
  room.inPlay.p1 = ['cryptologue', 'cryptologue'];
  room.hands.p1 = ['cryptologue', 'saboteur', 'taupe', 'sentinelle'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'saboteur' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' }); // p1 keeps cryptologue
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('3-crypto');
});

test('lose by 3 risque-tout: opponent wins', () => {
  const room = newGame();
  room.inPlay.p1 = ['risqueTout', 'risqueTout'];
  room.hands.p1 = ['risqueTout', 'saboteur', 'taupe', 'sentinelle'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'risqueTout', faceDown: 'saboteur' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceDown' }); // p1 keeps risqueTout
  expect(room.winner).toBe('p2');
  expect(room.winReason).toBe('3-risque');
});

test('tie: both reach 3 cryptologues -> active player wins (rulebook p.8)', () => {
  const room = newGame();
  room.inPlay.p1 = ['cryptologue', 'cryptologue'];
  room.inPlay.p2 = ['cryptologue', 'cryptologue'];
  room.hands.p1 = ['cryptologue', 'cryptologue', 'cryptologue', 'cryptologue'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'cryptologue' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' }); // both gain a 3rd crypto
  expect(countOf(room.inPlay.p1, 'cryptologue')).toBe(3);
  expect(countOf(room.inPlay.p2, 'cryptologue')).toBe(3);
  expect(room.winner).toBe('p1'); // active player breaks the tie
  expect(room.winReason).toBe('3-crypto');
});

test('tie: one player meets a win AND a lose condition -> active wins', () => {
  const room = newGame();
  room.inPlay.p1 = ['cryptologue', 'cryptologue', 'cryptologue', 'risqueTout', 'risqueTout'];
  room.hands.p1 = ['risqueTout', 'saboteur', 'taupe', 'sentinelle'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'saboteur', faceDown: 'risqueTout' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' }); // p1 keeps risqueTout -> 3
  expect(countOf(room.inPlay.p1, 'risqueTout')).toBe(3);
  expect(room.winner).toBe('p1'); // 3-crypto (win) vs 3-risque (lose) -> active wins
  expect(room.winReason).toBe('3-crypto');
});

test('empty deck: closest to catching wins (Main vide, rulebook p.8)', () => {
  const room = newGame();
  room.deck = [];
  room.inPlay = { p1: [], p2: [] };
  room.hands.p1 = ['cryptologue', 'cryptologue']; // identical -> may play two
  room.hands.p2 = ['acolyte']; // only 1 card -> cannot play next turn
  room.positions = { p1: 0, p2: 3 }; // p1 closer (gap 3) than p2 (gap 11)
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'cryptologue' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' }); // crypto -> no movement
  expect(room.phase).toBe('ended');
  expect(room.winner).toBe('p1');
  expect(room.winReason).toBe('hand-empty');
});

test('empty deck: equal distance -> the player who just played wins', () => {
  const room = newGame();
  room.deck = [];
  room.inPlay = { p1: [], p2: [] };
  room.hands.p1 = ['cryptologue', 'cryptologue'];
  room.hands.p2 = ['acolyte'];
  room.positions = { p1: 0, p2: 7 }; // equal distance both ways
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'cryptologue' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' });
  expect(room.phase).toBe('ended');
  expect(room.winner).toBe('p1'); // p1 just took the turn
  expect(room.winReason).toBe('hand-empty');
});

test('empty deck but opponent still has 2 cards: game continues', () => {
  const room = newGame();
  room.deck = [];
  room.inPlay = { p1: [], p2: [] };
  room.hands.p1 = ['cryptologue', 'cryptologue'];
  room.hands.p2 = ['acolyte', 'taupe']; // 2 cards -> can still play
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'cryptologue', faceDown: 'cryptologue' });
  applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' });
  expect(room.phase).toBe('play');
  expect(room.activePlayer).toBe('p2');
});

test('viewFor hides opponent hand and face-down card', () => {
  const room = newGame();
  room.hands.p1 = ['mercenaire', 'saboteur', 'taupe', 'sentinelle'];
  applyAction(room, 'p1', { type: 'play', faceUp: 'mercenaire', faceDown: 'taupe' });
  const p2View = viewFor(room, 'p2');
  expect(p2View.proposed?.faceUp).toBe('mercenaire');
  expect(p2View.proposed?.faceDown).toBeNull();
  expect(p2View.yourHand.length).toBe(4);
  expect(p2View.oppHandCount).toBe(2);
  const p1View = viewFor(room, 'p1');
  expect(p1View.proposed?.faceDown).toBe('taupe');
});
