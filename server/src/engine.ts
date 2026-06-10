// Stateful game engine: builds rooms and applies player actions to a RoomState.
// Functions mutate the passed-in state and return an error string when an action
// is rejected (null on success). Mode Avancé logic is gated behind state.mode.
import type {
  AgentType,
  BlackMarketType,
  ClientMessage,
  Mode,
  PlayerId,
  PlayerView,
  RoomState,
} from './types';
import {
  HAND_SIZE,
  MAISON,
  TRACK,
  buildDeck,
  catches,
  clockwiseGap,
  countOf,
  deltaFor,
  isMaison,
  isMarcheNoir,
  mod14,
  other,
  shuffle,
} from './game';
import { buildMarketDeck, isPermanent } from './blackMarket';

export function createRoom(
  code: string,
  rng: () => number = Math.random,
  mode: Mode = 'base'
): RoomState {
  const marketDeck = mode === 'advanced' ? shuffle(buildMarketDeck(), rng) : [];
  const market: (BlackMarketType | null)[] =
    mode === 'advanced' ? [marketDeck.pop() ?? null, marketDeck.pop() ?? null, marketDeck.pop() ?? null] : [];
  return {
    code,
    mode,
    players: { p1: null, p2: null },
    deck: shuffle(buildDeck(), rng),
    hands: { p1: [], p2: [] },
    inPlay: { p1: [], p2: [] },
    positions: { p1: MAISON.p1, p2: MAISON.p2 },
    activePlayer: 'p1',
    phase: 'lobby',
    proposedCards: null,
    winner: null,
    createdAt: Date.now(),
    marketDeck,
    market,
    marketDiscard: [],
    blackMarket: { p1: [], p2: [] },
    pendingMarket: [],
    pendingCapacity: null,
    pendingCaught: { p1: false, p2: false },
  };
}

function draw(state: RoomState, who: PlayerId, n: number) {
  for (let i = 0; i < n && state.deck.length > 0; i++) state.hands[who].push(state.deck.pop()!);
}

function refill(state: RoomState, who: PlayerId) {
  draw(state, who, HAND_SIZE - state.hands[who].length);
}

function removeOne(arr: AgentType[], card: AgentType): boolean {
  const idx = arr.indexOf(card);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

const distinctCount = (arr: AgentType[]) => new Set(arr).size;
const ownsBM = (state: RoomState, p: PlayerId, c: BlackMarketType) =>
  state.blackMarket[p].includes(c);
const marketHasCard = (state: RoomState) => state.market.some((c) => c !== null);

export function startGame(state: RoomState): string | null {
  if (state.phase !== 'lobby') return 'La partie a déjà commencé.';
  if (!state.players.p1 || !state.players.p2) return 'Deux joueurs sont requis.';
  draw(state, 'p1', HAND_SIZE);
  draw(state, 'p2', HAND_SIZE);
  state.phase = 'play';
  return null;
}

// --- Movement (with Mode Avancé permanent modifiers) ---

// Base movement of a freshly recruited agent, adjusted by recruit-trigger
// permanents (NOT including the Fuite en voiture maison bonus).
function effectiveAgentDelta(state: RoomState, player: PlayerId, agent: AgentType): number {
  let d = deltaFor(agent, countOf(state.inPlay[player], agent));
  const perms = state.blackMarket[player];
  if (agent === 'saboteur' && perms.includes('dispositifDiversion')) d = -d;
  if (agent === 'agentDouble' && perms.includes('jumelleMalefique')) d = d * 2;
  if (agent === 'mercenaire' && perms.includes('cabaneObservation')) d += 2;
  if (agent === 'cryptologue' && perms.includes('superordinateur')) d += 3;
  return d;
}

// Fuite en voiture: stopping exactly on a Maison case grants +3 (only if moved).
function fuiteBonus(state: RoomState, player: PlayerId, from: number, delta: number): number {
  if (delta !== 0 && ownsBM(state, player, 'fuiteEnVoiture') && isMaison(mod14(from + delta))) {
    return 3;
  }
  return 0;
}

// Move one pawn sequentially (the opponent is stationary): apply fuite, detect a
// sequential catch, land the pawn, and queue a Marché Noir pick if it stops on a
// corner. Used by immediate Marché Noir capabilities.
function pawnAdvance(state: RoomState, player: PlayerId, base: number) {
  const from = state.positions[player];
  const total = base + fuiteBonus(state, player, from, base);
  if (total !== 0 && catches(from, state.positions[other(player)], total, 0)) {
    state.pendingCaught[player] = true;
  }
  state.positions[player] = mod14(from + total);
  if (state.mode === 'advanced' && total !== 0 && isMarcheNoir(state.positions[player]) && marketHasCard(state)) {
    state.pendingMarket.push(player);
  }
}

// Recruit an agent for a player outside the simultaneous recruit step (immediate
// capabilities): add it to the zone and advance the pawn.
function recruitAgentSequential(state: RoomState, player: PlayerId, agent: AgentType) {
  state.inPlay[player].push(agent);
  pawnAdvance(state, player, effectiveAgentDelta(state, player, agent));
}

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
  if (faceUp === faceDown && !allIdentical) return 'Les deux cartes doivent être différentes.';
  const temp = hand.slice();
  if (!removeOne(temp, faceUp) || !removeOne(temp, faceDown)) return 'Cartes invalides.';
  removeOne(hand, faceUp);
  removeOne(hand, faceDown);
  state.proposedCards = { faceUp, faceDown };
  state.phase = 'recruit';
  return null;
}

function applyRecruit(
  state: RoomState,
  who: PlayerId,
  choice: 'faceUp' | 'faceDown'
): string | null {
  if (state.phase !== 'recruit' || !state.proposedCards) return "Ce n'est pas la phase de recrutement.";
  const active = state.activePlayer;
  const opponent = other(active);
  if (who !== opponent) return "C'est à l'adversaire de recruter.";

  const { faceUp, faceDown } = state.proposedCards;
  const oppCard = choice === 'faceUp' ? faceUp : faceDown;
  const activeCard = choice === 'faceUp' ? faceDown : faceUp;

  state.inPlay[active].push(activeCard);
  state.inPlay[opponent].push(oppCard);

  // Effective deltas + Fuite bonus, then a SIMULTANEOUS catch (net-gain model).
  const baseA = effectiveAgentDelta(state, active, activeCard);
  const baseO = effectiveAgentDelta(state, opponent, oppCard);
  const dA = baseA + fuiteBonus(state, active, state.positions[active], baseA);
  const dO = baseO + fuiteBonus(state, opponent, state.positions[opponent], baseO);

  state.pendingCaught = { p1: false, p2: false };
  if (catches(state.positions[active], state.positions[opponent], dA, dO)) state.pendingCaught[active] = true;
  if (catches(state.positions[opponent], state.positions[active], dO, dA)) state.pendingCaught[opponent] = true;

  state.positions[active] = mod14(state.positions[active] + dA);
  state.positions[opponent] = mod14(state.positions[opponent] + dO);
  state.proposedCards = null;

  // Marché Noir acquisitions (active player picks first if both landed).
  if (state.mode === 'advanced') {
    if (dA !== 0 && isMarcheNoir(state.positions[active]) && marketHasCard(state)) state.pendingMarket.push(active);
    if (dO !== 0 && isMarcheNoir(state.positions[opponent]) && marketHasCard(state)) state.pendingMarket.push(opponent);
  }

  continueTurn(state);
  return null;
}

// Advance the turn: resolve any pending Marché Noir pick / interactive capability,
// otherwise finish the turn (Étape 3).
function continueTurn(state: RoomState) {
  if (state.pendingCapacity) {
    state.phase = 'capacity';
    return;
  }
  if (state.pendingMarket.length > 0) {
    state.phase = 'market';
    return;
  }
  resolveEndOfTurn(state);
}

// --- Marché Noir acquisition ---

function applyMarket(state: RoomState, who: PlayerId, slot: number): string | null {
  if (state.phase !== 'market') return "Ce n'est pas le moment de choisir une carte.";
  if (state.pendingMarket[0] !== who) return "Ce n'est pas à vous de choisir.";
  const card = state.market[slot];
  if (card === undefined || card === null) return 'Emplacement vide.';

  state.market[slot] = state.marketDeck.pop() ?? null; // refill immediately
  state.pendingMarket.shift();

  if (isPermanent(card)) {
    state.blackMarket[who].push(card);
  } else {
    state.marketDiscard.push(card);
    resolveImmediate(state, who, card);
  }
  continueTurn(state);
  return null;
}

// Eligible agent choices for an interactive immediate capability (empty if none).
function capacityOptions(state: RoomState, player: PlayerId, card: BlackMarketType): AgentType[] {
  const uniq = (a: AgentType[]) => [...new Set(a)];
  switch (card) {
    case 'recrueSecrete':
      return uniq(state.hands[player].filter((a) => !state.inPlay[player].includes(a)));
    case 'coupDouble':
      return uniq(state.hands[player].filter((a) => countOf(state.hands[player], a) >= 2));
    case 'petitRepos':
      return uniq(state.inPlay[player]);
    case 'manipulationEsprit':
      return uniq(state.inPlay[other(player)]);
    default:
      return [];
  }
}

function resolveImmediate(state: RoomState, player: PlayerId, card: BlackMarketType) {
  switch (card) {
    case 'vehiculeSurveillance':
      pawnAdvance(state, player, 1);
      return;
    case 'ecranDeFumee':
      if (state.deck.length > 0) recruitAgentSequential(state, player, state.deck.pop()!);
      return;
    case 'avantPoste':
      if (state.hands[player].includes('sentinelle')) {
        removeOne(state.hands[player], 'sentinelle');
        recruitAgentSequential(state, player, 'sentinelle');
      }
      return;
    case 'recrueSecrete':
    case 'coupDouble':
    case 'petitRepos':
    case 'manipulationEsprit':
      // Needs a choice; only pause if at least one choice exists.
      if (capacityOptions(state, player, card).length > 0) {
        state.pendingCapacity = { player, card };
      }
      return;
    default:
      return; // permanents handled before this; nothing to resolve
  }
}

function applyCapacity(
  state: RoomState,
  who: PlayerId,
  agent: AgentType | undefined,
  recruitOpt: boolean | undefined
): string | null {
  if (state.phase !== 'capacity' || !state.pendingCapacity) return "Aucune capacité à résoudre.";
  if (state.pendingCapacity.player !== who) return "Ce n'est pas à vous d'agir.";
  const card = state.pendingCapacity.card;
  const options = capacityOptions(state, who, card);
  if (!agent || !options.includes(agent)) return 'Choix invalide.';
  state.pendingCapacity = null;

  switch (card) {
    case 'recrueSecrete':
      removeOne(state.hands[who], agent);
      recruitAgentSequential(state, who, agent);
      break;
    case 'coupDouble':
      // reveal 2 identical, recruit 1, keep the other in hand
      removeOne(state.hands[who], agent);
      recruitAgentSequential(state, who, agent);
      break;
    case 'petitRepos':
      // take it back to hand (no move), then optionally recruit it immediately
      removeOne(state.inPlay[who], agent);
      state.hands[who].push(agent);
      if (recruitOpt) {
        removeOne(state.hands[who], agent);
        recruitAgentSequential(state, who, agent);
      }
      break;
    case 'manipulationEsprit':
      // steal an agent the opponent has in play into your hand (no move)
      removeOne(state.inPlay[other(who)], agent);
      state.hands[who].push(agent);
      break;
  }
  continueTurn(state);
  return null;
}

// --- Étape 3: Terminer le tour ---

function resolveEndOfTurn(state: RoomState) {
  refill(state, 'p1');
  refill(state, 'p2');

  const caught = state.pendingCaught;
  const claims: { winner: PlayerId; reason: RoomState['winReason'] }[] = [];

  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (caught[p]) claims.push({ winner: p, reason: 'catch' });
  });
  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (countOf(state.inPlay[p], 'cryptologue') >= 3) claims.push({ winner: p, reason: '3-crypto' });
  });
  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (countOf(state.inPlay[p], 'risqueTout') >= 3) {
      // Cheffe de meute: 3 Risque-tout WINS instead of losing.
      if (ownsBM(state, p, 'cheffeDeMeute')) claims.push({ winner: p, reason: '3-risque-meute' });
      else claims.push({ winner: other(p), reason: '3-risque' });
    }
  });
  // Advanced permanent win conditions.
  (['p1', 'p2'] as PlayerId[]).forEach((p) => {
    if (ownsBM(state, p, 'planDesOperations') && distinctCount(state.inPlay[p]) >= 7) {
      claims.push({ winner: p, reason: '7-agents' });
    }
    if (ownsBM(state, p, 'systemeDeSecurite') && state.positions[other(p)] === MAISON[p]) {
      claims.push({ winner: p, reason: 'maison' });
    }
  });

  if (claims.length > 0) {
    const winners = new Set(claims.map((c) => c.winner));
    if (winners.size === 1) finish(state, claims[0].winner, claims[0].reason);
    else {
      const own = claims.find((c) => c.winner === state.activePlayer);
      finish(state, state.activePlayer, own ? own.reason : 'catch');
    }
    return;
  }

  state.pendingCaught = { p1: false, p2: false };
  const next = other(state.activePlayer);
  if (state.deck.length === 0 && state.hands[next].length < 2) {
    endByProximity(state, state.activePlayer);
    return;
  }
  state.activePlayer = next;
  state.phase = 'play';
}

function finish(state: RoomState, winner: PlayerId, reason: RoomState['winReason']) {
  state.winner = winner;
  state.winReason = reason;
  state.phase = 'ended';
}

function endByProximity(state: RoomState, tieWinner: PlayerId) {
  const gapP1 = clockwiseGap(state.positions.p1, state.positions.p2);
  const gapP2 = clockwiseGap(state.positions.p2, state.positions.p1);
  let winner: PlayerId;
  if (gapP1 < gapP2) winner = 'p1';
  else if (gapP2 < gapP1) winner = 'p2';
  else winner = tieWinner;
  finish(state, winner, 'hand-empty');
}

export function applyAction(state: RoomState, who: PlayerId, msg: ClientMessage): string | null {
  switch (msg.type) {
    case 'start':
      return startGame(state);
    case 'play':
      return applyPlay(state, who, msg.faceUp, msg.faceDown);
    case 'recruit':
      return applyRecruit(state, who, msg.choice);
    case 'market':
      return applyMarket(state, who, msg.slot);
    case 'capacity':
      return applyCapacity(state, who, msg.agent, msg.recruit);
    case 'reset': {
      const fresh = createRoom(state.code, Math.random, state.mode);
      fresh.players = state.players;
      Object.assign(state, fresh);
      return null;
    }
    default:
      return 'Action inconnue.';
  }
}

export function viewFor(state: RoomState, you: PlayerId | null): PlayerView {
  let proposed: PlayerView['proposed'] = null;
  if (state.proposedCards) {
    const seeFaceDown = you === state.activePlayer;
    proposed = {
      faceUp: state.proposedCards.faceUp,
      faceDown: seeFaceDown ? state.proposedCards.faceDown : null,
    };
  }
  const opp = you ? other(you) : 'p2';

  let pendingCapacity: PlayerView['pendingCapacity'] = null;
  if (state.pendingCapacity) {
    const pc = state.pendingCapacity;
    pendingCapacity = {
      player: pc.player,
      card: pc.card,
      // Eligible choices come from hidden info, so only reveal them to the actor.
      agents: you === pc.player ? capacityOptions(state, pc.player, pc.card) : [],
      optional: pc.card === 'petitRepos',
    };
  }

  return {
    code: state.code,
    you,
    players: { p1: state.players.p1 !== null, p2: state.players.p2 !== null },
    yourHand: you ? state.hands[you] : [],
    oppHandCount: you ? state.hands[opp].length : 0,
    deckCount: state.deck.length,
    inPlay: state.inPlay,
    positions: state.positions,
    activePlayer: state.activePlayer,
    phase: state.phase,
    proposed,
    winner: state.winner,
    winReason: state.winReason,
    mode: state.mode,
    market: state.market,
    marketDeckCount: state.marketDeck.length,
    blackMarket: state.blackMarket,
    pendingMarket: state.pendingMarket[0] ?? null,
    pendingCapacity,
  };
}

export { TRACK };
