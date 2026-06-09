import { Component, For } from 'solid-js';
import Card from './Card';

interface OpponentHandProps {
  count: number;
  active?: boolean; // opponent is the active player
}

// Opponent's hand: holographic backs fanned downward from the top edge with a
// negative overlap, hanging into the arena like a dealt spread.
const OpponentHand: Component<OpponentHandProps> = (props) => {
  return (
    <div class="flex justify-center">
      <div class="flex -space-x-7">
        <For each={Array.from({ length: props.count })}>
          {(_, i) => {
            const n = props.count;
            const mid = (n - 1) / 2;
            const offset = i() - mid;
            return (
              <div
                class="w-14 transition-transform duration-300"
                style={{
                  transform: `translateY(${Math.abs(offset) * 5}px) rotate(${offset * 5}deg)`,
                  'z-index': String(i()),
                }}
              >
                <Card faceDown glow={props.active} />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default OpponentHand;
