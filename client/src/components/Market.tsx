import { Component, For, Show } from 'solid-js';
import type { PlayerView } from '../types';
import BMCard from './BMCard';

interface MarketProps {
  view: PlayerView;
}

// Compact always-on Marché Noir display: the 3 revealed cards + the face-down
// pile, shown as a small strip at the top of the arena (advanced mode).
const Market: Component<MarketProps> = (props) => {
  return (
    <Show when={props.view.mode === 'advanced'}>
      <div class="flex items-center justify-center gap-2 py-1">
        <span class="text-[9px] font-bold uppercase tracking-wider text-spy-accent">
          Marche Noir
        </span>
        <For each={props.view.market}>
          {(card) => (
            <div class="w-[6vh] max-w-[40px]">
              <Show when={card} fallback={<div class="w-full rounded-md bg-spy-card/40" style={{ 'aspect-ratio': '5/7' }} />}>
                <BMCard card={card!} />
              </Show>
            </div>
          )}
        </For>
        <div class="relative w-[6vh] max-w-[40px]">
          <BMCard faceDown />
          <div class="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ink border border-spy-accent text-[10px] font-extrabold flex items-center justify-center text-spy-text">
            {props.view.marketDeckCount}
          </div>
        </div>
      </div>
    </Show>
  );
};

export default Market;
