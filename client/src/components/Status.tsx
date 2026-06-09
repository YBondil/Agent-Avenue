import { Component } from 'solid-js';
import type { PlayerView } from '../types';

interface StatusProps {
  view: PlayerView;
}

// Compact info strip: draw pile size and remaining discards per player.
const Status: Component<StatusProps> = (props) => {
  const view = () => props.view;
  const discardsLeft = (pid: 'p1' | 'p2') => 4 - view().discardsUsed[pid];

  return (
    <div class="flex items-center gap-2 text-[11px] font-bold">
      <span class="flex items-center gap-1 bg-spy-card border-2 border-spy-border rounded-full px-2.5 py-1">
        <span class="text-spy-muted uppercase tracking-wider">Pioche</span>
        <span class="text-spy-text text-sm">{view().deckCount}</span>
      </span>
      <span class="flex items-center gap-1 bg-spy-card border-2 border-spy-border rounded-full px-2.5 py-1">
        <span class="text-spy-muted uppercase tracking-wider">Defausses</span>
        <span class="text-spy-accent">P1 {discardsLeft('p1')}</span>
        <span class="text-spy-danger">P2 {discardsLeft('p2')}</span>
      </span>
    </div>
  );
};

export default Status;
