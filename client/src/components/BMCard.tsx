import { Component, Show } from 'solid-js';
import type { BlackMarketType } from '../types';
import { BLACK_MARKET_BACK, blackMarketArt, BLACK_MARKET_LABELS } from '../constants';

interface BMCardProps {
  card?: BlackMarketType; // omit (with faceDown) for the pile back
  faceDown?: boolean;
  selected?: boolean;
  enter?: boolean;
  class?: string;
  onClick?: () => void;
}

// A Marché Noir card: definitive JPEG sprite, rounded corners + shadow, matching
// the Agent cards' look.
const BMCard: Component<BMCardProps> = (props) => {
  return (
    <div
      class={`relative ${props.onClick ? 'cursor-pointer' : ''} ${
        props.enter ? 'animate-place' : ''
      } ${props.selected ? 'is-bm-selected' : ''} ${props.class ?? ''}`}
      onClick={() => props.onClick?.()}
      style={{ 'aspect-ratio': '5 / 7' }}
    >
      <img
        class="block w-full h-full rounded-xl object-cover"
        src={props.faceDown || !props.card ? BLACK_MARKET_BACK : blackMarketArt(props.card)}
        alt={props.card ? BLACK_MARKET_LABELS[props.card] : ''}
        style={{
          'box-shadow': props.selected
            ? '0 0 0 3px #e8c170, 0 12px 24px -8px rgba(0,0,0,0.8)'
            : '0 8px 18px -6px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.5)',
        }}
      />
      <Show when={props.selected}>
        <div class="absolute inset-0 rounded-xl pointer-events-none" />
      </Show>
    </div>
  );
};

export default BMCard;
