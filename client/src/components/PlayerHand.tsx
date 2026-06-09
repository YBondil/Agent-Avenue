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

// The active player's hand: a dynamic overlapping fan anchored to the bottom.
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
  // Tighter overlap and steeper arc as the hand grows.
  const spread = () => Math.min(9, 26 / Math.max(1, props.hand.length));

  return (
    <div class="flex justify-center items-end h-[19dvh] min-h-[120px]">
      <div class="flex items-end">
        <For each={props.hand}>
          {(card, i) => {
            const n = props.hand.length;
            const offset = () => i() - (n - 1) / 2;
            const isHover = () => hovered() === i();
            const sel = () => slot(card);
            return (
              <div
                class="relative"
                style={{
                  'z-index': isHover() ? '100' : sel() ? '60' : String(10 + i()),
                  transform: `rotate(${offset() * 5}deg) translateY(${Math.abs(offset()) * spread()}px)`,
                  margin: '0 -14px',
                }}
              >
                <button
                  type="button"
                  disabled={!interactive()}
                  onMouseEnter={() => setHovered(i())}
                  onMouseLeave={() => setHovered((h) => (h === i() ? null : h))}
                  onClick={() => handleClick(card)}
                  class={`block w-[clamp(72px,13dvh,104px)] origin-bottom transition-transform duration-200 ${
                    interactive() ? 'hover:-translate-y-7 hover:scale-110' : ''
                  } ${sel() ? '-translate-y-4' : ''}`}
                >
                  <Show when={sel()}>
                    <span
                      class={`absolute top-1 left-1/2 -translate-x-1/2 z-50 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide text-white shadow-card ${
                        sel() === 'up' ? 'bg-spy-success' : 'bg-spy-danger'
                      }`}
                    >
                      {sel() === 'up' ? 'Visible' : 'Cachee'}
                    </span>
                  </Show>
                  <Card type={card} selected={sel() !== null} />
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
