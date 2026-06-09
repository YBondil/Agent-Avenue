import { Component, For } from 'solid-js';
import Card from './Card';

interface OpponentHandProps {
  count: number;
}

// Opponent's hand: overlapping face-down sprites fanned from the top edge.
const OpponentHand: Component<OpponentHandProps> = (props) => {
  return (
    <div class="flex justify-center">
      <div class="flex">
        <For each={Array.from({ length: props.count })}>
          {(_, i) => {
            const n = props.count;
            const offset = i() - (n - 1) / 2;
            return (
              <div
                class="w-[7.5vh] max-w-[50px] transition-transform duration-300"
                style={{
                  margin: '0 -9px',
                  transform: `translateY(${Math.abs(offset) * 4}px) rotate(${offset * 4}deg)`,
                  'z-index': String(i()),
                }}
              >
                <Card faceDown />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default OpponentHand;
