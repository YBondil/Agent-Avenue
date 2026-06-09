import { Component, For, Show } from 'solid-js';
import type { AgentType } from '../types';
import { AGENT_LABELS } from '../constants';

interface HandProps {
  hand: AgentType[];
  oppHandCount: number;
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  onSelectFaceUp: (card: AgentType) => void;
  onSelectFaceDown: (card: AgentType) => void;
  selectionMode: 'none' | 'picking'; // 'picking' = in play-selection mode
  discardCandidate: AgentType | null;
  onSelectDiscard: (card: AgentType) => void;
  discardMode: boolean;
}

const Hand: Component<HandProps> = (props) => {
  function cardClass(card: AgentType): string {
    const base = 'agent-card flex flex-col items-center gap-1 p-2 min-w-16 text-center';
    if (props.discardMode) {
      if (props.discardCandidate === card) return `${base} selected`;
      return base;
    }
    if (props.selectionMode === 'picking') {
      if (props.selectedFaceUp === card) return `${base} face-up-selected`;
      if (props.selectedFaceDown === card) return `${base} face-down-selected`;
      return base;
    }
    return `${base} cursor-default`;
  }

  function handleClick(card: AgentType) {
    if (props.discardMode) {
      props.onSelectDiscard(card);
      return;
    }
    if (props.selectionMode !== 'picking') return;

    // Determine which slot to fill:
    // First click: face up
    // Second click (different card): face down
    // Clicking already face-up card: deselect
    // Clicking already face-down card: deselect
    if (props.selectedFaceUp === card) {
      props.onSelectFaceUp(card); // signal to deselect
      return;
    }
    if (props.selectedFaceDown === card) {
      props.onSelectFaceDown(card); // signal to deselect
      return;
    }
    if (props.selectedFaceUp === null) {
      props.onSelectFaceUp(card);
    } else {
      props.onSelectFaceDown(card);
    }
  }

  return (
    <div class="flex flex-col gap-3">
      {/* Your hand */}
      <div>
        <div class="text-xs text-spy-muted mb-1 uppercase tracking-wider">Votre main</div>
        <div class="flex flex-wrap gap-2">
          <For each={props.hand}>
            {(card) => (
              <button
                class={cardClass(card)}
                onClick={() => handleClick(card)}
                type="button"
              >
                <span class="text-xs font-bold text-spy-text leading-tight">
                  {AGENT_LABELS[card]}
                </span>
                <Show when={props.selectionMode === 'picking'}>
                  <Show when={props.selectedFaceUp === card}>
                    <span class="text-xs text-spy-success font-semibold">Face visible</span>
                  </Show>
                  <Show when={props.selectedFaceDown === card}>
                    <span class="text-xs text-spy-warn font-semibold">Face cachee</span>
                  </Show>
                </Show>
                <Show when={props.discardMode && props.discardCandidate === card}>
                  <span class="text-xs text-spy-accent font-semibold">Defausser</span>
                </Show>
              </button>
            )}
          </For>
        </div>
        <Show when={props.selectionMode === 'picking'}>
          <p class="text-xs text-spy-muted mt-1">
            Cliquez une carte pour la jouer face visible, puis une autre face cachee.
          </p>
        </Show>
        <Show when={props.discardMode}>
          <p class="text-xs text-spy-warn mt-1">
            Selectionnez la carte a defausser.
          </p>
        </Show>
      </div>

      {/* Opponent hand */}
      <div>
        <div class="text-xs text-spy-muted mb-1 uppercase tracking-wider">
          Main adversaire ({props.oppHandCount} carte{props.oppHandCount > 1 ? 's' : ''})
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={Array.from({ length: props.oppHandCount })}>
            {() => (
              <div class="card-back w-16 h-20 text-xl">?</div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default Hand;
