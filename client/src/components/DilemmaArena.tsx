import { Component, For, Show, createMemo, createSignal } from 'solid-js';
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

// The recruit "dilemma": the two proposed cards sit on a dedicated central plate
// on the table. The recruiting player picks one; the rest of the table (hands,
// pawns, opponent backs) stays fully visible behind it. Two buttons let either
// player inspect the cards currently in play before deciding.
const DilemmaArena: Component<DilemmaArenaProps> = (props) => {
  const view = () => props.view;
  const isActive = () => view().you !== null && view().activePlayer === view().you;
  const proposed = () => view().proposed;

  const [chosen, setChosen] = createSignal<'faceUp' | 'faceDown' | null>(null);
  const [viewing, setViewing] = createSignal<'me' | 'opp' | null>(null);

  const me = (): PlayerId => view().you ?? 'p1';
  const opp = (): PlayerId => (me() === 'p1' ? 'p2' : 'p1');
  const cardsInPlay = (which: 'me' | 'opp') => view().inPlay[which === 'me' ? me() : opp()];
  const groups = createMemo(() => (viewing() ? group(cardsInPlay(viewing()!)) : []));

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
            background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.32), rgba(0,0,0,0.12))',
            border: '2px solid rgba(202,161,90,0.55)',
            'box-shadow': '0 10px 30px -8px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.3)',
          }}
        />

        <div class="relative text-[11px] font-bold uppercase tracking-[0.25em] text-spy-accent">
          <Show when={!isActive()} fallback={<span class="text-spy-muted">Choix adverse...</span>}>
            Recrutez une carte
          </Show>
        </div>

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

        {/* Inspect cards currently in play */}
        <Show when={!chosen()}>
          <div class="relative flex gap-2">
            <button
              type="button"
              class="token-ghost px-3 py-1.5 text-[11px]"
              onClick={() => setViewing((v) => (v === 'me' ? null : 'me'))}
            >
              Mon jeu ({cardsInPlay('me').length})
            </button>
            <button
              type="button"
              class="token-ghost px-3 py-1.5 text-[11px]"
              onClick={() => setViewing((v) => (v === 'opp' ? null : 'opp'))}
            >
              Jeu adverse ({cardsInPlay('opp').length})
            </button>
          </div>
        </Show>
      </div>

      {/* In-play viewer overlay */}
      <Show when={viewing()}>
        <div
          class="absolute inset-0 z-40 flex items-center justify-center bg-black/45 pointer-events-auto"
          onClick={() => setViewing(null)}
        >
          <div
            class="bg-spy-surface rounded-3xl border-2 border-spy-border shadow-card-lg p-4 mx-4 max-w-[92%]"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between mb-3 gap-4">
              <span class="text-sm font-bold uppercase tracking-wider text-spy-accent">
                {viewing() === 'me' ? 'Votre jeu' : "Jeu de l'adversaire"}
              </span>
              <button
                type="button"
                class="token-ghost px-3 py-1 text-[11px]"
                onClick={() => setViewing(null)}
              >
                Fermer
              </button>
            </div>
            <Show
              when={groups().length > 0}
              fallback={<div class="text-spy-muted text-sm italic py-6 text-center">Aucune carte en jeu</div>}
            >
              <div class="flex flex-wrap justify-center gap-3 max-h-[58dvh] overflow-y-auto">
                <For each={groups()}>
                  {(g) => (
                    <div class="w-[clamp(78px,12dvh,104px)]">
                      <Card type={g.card} count={g.count} />
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default DilemmaArena;
