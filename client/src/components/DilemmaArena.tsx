import { Component, For, Show, createSignal } from 'solid-js';
import type { AgentType, PlayerId, PlayerView } from '../types';
import Card from './Card';

interface DilemmaArenaProps {
  view: PlayerView;
  onRecruit: (choice: 'faceUp' | 'faceDown') => void;
}

function group(cards: AgentType[]): { card: AgentType; count: number }[] {
  const m = new Map<AgentType, number>();
  for (const c of cards) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m.entries()].map(([card, count]) => ({ card, count }));
}

// A compact row of recruited cards (grouped by type) for the inspect view.
const ZoneRow: Component<{ cards: AgentType[]; label: string }> = (props) => (
  <div class="relative flex items-center gap-2">
    <span class="text-[10px] font-bold uppercase tracking-wider text-spy-muted w-16 text-right">
      {props.label}
    </span>
    <div class="flex gap-2">
      <Show
        when={props.cards.length > 0}
        fallback={<span class="text-[11px] text-spy-muted italic">Aucune carte</span>}
      >
        <For each={group(props.cards)}>
          {(g) => (
            <div class="w-[clamp(54px,9dvh,74px)]">
              <Card type={g.card} count={g.count} />
            </div>
          )}
        </For>
      </Show>
    </div>
  </div>
);

// The recruit "dilemma": the two proposed cards sit on a dedicated central plate.
// A "Voir les jeux" toggle reveals both players' cards in play simultaneously,
// above (opponent) and below (you) the proposed cards.
const DilemmaArena: Component<DilemmaArenaProps> = (props) => {
  const view = () => props.view;
  const isActive = () => view().you !== null && view().activePlayer === view().you;
  const proposed = () => view().proposed;

  const [chosen, setChosen] = createSignal<'faceUp' | 'faceDown' | null>(null);
  const [showZones, setShowZones] = createSignal(false);

  const me = (): PlayerId => view().you ?? 'p1';
  const opp = (): PlayerId => (me() === 'p1' ? 'p2' : 'p1');

  function pick(choice: 'faceUp' | 'faceDown') {
    if (isActive() || chosen()) return;
    setChosen(choice);
    setTimeout(() => props.onRecruit(choice), 360);
  }

  // Deal the chosen card toward the recruiter (down), the other to the opponent (up).
  const flight = (which: 'faceUp' | 'faceDown') => {
    if (!chosen()) return {};
    const taken = chosen() === which;
    return {
      transform: `translateY(${taken ? '26vh' : '-26vh'}) scale(0.55) rotate(${taken ? 8 : -8}deg)`,
      opacity: '0',
    };
  };

  return (
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div class="relative flex flex-col items-center gap-3 pointer-events-auto">
        {/* Dedicated plate (no global blur or dimming) */}
        <div
          class="absolute -inset-x-6 -inset-y-5 rounded-3xl"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.34), rgba(0,0,0,0.14))',
            border: '2px solid rgba(202,161,90,0.55)',
            'box-shadow': '0 10px 30px -8px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.3)',
          }}
        />

        <div class="relative text-[11px] font-bold uppercase tracking-[0.25em] text-spy-accent">
          <Show when={!isActive()} fallback={<span class="text-spy-muted">Choix adverse...</span>}>
            Recrutez une carte
          </Show>
        </div>

        {/* Opponent's cards in play (above the dilemma) */}
        <Show when={showZones() && !chosen()}>
          <ZoneRow cards={view().inPlay[opp()]} label="Adversaire" />
        </Show>

        <Show when={proposed()}>
          <div class="relative flex items-end gap-4 animate-rise">
            <button
              type="button"
              disabled={isActive() || chosen() !== null}
              onClick={() => pick('faceUp')}
              class={`block w-[clamp(118px,27dvh,184px)] transition-all duration-300 ease-out ${
                !isActive() && !chosen() ? 'hover:-translate-y-2 hover:scale-105' : ''
              }`}
              style={flight('faceUp')}
            >
              <Card type={proposed()!.faceUp} selected />
            </button>

            <button
              type="button"
              disabled={isActive() || chosen() !== null}
              onClick={() => pick('faceDown')}
              class={`block w-[clamp(118px,27dvh,184px)] transition-all duration-300 ease-out ${
                !isActive() && !chosen() ? 'hover:-translate-y-2 hover:scale-105' : ''
              }`}
              style={flight('faceDown')}
            >
              <Card
                type={proposed()!.faceDown ?? undefined}
                faceDown={proposed()!.faceDown === null}
                selected
              />
            </button>
          </div>
        </Show>

        {/* Your cards in play (below the dilemma) */}
        <Show when={showZones() && !chosen()}>
          <ZoneRow cards={view().inPlay[me()]} label="Vous" />
        </Show>

        {/* Toggle both zones at once */}
        <Show when={!chosen()}>
          <button
            type="button"
            class="relative token-ghost px-4 py-1.5 text-[11px]"
            onClick={() => setShowZones((v) => !v)}
          >
            {showZones() ? 'Masquer les jeux' : 'Voir les jeux'}
          </button>
        </Show>
      </div>
    </div>
  );
};

export default DilemmaArena;
