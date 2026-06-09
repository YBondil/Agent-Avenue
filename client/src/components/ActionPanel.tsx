import { Component, Show, createMemo } from 'solid-js';
import type { AgentType, PlayerView } from '../types';
import { AGENT_COLORS, AGENT_LABELS } from '../constants';
import type { ClientMessage } from '../ws';

interface ActionPanelProps {
  view: PlayerView;
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  onSend: (msg: ClientMessage) => void;
  onResetSelection: () => void;
}

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

  function handleRecruit(choice: 'faceUp' | 'faceDown') {
    props.onSend({ type: 'recruit', choice });
  }

  if (you() === null) {
    return (
      <div class="text-center text-spy-muted text-sm font-bold py-1">
        Vous observez la partie en tant que spectateur.
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-2">
      {/* Play phase - active player */}
      <Show when={phase() === 'play' && isActive()}>
        <div class="flex items-center gap-2">
          <button
            class="btn-primary flex-1 text-base"
            onClick={handlePlay}
            disabled={!canPlay()}
            type="button"
          >
            Jouer
          </button>
          <Show when={props.selectedFaceUp !== null || props.selectedFaceDown !== null}>
            <button class="btn-secondary px-4" onClick={props.onResetSelection} type="button">
              Annuler
            </button>
          </Show>
        </div>
        <Show
          when={props.selectedFaceUp !== null && props.selectedFaceDown !== null && !canPlay()}
        >
          <p class="text-[11px] font-bold text-spy-danger text-center">
            Les deux cartes doivent etre differentes.
          </p>
        </Show>
      </Show>

      {/* Play phase - waiting */}
      <Show when={phase() === 'play' && !isActive()}>
        <div class="text-spy-muted text-sm font-bold text-center py-1">
          En attente de l'adversaire...
        </div>
      </Show>

      {/* Recruit phase - you choose */}
      <Show when={phase() === 'recruit' && !isActive()}>
        <div class="text-spy-success font-extrabold text-sm text-center">
          Choisissez la carte a recruter (l'autre revient a l'adversaire)
        </div>
        <Show when={view().proposed !== null}>
          <div class="grid grid-cols-2 gap-3">
            <button
              class="agent-card flex flex-col items-center justify-center gap-1 py-4"
              onClick={() => handleRecruit('faceUp')}
              type="button"
            >
              <span
                class="agent-stripe"
                style={{ background: AGENT_COLORS[view().proposed!.faceUp] }}
              />
              <span class="text-[10px] font-bold text-spy-muted uppercase tracking-wider">
                Face visible
              </span>
              <span class="font-extrabold text-spy-text">
                {AGENT_LABELS[view().proposed!.faceUp]}
              </span>
            </button>
            <button
              class="agent-card flex flex-col items-center justify-center gap-1 py-4"
              onClick={() => handleRecruit('faceDown')}
              type="button"
            >
              <span class="text-[10px] font-bold text-spy-muted uppercase tracking-wider">
                Face cachee
              </span>
              <span class="font-extrabold text-3xl text-spy-muted">?</span>
            </button>
          </div>
        </Show>
      </Show>

      {/* Recruit phase - active player waits */}
      <Show when={phase() === 'recruit' && isActive()}>
        <div class="text-spy-muted text-sm font-bold text-center">
          En attente du recrutement de l'adversaire...
        </div>
        <Show when={view().proposed !== null}>
          <div class="text-[11px] text-spy-muted text-center">
            Vous avez joue{' '}
            <span class="font-bold text-spy-success">
              {AGENT_LABELS[view().proposed!.faceUp]}
            </span>{' '}
            (visible) et{' '}
            <span class="font-bold text-spy-warn">
              {view().proposed?.faceDown ? AGENT_LABELS[view().proposed!.faceDown!] : '?'}
            </span>{' '}
            (cachee).
          </div>
        </Show>
      </Show>

      {/* Ended */}
      <Show when={phase() === 'ended'}>
        <button class="btn-primary w-full" onClick={() => props.onSend({ type: 'reset' })} type="button">
          Rejouer
        </button>
      </Show>
    </div>
  );
};

export default ActionPanel;
