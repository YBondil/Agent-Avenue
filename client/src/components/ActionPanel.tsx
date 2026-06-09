import { Component, Show, createMemo } from 'solid-js';
import type { AgentType, PlayerView } from '../types';
import { AGENT_LABELS } from '../constants';
import type { ClientMessage } from '../ws';

interface ActionPanelProps {
  view: PlayerView;
  selectedFaceUp: AgentType | null;
  selectedFaceDown: AgentType | null;
  discardCandidate: AgentType | null;
  discardMode: boolean;
  onSend: (msg: ClientMessage) => void;
  onToggleDiscardMode: () => void;
  onResetSelection: () => void;
}

const ActionPanel: Component<ActionPanelProps> = (props) => {
  const view = () => props.view;
  const you = () => view().you;
  const isActive = () => you() !== null && view().activePlayer === you();
  const phase = () => view().phase;

  const discardsLeft = createMemo(() => {
    const pid = you();
    if (!pid) return 0;
    return 4 - view().discardsUsed[pid];
  });

  const canDiscard = () =>
    discardsLeft() > 0 && view().deckCount > 0;

  // Determine if we can play: 2 different cards selected, or all 4 identical and 2 identical selected
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

  function handleDiscard() {
    const card = props.discardCandidate;
    if (!card) return;
    props.onSend({ type: 'discard', card });
    props.onResetSelection();
  }

  function handleRecruit(choice: 'faceUp' | 'faceDown') {
    props.onSend({ type: 'recruit', choice });
  }

  // Spectator view
  if (you() === null) {
    return (
      <div class="bg-spy-surface rounded-lg p-4 border border-spy-border text-center">
        <div class="text-spy-muted text-sm">Vous observez la partie en tant que spectateur.</div>
      </div>
    );
  }

  return (
    <div class="bg-spy-surface rounded-lg p-4 border border-spy-border flex flex-col gap-3">
      {/* Play phase - active player */}
      <Show when={phase() === 'play' && isActive()}>
        <div class="text-spy-success font-semibold text-sm">A vous de jouer !</div>
        <div class="text-spy-muted text-xs mb-1">
          Selectionnez une carte face visible et une face cachee, puis cliquez "Jouer".
        </div>

        {/* Discard row */}
        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="btn-secondary text-sm"
            onClick={props.onToggleDiscardMode}
            disabled={!canDiscard()}
            type="button"
          >
            {props.discardMode ? 'Annuler defausse' : `Defausser (${discardsLeft()} restante${discardsLeft() > 1 ? 's' : ''})`}
          </button>

          <Show when={props.discardMode && props.discardCandidate !== null}>
            <button
              class="btn-danger text-sm"
              onClick={handleDiscard}
              type="button"
            >
              Confirmer defausse: {props.discardCandidate ? AGENT_LABELS[props.discardCandidate] : ''}
            </button>
          </Show>
        </div>

        {/* Play row */}
        <Show when={!props.discardMode}>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="text-xs text-spy-text">
              <span class="text-spy-success">Face visible:</span>{' '}
              {props.selectedFaceUp ? AGENT_LABELS[props.selectedFaceUp] : '-'}
            </div>
            <div class="text-xs text-spy-text">
              <span class="text-spy-warn">Face cachee:</span>{' '}
              {props.selectedFaceDown ? AGENT_LABELS[props.selectedFaceDown] : '-'}
            </div>
            <button
              class="btn-primary text-sm"
              onClick={handlePlay}
              disabled={!canPlay()}
              type="button"
            >
              Jouer
            </button>
            <Show when={props.selectedFaceUp !== null || props.selectedFaceDown !== null}>
              <button
                class="btn-secondary text-sm"
                onClick={props.onResetSelection}
                type="button"
              >
                Reinitialiser
              </button>
            </Show>
          </div>
          <Show when={props.selectedFaceUp !== null && props.selectedFaceDown !== null && !canPlay()}>
            <p class="text-xs text-spy-danger">
              Les deux cartes doivent etre differentes (sauf si votre main est entierement identique).
            </p>
          </Show>
        </Show>
      </Show>

      {/* Play phase - waiting */}
      <Show when={phase() === 'play' && !isActive()}>
        <div class="text-spy-muted text-sm text-center">
          En attente de l'adversaire...
        </div>
      </Show>

      {/* Recruit phase - non-active (you choose) */}
      <Show when={phase() === 'recruit' && !isActive()}>
        <div class="text-spy-success font-semibold text-sm">Choisissez la carte a recruter</div>
        <p class="text-xs text-spy-muted">
          Selectionnez l'une des deux cartes proposees. L'adversaire recevra l'autre.
        </p>

        <Show when={view().proposed !== null}>
          <div class="flex gap-3 flex-wrap mt-1">
            {/* Face up card */}
            <button
              class="agent-card flex flex-col items-center gap-1 p-3"
              onClick={() => handleRecruit('faceUp')}
              type="button"
            >
              <span class="text-xs text-spy-muted uppercase tracking-wider">Face visible</span>
              <span class="font-bold text-spy-text">
                {view().proposed ? AGENT_LABELS[view().proposed!.faceUp] : ''}
              </span>
            </button>

            {/* Face down card */}
            <button
              class="agent-card flex flex-col items-center gap-1 p-3"
              onClick={() => handleRecruit('faceDown')}
              type="button"
            >
              <span class="text-xs text-spy-muted uppercase tracking-wider">Face cachee</span>
              <span class="font-bold text-2xl text-spy-muted">?</span>
            </button>
          </div>
        </Show>
      </Show>

      {/* Recruit phase - active player waits */}
      <Show when={phase() === 'recruit' && isActive()}>
        <div class="text-spy-muted text-sm text-center">
          En attente du recrutement de l'adversaire...
        </div>
        <Show when={view().proposed !== null}>
          <div class="text-xs text-spy-muted mt-1">
            Vous avez joue:{' '}
            <span class="text-spy-success">{view().proposed ? AGENT_LABELS[view().proposed!.faceUp] : ''}</span>{' '}
            (visible) et{' '}
            <span class="text-spy-warn">
              {view().proposed?.faceDown ? AGENT_LABELS[view().proposed!.faceDown!] : '?'}
            </span>{' '}
            (cache, visible uniquement par vous).
          </div>
        </Show>
      </Show>

      {/* Ended */}
      <Show when={phase() === 'ended'}>
        <button
          class="btn-primary"
          onClick={() => props.onSend({ type: 'reset' })}
          type="button"
        >
          Rejouer
        </button>
      </Show>
    </div>
  );
};

export default ActionPanel;
