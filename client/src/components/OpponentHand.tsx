import { Component, For } from 'solid-js';

interface OpponentHandProps {
  count: number;
}

// Opponent's hand: overlapping card backs fanned from the top edge.
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
                class="w-[8vh] max-w-[52px] transition-transform duration-300"
                style={{
                  margin: '0 -10px',
                  transform: `translateY(${Math.abs(offset) * 4}px) rotate(${offset * 4}deg)`,
                  'z-index': String(i()),
                }}
              >
                <div class="card-back w-full" />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default OpponentHand;
