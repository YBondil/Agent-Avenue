import { Component, For, Show } from 'solid-js';
import type { AgentType } from '../types';
import { AGENT_COLORS, AGENT_LABELS } from '../constants';

interface PlayerHandProps {
  hand: AgentType[];
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  onSelectFaceUp: (card: AgentType) => void;
  onSelectFaceDown: (card: AgentType) => void;
  selectionMode: 'none' | 'picking';
}

// The active player's hand: four big, tappable agent cards (bottom zone).
const PlayerHand: Component<PlayerHandProps> = (props) => {
  function cardClass(card: AgentType): string {
    const base =
      'agent-card flex flex-col items-center justify-center gap-1 pt-3 pb-2 px-1 min-h-[84px]';
    if (props.selectionMode === 'picking') {
      if (props.selectedFaceUp === card) return `${base} face-up-selected`;
      if (props.selectedFaceDown === card) return `${base} face-down-selected`;
      return base;
    }
    return `${base} cursor-default`;
  }

  function handleClick(card: AgentType) {
    if (props.selectionMode !== 'picking') return;

    // First click fills face-up, next fills face-down; clicking a filled slot clears it.
    if (props.selectedFaceUp === card) {
      props.onSelectFaceUp(card);
      return;
    }
    if (props.selectedFaceDown === card) {
      props.onSelectFaceDown(card);
      return;
    }
    if (props.selectedFaceUp === null) {
      props.onSelectFaceUp(card);
    } else {
      props.onSelectFaceDown(card);
    }
  }

  const interactive = () => props.selectionMode === 'picking';

  return (
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[11px] font-bold uppercase tracking-wider text-spy-muted">
          Votre main
        </span>
        <Show when={props.selectionMode === 'picking'}>
          <span class="text-[11px] text-spy-muted">1 visible, 1 cachee</span>
        </Show>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <For each={props.hand}>
          {(card) => (
            <button
              class={cardClass(card)}
              onClick={() => handleClick(card)}
              disabled={!interactive()}
              type="button"
            >
              <span class="agent-stripe" style={{ background: AGENT_COLORS[card] }} />
              <span class="text-[13px] font-extrabold leading-tight text-spy-text">
                {AGENT_LABELS[card]}
              </span>
              <Show when={props.selectionMode === 'picking'}>
                <Show when={props.selectedFaceUp === card}>
                  <span class="text-[10px] font-bold text-spy-success">Visible</span>
                </Show>
                <Show when={props.selectedFaceDown === card}>
                  <span class="text-[10px] font-bold text-spy-warn">Cachee</span>
                </Show>
              </Show>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default PlayerHand;
