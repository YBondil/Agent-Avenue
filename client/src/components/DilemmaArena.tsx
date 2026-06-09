import { Component, Show, createSignal } from 'solid-js';
import type { PlayerView } from '../types';
import Card from './Card';

interface DilemmaArenaProps {
  view: PlayerView;
  onRecruit: (choice: 'faceUp' | 'faceDown') => void;
}

// The recruit "dilemma": the two proposed cards on a central plate. "Voir le
// jeu" shrinks the cards and fades the plate so the board (and the distance
// between the pawns) and the recruited cards in the strips become readable.
const DilemmaArena: Component<DilemmaArenaProps> = (props) => {
  const view = () => props.view;
  const isActive = () => view().you !== null && view().activePlayer === view().you;
  const proposed = () => view().proposed;

  const [peek, setPeek] = createSignal(false);

  function pick(choice: 'faceUp' | 'faceDown') {
    if (isActive()) return;
    props.onRecruit(choice);
  }

  const cardWidth = () =>
    peek() ? 'w-[clamp(62px,13dvh,92px)]' : 'w-[clamp(118px,27dvh,184px)]';

  return (
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div class="relative flex flex-col items-center gap-3 pointer-events-auto">
        {/* Dedicated plate; fades away while peeking at the board. */}
        <div
          class="absolute -inset-x-6 -inset-y-5 rounded-3xl transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.34), rgba(0,0,0,0.14))',
            border: '2px solid rgba(202,161,90,0.55)',
            'box-shadow': '0 10px 30px -8px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.3)',
            opacity: peek() ? '0' : '1',
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
              disabled={isActive()}
              onClick={() => pick('faceUp')}
              class={`block ${cardWidth()} transition-all duration-300 ease-out ${
                !isActive() ? 'hover:-translate-y-2 hover:scale-105' : ''
              }`}
            >
              <Card type={proposed()!.faceUp} selected />
            </button>

            <button
              type="button"
              disabled={isActive()}
              onClick={() => pick('faceDown')}
              class={`block ${cardWidth()} transition-all duration-300 ease-out ${
                !isActive() ? 'hover:-translate-y-2 hover:scale-105' : ''
              }`}
            >
              <Card
                type={proposed()!.faceDown ?? undefined}
                faceDown={proposed()!.faceDown === null}
                selected
              />
            </button>
          </div>
        </Show>

        <button
          type="button"
          class="relative token-ghost px-4 py-1.5 text-[11px]"
          onClick={() => setPeek((v) => !v)}
        >
          {peek() ? 'Masquer le jeu' : 'Voir le jeu'}
        </button>
      </div>
    </div>
  );
};

export default DilemmaArena;
