import { Component, For } from 'solid-js';

interface OpponentHandProps {
  count: number;
}

// Opponent's hand shown as face-down card backs (top zone).
const OpponentHand: Component<OpponentHandProps> = (props) => {
  return (
    <div class="flex items-center gap-2">
      <span class="text-[11px] font-bold uppercase tracking-wider text-spy-muted whitespace-nowrap">
        Adversaire
      </span>
      <div class="flex gap-1.5">
        <For each={Array.from({ length: props.count })}>
          {() => <div class="card-back w-8 h-11 text-sm">?</div>}
        </For>
        <For each={props.count === 0 ? ['empty'] : []}>
          {() => <span class="text-xs text-spy-muted italic">Main vide</span>}
        </For>
      </div>
    </div>
  );
};

export default OpponentHand;
