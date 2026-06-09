import { Component } from 'solid-js';
import type { PlayerId, WinReason } from '../types';
import { WIN_REASON_LABELS } from '../constants';

interface WinBannerProps {
  winner: PlayerId;
  you: PlayerId | null;
  winReason?: WinReason;
  onReset: () => void;
}

// Neon victory/defeat overlay centered in the arena.
const WinBanner: Component<WinBannerProps> = (props) => {
  const youWon = () => props.you !== null && props.winner === props.you;
  const color = () => (youWon() ? '#34D399' : '#FB7185');

  return (
    <div class="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-3 px-10 py-8">
        <div
          class="text-5xl font-extrabold uppercase tracking-[0.15em] neon-text animate-dilemma-in"
          style={{ color: color() }}
        >
          {youWon() ? 'Victoire' : props.you === null ? `${props.winner} gagne` : 'Defaite'}
        </div>
        <div class="text-spy-muted text-sm uppercase tracking-[0.25em]">
          {props.winReason ? WIN_REASON_LABELS[props.winReason] ?? props.winReason : 'Duel termine'}
        </div>
      </div>
    </div>
  );
};

export default WinBanner;
