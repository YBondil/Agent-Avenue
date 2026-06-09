import { Component, Show, createMemo } from 'solid-js';
import type { AgentType, PlayerView } from '../types';
import type { ClientMessage } from '../ws';

interface ActionPanelProps {
  view: PlayerView;
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  onSend: (msg: ClientMessage) => void;
  onResetSelection: () => void;
}

// Floating action tokens for the active player's commit step and the rematch.
// The recruit phase is handled by DilemmaArena, not here.
const ActionPanel: Component<ActionPanelProps> = (props) => {
  const view = () => props.view;
  const you = () => view().you;
  const isActive = () => you() !== null && view().activePlayer === you();
  const phase = () => view().phase;

  const canPlay = createMemo(() => {
    const fu = props.selectedFaceUp;
    const fd = props.selectedFaceDown;
    if (!fu || !fd) return false;
    const hand = view().yourHand;
    const allSame = hand.length === 4 && hand.every((c) => c === hand[0]);
    if (fu === fd && !allSame) return false;
    return true;
  });

  function handlePlay() {
    const fu = props.selectedFaceUp;
    const fd = props.selectedFaceDown;
    if (!fu || !fd) return;
    props.onSend({ type: 'play', faceUp: fu, faceDown: fd });
    props.onResetSelection();
  }

  return (
    <div class="flex items-center justify-center gap-3 min-h-[44px]">
      {/* Active player commit */}
      <Show when={phase() === 'play' && isActive()}>
        <Show when={props.selectedFaceUp !== null || props.selectedFaceDown !== null}>
          <button class="token-ghost" onClick={props.onResetSelection} type="button">
            Annuler
          </button>
        </Show>
        <button class="token-cyan" onClick={handlePlay} disabled={!canPlay()} type="button">
          Engager
        </button>
        <Show
          when={props.selectedFaceUp !== null && props.selectedFaceDown !== null && !canPlay()}
        >
          <span class="text-[11px] font-bold text-spy-danger neon-text">Cartes identiques</span>
        </Show>
      </Show>

      {/* Active player waiting on the dilemma */}
      <Show when={phase() === 'recruit' && isActive()}>
        <span class="text-spy-muted text-xs font-bold uppercase tracking-[0.3em]">
          En attente du choix adverse
        </span>
      </Show>

      {/* Non-active waiting for the opponent to commit */}
      <Show when={phase() === 'play' && !isActive() && you() !== null}>
        <span class="text-spy-muted text-xs font-bold uppercase tracking-[0.3em]">
          L'adversaire prepare son duel
        </span>
      </Show>

      {/* Rematch */}
      <Show when={phase() === 'ended'}>
        <button class="token-magenta" onClick={() => props.onSend({ type: 'reset' })} type="button">
          Rejouer
        </button>
      </Show>

      {/* Spectator */}
      <Show when={you() === null}>
        <span class="text-spy-muted text-xs font-bold uppercase tracking-[0.3em]">Spectateur</span>
      </Show>
    </div>
  );
};

export default ActionPanel;
