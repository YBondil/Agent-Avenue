import { Component } from 'solid-js';
import type { PlayerId, WinReason } from '../types';
import { WIN_REASON_LABELS } from '../constants';

interface WinBannerProps {
  winner: PlayerId;
  you: PlayerId | null;
  winReason?: WinReason;
  onReset: () => void;
}

// Result plaque centered on the table (no blur, light dimming only).
const WinBanner: Component<WinBannerProps> = (props) => {
  const youWon = () => props.you !== null && props.winner === props.you;

  return (
    <div class="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
      <div
        class="flex flex-col items-center gap-2 px-10 py-7 rounded-3xl animate-rise"
        style={{
          background: 'linear-gradient(180deg, #16294a 0%, #0b1220 100%)',
          border: '3px solid #e8c170',
          'box-shadow': '0 20px 50px -12px rgba(0,0,0,0.85), inset 0 0 30px rgba(0,0,0,0.5)',
        }}
      >
        <div
          class="text-4xl font-extrabold uppercase tracking-[0.12em]"
          style={{ color: youWon() ? '#5ad08a' : '#e06a6a' }}
        >
          {youWon() ? 'Victoire' : props.you === null ? `${props.winner} gagne` : 'Defaite'}
        </div>
        <div class="text-spy-muted text-sm uppercase tracking-[0.2em]">
          {props.winReason ? WIN_REASON_LABELS[props.winReason] ?? props.winReason : 'Partie terminee'}
        </div>
      </div>
    </div>
  );
};

export default WinBanner;
