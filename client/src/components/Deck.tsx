import { Component, For, createEffect, createSignal, onMount } from 'solid-js';
import type { PlayerView } from '../types';

interface DeckProps {
  view: PlayerView;
}

// Where the deck sits on the table and where drawn cards land. The pile is
// tucked into the upper-right so it clears the centered recruit zones.
const DECK = { x: '92vw', y: '20vh' };
const TARGET = {
  you: { x: '50vw', y: '88dvh' },
  opp: { x: '50vw', y: '9dvh' },
};

type Flyer = { id: number; to: 'you' | 'opp'; delay: number };

// A single drawn card: lifts off the deck, spins in 3D and travels to a hand.
const FlyingCard: Component<{ flyer: Flyer; onDone: (id: number) => void }> = (props) => {
  let el: HTMLDivElement | undefined;
  onMount(() => {
    if (!el) return;
    // Start sitting on the deck.
    el.style.left = DECK.x;
    el.style.top = DECK.y;
    el.style.transform = 'translate(-50%,-50%) rotateZ(0deg) rotateY(0deg) scale(1)';
    const t = TARGET[props.flyer.to];
    // After a staggered beat, fly to the hand with a 3D tumble.
    setTimeout(() => {
      if (!el) return;
      el.style.left = t.x;
      el.style.top = t.y;
      el.style.transform =
        'translate(-50%,-50%) rotateZ(-12deg) rotateY(540deg) scale(0.82)';
    }, props.flyer.delay + 20);
    setTimeout(() => props.onDone(props.flyer.id), props.flyer.delay + 680);
  });

  return (
    <div ref={el} class="draw-flyer">
      <div class="card-back w-full" />
    </div>
  );
};

const Deck: Component<DeckProps> = (props) => {
  const [flyers, setFlyers] = createSignal<Flyer[]>([]);
  let nextId = 0;
  let prev: { your: number; opp: number; deck: number } | null = null;

  const layers = () => Math.max(2, Math.min(7, Math.ceil(props.view.deckCount / 6)));

  function spawn(to: 'you' | 'opp', n: number) {
    const add: Flyer[] = [];
    for (let i = 0; i < Math.min(n, 4); i++) {
      add.push({ id: nextId++, to, delay: i * 130 });
    }
    setFlyers((f) => [...f, ...add]);
  }

  // Detect draws (local or opponent) and launch flight animations.
  createEffect(() => {
    const v = props.view;
    const snap = { your: v.yourHand.length, opp: v.oppHandCount, deck: v.deckCount };
    if (prev === null) {
      prev = snap;
      return;
    }
    if (prev.deck - snap.deck > 0) {
      const youDrew = snap.your - prev.your;
      const oppDrew = snap.opp - prev.opp;
      if (youDrew > 0) spawn('you', youDrew);
      if (oppDrew > 0) spawn('opp', oppDrew);
    }
    prev = snap;
  });

  return (
    <div class="fixed inset-0 pointer-events-none z-[55]" style={{ perspective: '1100px' }}>
      {/* Physical deck pile on the side of the table */}
      <div
        class="fixed -translate-x-1/2 -translate-y-1/2"
        style={{ left: DECK.x, top: DECK.y, width: '9vh', 'max-width': '56px' }}
      >
        <For each={Array.from({ length: layers() })}>
          {(_, i) => (
            <div
              class="card-back w-full absolute left-0"
              style={{ top: `${-i() * 2}px`, 'z-index': String(i()) }}
            />
          )}
        </For>
        {/* spacer to give the stack height */}
        <div class="card-back w-full invisible" />
      </div>

      {/* In-flight drawn cards */}
      <For each={flyers()}>
        {(f) => (
          <FlyingCard
            flyer={f}
            onDone={(id) => setFlyers((arr) => arr.filter((x) => x.id !== id))}
          />
        )}
      </For>
    </div>
  );
};

export default Deck;
