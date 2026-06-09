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
import type { AgentType, RoomState } from './types';

test('deck has 38 cards with correct composition', () => {
  const deck = buildDeck();
  expect(deck.length).toBe(38);
  expect(countOf(deck, 'agentDouble')).toBe(6);
  expect(countOf(deck, 'cryptologue')).toBe(6);
  expect(countOf(deck, 'acolyte')).toBe(1);
  expect(countOf(deck, 'taupe')).toBe(1);
});

test('effect table matches the rulebook', () => {
  expect(deltaFor('agentDouble', 1)).toBe(-1);
  expect(deltaFor('agentDouble', 2)).toBe(6);
  expect(deltaFor('agentDouble', 3)).toBe(-1);
  expect(deltaFor('saboteur', 1)).toBe(-1);
  expect(deltaFor('saboteur', 2)).toBe(0);
  expect(deltaFor('saboteur', 3)).toBe(2);
  expect(deltaFor('mercenaire', 1)).toBe(2);
  expect(deltaFor('mercenaire', 3)).toBe(3);
  expect(deltaFor('risqueTout', 1)).toBe(3);
  expect(deltaFor('risqueTout', 3)).toBe(0); // DEFEAT, no move
  expect(deltaFor('cryptologue', 3)).toBe(0); // VICTORY, no move
  expect(deltaFor('sentinelle', 3)).toBe(6);
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
  // p1 at 0, p2 at 7, gap 7. p1 +7 covers it.
  expect(catches(0, 7, 7, 0)).toBe(true);
  expect(catches(0, 7, 6, 0)).toBe(false);
});

test('catch: opponent escapes forward same turn', () => {
  // p1 advances 6, p2 advances 2, net 4 < gap 7 -> no catch.
  expect(catches(0, 7, 6, 2)).toBe(false);
  // p1 advances 6, p2 retreats 1, net 7 >= 7 -> catch.
  expect(catches(0, 7, 6, -1)).toBe(true);
});

test('catch: opponent retreats onto your cell', () => {
  // p1 at 0, p2 at 3 (gap 3). p2 retreats 3 onto p1 -> p1 catches p2.
  expect(catches(0, 3, 0, -3)).toBe(true);
  // and p2 does not catch p1 the same move.
  expect(catches(3, 0, -3, 0)).toBe(false);
});

test('catch is never mutual', () => {
  for (let g = 1; g < 14; g++) {
    for (let d1 = -3; d1 <= 6; d1++) {
      for (let d2 = -3; d2 <= 6; d2++) {
        const a = catches(0, g, d1, d2);
        const b = catches(g, 0, d2, d1);
        expect(a && b).toBe(false);
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

test('full turn: play then recruit moves both pawns and redraws', () => {
  const room = newGame();
  room.hands.p1 = ['mercenaire', 'saboteur', 'taupe', 'sentinelle'];
  room.hands.p2 = ['acolyte', 'mercenaire', 'saboteur', 'sentinelle'];
  room.positions = { p1: 0, p2: 7 };
  applyAction(room, 'p1', { type: 'play', faceUp: 'mercenaire', faceDown: 'taupe' });
  expect(room.phase).toBe('recruit');
  // p2 recruits faceUp (mercenaire +2); p1 takes taupe (-3).
  const err = applyAction(room, 'p2', { type: 'recruit', choice: 'faceUp' });
  expect(err).toBeNull();
  expect(room.positions.p1).toBe(mod14(0 - 3)); // 11
  expect(room.positions.p2).toBe(7 + 2); // 9
  expect(room.inPlay.p1).toEqual(['taupe']);
  expect(room.inPlay.p2).toEqual(['mercenaire']);
  expect(room.hands.p1.length).toBe(4);
  expect(room.hands.p2.length).toBe(4);
  expect(room.activePlayer).toBe('p2'); // handed off
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
  // p2 recruits the face-down saboteur (-1); p1 keeps acolyte (+4) -> catches (net 5 >= 3).
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

test('viewFor hides opponent hand and face-down card', () => {
  const room = newGame();
  room.hands.p1 = ['mercenaire', 'saboteur', 'taupe', 'sentinelle'];
  applyAction(room, 'p1', { type: 'play', faceUp: 'mercenaire', faceDown: 'taupe' });
  const p2View = viewFor(room, 'p2');
  expect(p2View.proposed?.faceUp).toBe('mercenaire');
  expect(p2View.proposed?.faceDown).toBeNull(); // hidden from recruiter
  expect(p2View.yourHand.length).toBe(4);
  expect(p2View.oppHandCount).toBe(2); // p1 committed two
  const p1View = viewFor(room, 'p1');
  expect(p1View.proposed?.faceDown).toBe('taupe'); // active player sees own card
});
