// Stateful game engine: builds rooms and applies player actions to a RoomState.
// Functions mutate the passed-in state and return an error string when an action
// is rejected (null on success).
import type {
  AgentType,
  ClientMessage,
  PlayerId,
  PlayerView,
  RoomState,
} from './types';
import {
  HAND_SIZE,
  MAX_DISCARDS,
  TRACK,
  buildDeck,
  catches,
  clockwiseGap,
  countOf,
  deltaFor,
  mod14,
  other,
  shuffle,
} from './game';

export function createRoom(code: string, rng: () => number = Math.random): RoomState {
  return {
    code,
    players: { p1: null, p2: null },
    deck: shuffle(buildDeck(), rng),
    hands: { p1: [], p2: [] },
    inPlay: { p1: [], p2: [] },
    positions: { p1: 0, p2: 7 }, // opposite cells on the ring
    discardsUsed: { p1: 0, p2: 0 },
    activePlayer: 'p1',
    phase: 'lobby',
    proposedCards: null,
    winner: null,
    createdAt: Date.now(),
  };
}

function draw(state: RoomState, who: PlayerId, n: number) {
  for (let i = 0; i < n && state.deck.length > 0; i++) {
    state.hands[who].push(state.deck.pop()!);
  }
}

function removeOne(hand: AgentType[], card: AgentType): boolean {
  const idx = hand.indexOf(card);
  if (idx === -1) return false;
  hand.splice(idx, 1);
  return true;
}

// Deal opening hands and begin the play phase. Requires both seats filled.
export function startGame(state: RoomState): string | null {
  if (state.phase !== 'lobby') return 'La partie a déjà commencé.';
  if (!state.players.p1 || !state.players.p2) return 'Deux joueurs sont requis.';
  draw(state, 'p1', HAND_SIZE);
  draw(state, 'p2', HAND_SIZE);
  state.phase = 'play';
  return null;
}

// Active player discards one card (face down) and redraws. Capped per player.
function applyDiscard(state: RoomState, who: PlayerId, card: AgentType): string | null {
  if (state.phase !== 'play') return "Ce n'est pas la phase de jeu.";
  if (who !== state.activePlayer) return "Ce n'est pas votre tour.";
  if (state.discardsUsed[who] >= MAX_DISCARDS) return 'Plus de défausses disponibles.';
  if (state.deck.length === 0) return 'La pioche est vide.';
  if (!removeOne(state.hands[who], card)) return "Carte absente de votre main.";
  state.discardsUsed[who] += 1;
  draw(state, who, 1);
  return null;
}

// Active player commits two cards: one face up, one face down. They must be
// different cards unless the whole hand is identical.
function applyPlay(
  state: RoomState,
  who: PlayerId,
  faceUp: AgentType,
  faceDown: AgentType
): string | null {
  if (state.phase !== 'play') return "Ce n'est pas la phase de jeu.";
  if (who !== state.activePlayer) return "Ce n'est pas votre tour.";
  const hand = state.hands[who];
  if (hand.length < 2) return 'Pas assez de cartes pour jouer.';

  const allIdentical = hand.every((c) => c === hand[0]);
  if (faceUp === faceDown && !allIdentical) {
    return 'Les deux cartes doivent être différentes.';
  }
  // Verify both cards are actually in hand (two distinct slots).
  const temp = hand.slice();
  if (!removeOne(temp, faceUp) || !removeOne(temp, faceDown)) {
    return 'Cartes invalides.';
  }
  removeOne(hand, faceUp);
  removeOne(hand, faceDown);
  state.proposedCards = { faceUp, faceDown };
  state.phase = 'recruit';
  return null;
}

// Opponent recruits one of the two proposed cards; the active player takes the
// other. Both pawns move simultaneously, both redraw, then win conditions are
// resolved.
function applyRecruit(
  state: RoomState,
  who: PlayerId,
  choice: 'faceUp' | 'faceDown'
): string | null {
  if (state.phase !== 'recruit' || !state.proposedCards) {
    return "Ce n'est pas la phase de recrutement.";
  }
  const opponent = other(state.activePlayer);
  if (who !== opponent) return "C'est à l'adversaire de recruter.";

  const { faceUp, faceDown } = state.proposedCards;
  const oppCard = choice === 'faceUp' ? faceUp : faceDown;
  const activeCard = choice === 'faceUp' ? faceDown : faceUp;
  const active = state.activePlayer;

  // Add to zones, then compute each delta from the post-add count.
  state.inPlay[active].push(activeCard);
  state.inPlay[opponent].push(oppCard);
  const activeDelta = deltaFor(activeCard, countOf(state.inPlay[active], activeCard));
  const oppDelta = deltaFor(oppCard, countOf(state.inPlay[opponent], oppCard));

  // Catch is decided from pre-move positions and the two deltas (simultaneous).
  const activeCatches = catches(
    state.positions[active],
    state.positions[opponent],
    activeDelta,
    oppDelta
  );
  const oppCatches = catches(
    state.positions[opponent],
    state.positions[active],
    oppDelta,
    activeDelta
  );

  state.positions[active] = mod14(state.positions[active] + activeDelta);
  state.positions[opponent] = mod14(state.positions[opponent] + oppDelta);

  state.proposedCards = null;
  draw(state, active, HAND_SIZE - state.hands[active].length);
  draw(state, opponent, HAND_SIZE - state.hands[opponent].length);

  resolveEndOfTurn(state, { p1: catchOf('p1', active, activeCatches, oppCatches), p2: catchOf('p2', active, activeCatches, oppCatches) });
  return null;
}

function catchOf(
  p: PlayerId,
  active: PlayerId,
  activeCatches: boolean,
  oppCatches: boolean
): boolean {
  return p === active ? activeCatches : oppCatches;
}

// Evaluate win conditions in order A (catch) > B (3 cryptologues) > C (3
// risque-tout = that player loses). When conditions point to different winners,
// the active player wins the tie.
function resolveEndOfTurn(state: RoomState, caught: { p1: boolean; p2: boolean }) {
  const claims: { winner: PlayerId; reason: RoomState['winReason'] }[] = [];

  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (caught[p]) claims.push({ winner: p, reason: 'catch' });
  });
  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (countOf(state.inPlay[p], 'cryptologue') >= 3) {
      claims.push({ winner: p, reason: '3-crypto' });
    }
  });
  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (countOf(state.inPlay[p], 'risqueTout') >= 3) {
      claims.push({ winner: other(p), reason: '3-risque' });
    }
  });

  if (claims.length > 0) {
    const winners = new Set(claims.map((c) => c.winner));
    if (winners.size === 1) {
      const c = claims[0];
      finish(state, c.winner, c.reason);
    } else {
      // Tie between different winners -> active player wins.
      const own = claims.find((c) => c.winner === state.activePlayer);
      finish(state, state.activePlayer, own ? own.reason : 'catch');
    }
    return;
  }

  // No win: hand off to the opponent. If they cannot play, end by proximity.
  state.activePlayer = other(state.activePlayer);
  state.phase = 'play';
  if (state.hands[state.activePlayer].length < 2) {
    endByProximity(state);
  }
}

function finish(state: RoomState, winner: PlayerId, reason: RoomState['winReason']) {
  state.winner = winner;
  state.winReason = reason;
  state.phase = 'ended';
}

// Empty-deck endgame: the player closest to catching the other (smallest
// clockwise gap to the opponent) wins; ties go to the active player.
function endByProximity(state: RoomState) {
  const gapP1 = clockwiseGap(state.positions.p1, state.positions.p2);
  const gapP2 = clockwiseGap(state.positions.p2, state.positions.p1);
  let winner: PlayerId;
  if (gapP1 < gapP2) winner = 'p1';
  else if (gapP2 < gapP1) winner = 'p2';
  else winner = state.activePlayer;
  finish(state, winner, 'hand-empty');
}

// Dispatch a client action by role. Returns an error string or null.
export function applyAction(
  state: RoomState,
  who: PlayerId,
  msg: ClientMessage
): string | null {
  switch (msg.type) {
    case 'start':
      return startGame(state);
    case 'discard':
      return applyDiscard(state, who, msg.card);
    case 'play':
      return applyPlay(state, who, msg.faceUp, msg.faceDown);
    case 'recruit':
      return applyRecruit(state, who, msg.choice);
    case 'reset': {
      const fresh = createRoom(state.code);
      fresh.players = state.players;
      Object.assign(state, fresh);
      return null;
    }
    default:
      return 'Action inconnue.';
  }
}

// Project the authoritative state to what a given role is allowed to see.
export function viewFor(state: RoomState, you: PlayerId | null): PlayerView {
  let proposed: PlayerView['proposed'] = null;
  if (state.proposedCards) {
    const seeFaceDown = you === state.activePlayer; // active player played it
    proposed = {
      faceUp: state.proposedCards.faceUp,
      faceDown: seeFaceDown ? state.proposedCards.faceDown : null,
    };
  }
  const opp = you ? other(you) : 'p2';
  return {
    code: state.code,
    you,
    players: { p1: state.players.p1 !== null, p2: state.players.p2 !== null },
    yourHand: you ? state.hands[you] : [],
    oppHandCount: you ? state.hands[opp].length : 0,
    deckCount: state.deck.length,
    inPlay: state.inPlay,
    positions: state.positions,
    discardsUsed: state.discardsUsed,
    activePlayer: state.activePlayer,
    phase: state.phase,
    proposed,
    winner: state.winner,
    winReason: state.winReason,
  };
}

export { TRACK };
