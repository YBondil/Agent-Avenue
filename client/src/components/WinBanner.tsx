import { Component } from 'solid-js';
import type { PlayerId, WinReason } from '../types';
import { WIN_REASON_LABELS } from '../constants';

interface WinBannerProps {
  winner: PlayerId;
  you: PlayerId | null;
  winReason?: WinReason;
  onReset: () => void;
}

const WinBanner: Component<WinBannerProps> = (props) => {
  const youWon = () => props.you !== null && props.winner === props.you;

  return (
    <div
      class={`rounded-2xl border-2 p-6 text-center ${
        youWon()
          ? 'border-spy-success bg-spy-success/10'
          : 'border-spy-danger bg-spy-danger/10'
      }`}
    >
      <div class={`text-2xl font-bold mb-2 ${youWon() ? 'text-spy-success' : 'text-spy-danger'}`}>
        {youWon() ? 'Victoire !' : props.you === null ? `${props.winner} gagne !` : 'Defaite...'}
      </div>
      <div class="text-spy-muted text-sm mb-4">
        {props.winReason ? WIN_REASON_LABELS[props.winReason] ?? props.winReason : 'Fin de la partie'}
      </div>
      <div class="text-spy-text text-sm mb-4">
        <span class="font-semibold">{props.winner === 'p1' ? 'Joueur 1' : 'Joueur 2'}</span> remporte la partie.
      </div>
      <button
        class="btn-primary"
        onClick={props.onReset}
        type="button"
      >
        Rejouer
      </button>
    </div>
  );
};

export default WinBanner;
