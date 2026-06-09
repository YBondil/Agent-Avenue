import { Component, Show, createSignal } from 'solid-js';
import type { PlayerView } from '../types';
import Card from './Card';

interface DilemmaArenaProps {
  view: PlayerView;
  onRecruit: (choice: 'faceUp' | 'faceDown') => void;
}

// The recruit "dilemma": the two proposed cards sit on a dedicated central plate
// on the table. The recruiting player picks one; the rest of the table (hands,
// pawns, opponent backs) stays fully visible behind it.
const DilemmaArena: Component<DilemmaArenaProps> = (props) => {
  const view = () => props.view;
  const isActive = () => view().you !== null && view().activePlayer === view().you;
  const proposed = () => view().proposed;

  const [chosen, setChosen] = createSignal<'faceUp' | 'faceDown' | null>(null);

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
              class={`block w-[18vh] max-w-[110px] transition-all duration-300 ease-out ${
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
              class={`block w-[18vh] max-w-[110px] transition-all duration-300 ease-out ${
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
      </div>
    </div>
  );
};

export default DilemmaArena;
