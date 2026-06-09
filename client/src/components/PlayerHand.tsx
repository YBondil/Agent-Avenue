import { Component, For, Show, createSignal } from 'solid-js';
import type { AgentType } from '../types';
import Card from './Card';

interface PlayerHandProps {
  hand: AgentType[];
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  onSelectFaceUp: (card: AgentType) => void;
  onSelectFaceDown: (card: AgentType) => void;
  selectionMode: 'none' | 'picking';
}

// The active player's hand, fanned in an arc and anchored to the bottom edge.
// Cards lift, scale and rise above their neighbours on hover.
const PlayerHand: Component<PlayerHandProps> = (props) => {
  const [hovered, setHovered] = createSignal<number | null>(null);

  const slot = (card: AgentType): 'up' | 'down' | null =>
    props.selectedFaceUp === card ? 'up' : props.selectedFaceDown === card ? 'down' : null;

  function handleClick(card: AgentType) {
    if (props.selectionMode !== 'picking') return;
    if (props.selectedFaceUp === card) return props.onSelectFaceUp(card);
    if (props.selectedFaceDown === card) return props.onSelectFaceDown(card);
    if (props.selectedFaceUp === null) props.onSelectFaceUp(card);
    else props.onSelectFaceDown(card);
  }

  const interactive = () => props.selectionMode === 'picking';

  return (
    <div class="flex justify-center items-end h-28">
      <div class="flex items-end">
        <For each={props.hand}>
          {(card, i) => {
            const n = props.hand.length;
            const mid = () => (n - 1) / 2;
            const offset = () => i() - mid();
            const isHover = () => hovered() === i();
            const sel = () => slot(card);
            const ring = () =>
              sel() === 'up'
                ? '0 0 26px 2px rgba(52,211,153,0.9)'
                : sel() === 'down'
                ? '0 0 26px 2px rgba(251,191,36,0.9)'
                : undefined;
            return (
              <div
                class="relative"
                style={{
                  'z-index': isHover() ? '100' : sel() ? '60' : String(10 + i()),
                  transform: `rotate(${offset() * 6}deg) translateY(${Math.abs(offset()) * 7}px)`,
                  margin: '0 -12px',
                }}
              >
                <button
                  type="button"
                  disabled={!interactive()}
                  onMouseEnter={() => setHovered(i())}
                  onMouseLeave={() => setHovered((h) => (h === i() ? null : h))}
                  onClick={() => handleClick(card)}
                  class={`block w-16 origin-bottom transition-transform duration-200 ${
                    interactive() ? 'hover:-translate-y-7 hover:scale-110' : ''
                  } ${sel() ? '-translate-y-5' : ''}`}
                  style={{ 'border-radius': '0.75rem', 'box-shadow': ring() }}
                >
                  <Show when={sel()}>
                    <span
                      class={`absolute top-1 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider text-black ${
                        sel() === 'up' ? 'bg-spy-success' : 'bg-spy-warn'
                      }`}
                    >
                      {sel() === 'up' ? 'Visible' : 'Cachee'}
                    </span>
                  </Show>
                  <Card type={card} glow={sel() !== null} />
                </button>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default PlayerHand;
