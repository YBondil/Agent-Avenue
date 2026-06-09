import { Component, Show, createSignal } from 'solid-js';
import type { PlayerView } from '../types';
import Card from './Card';

interface DilemmaArenaProps {
  view: PlayerView;
  onRecruit: (choice: 'faceUp' | 'faceDown') => void;
}

// The recruit "dilemma": the two proposed cards face off at the exact center of
// the arena. The recruiting player picks one (it flies to their side, the other
// to the opponent); the active player only watches.
const DilemmaArena: Component<DilemmaArenaProps> = (props) => {
  const view = () => props.view;
  const isActive = () => view().you !== null && view().activePlayer === view().you;
  const proposed = () => view().proposed;

  // 'faceUp' | 'faceDown' once chosen, drives the distribution animation.
  const [chosen, setChosen] = createSignal<'faceUp' | 'faceDown' | null>(null);

  function pick(choice: 'faceUp' | 'faceDown') {
    if (isActive() || chosen()) return;
    setChosen(choice);
    // Let the deal-out animation play before the server resolves the turn.
    setTimeout(() => props.onRecruit(choice), 360);
  }

  // Translate a card toward its destination: the chosen one drops to the
  // recruiter (bottom), the other rises to the opponent (top).
  const flightStyle = (which: 'faceUp' | 'faceDown') => {
    if (!chosen()) return {};
    const taken = chosen() === which;
    return {
      transform: `translateY(${taken ? '180px' : '-220px'}) scale(0.5) rotate(${taken ? 8 : -8}deg)`,
      opacity: '0',
    };
  };

  return (
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      {/* Dramatic backdrop pulse */}
      <div
        class="absolute w-72 h-72 rounded-full animate-pulse-ring"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18), transparent 65%)' }}
      />

      <div class="relative flex flex-col items-center gap-4 pointer-events-auto">
        <Show when={proposed()}>
          <div class="flex items-end gap-6 animate-dilemma-in">
            {/* Face up proposal */}
            <button
              type="button"
              disabled={isActive() || chosen() !== null}
              onClick={() => pick('faceUp')}
              class={`block w-28 transition-all duration-300 ease-out ${
                !isActive() && !chosen() ? 'hover:-translate-y-3 hover:scale-105' : ''
              }`}
              style={flightStyle('faceUp')}
            >
              <Card type={proposed()!.faceUp} glow />
            </button>

            {/* Face down proposal: revealed only to the player who played it. */}
            <button
              type="button"
              disabled={isActive() || chosen() !== null}
              onClick={() => pick('faceDown')}
              class={`block w-28 transition-all duration-300 ease-out ${
                !isActive() && !chosen() ? 'hover:-translate-y-3 hover:scale-105' : ''
              }`}
              style={flightStyle('faceDown')}
            >
              <Card
                type={proposed()!.faceDown ?? undefined}
                faceDown={proposed()!.faceDown === null}
                glow
              />
            </button>
          </div>
        </Show>

        {/* Minimal cue */}
        <Show
          when={!isActive()}
          fallback={
            <div class="text-spy-accent2 text-xs font-bold uppercase tracking-[0.3em] neon-text animate-pulse-ring">
              Dilemme adverse
            </div>
          }
        >
          <div class="text-spy-accent text-xs font-bold uppercase tracking-[0.3em] neon-text">
            Recrutez une carte
          </div>
        </Show>
      </div>
    </div>
  );
};

export default DilemmaArena;
