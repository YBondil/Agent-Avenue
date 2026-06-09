import { Component, Show } from 'solid-js';
import type { AgentType } from '../types';
import { AGENT_LABELS } from '../constants';

interface CardProps {
  type?: AgentType;   // omit for a generic / face-down card
  faceDown?: boolean; // show the back sprite
  count?: number;     // count badge (> 1), anchored outside the card
  selected?: boolean; // emphasised ring + lift
  dim?: boolean;
  enter?: boolean;    // play placement animation on mount
  class?: string;     // width / extra classes from the parent
  onClick?: () => void;
}

const FRONT = (t: AgentType) => `/assets/cards/${t}.png`;
const BACK = '/assets/cards/back.png';

// One card to render them all (hand, play zone, deck backs, dilemma). The visual
// is the definitive PNG sprite; we only add shadow, rounding, the 3D flip and an
// out-of-card count badge.
const Card: Component<CardProps> = (props) => {
  return (
    <div
      class={`tcg-card flip ${props.faceDown ? 'is-down' : ''} ${
        props.enter ? 'animate-place' : ''
      } ${props.dim ? 'opacity-60 saturate-50' : ''} ${
        props.onClick ? 'cursor-pointer' : ''
      } ${props.selected ? 'is-selected' : ''} ${props.class ?? ''}`}
      onClick={() => props.onClick?.()}
    >
      <div class="flip__inner">
        {/* Front (face up): the agent sprite */}
        <div class="flip__face">
          <Show when={props.type} fallback={<img class="card-img" src={BACK} alt="" />}>
            <img class="card-img" src={FRONT(props.type!)} alt={AGENT_LABELS[props.type!]} />
          </Show>
        </div>
        {/* Back (face down) */}
        <div class="flip__face flip__back">
          <img class="card-img" src={BACK} alt="" />
        </div>
      </div>

      {/* Count badge, anchored OUTSIDE the card so it is never clipped */}
      <Show when={props.count && props.count > 1}>
        <div
          class="absolute -top-2 -right-2 z-50 min-w-[26px] h-[26px] px-1 rounded-full
            flex items-center justify-center text-sm font-extrabold text-white shadow-card"
          style={{ background: '#1f2937', border: '2px solid #e8c170' }}
        >
          x{props.count}
        </div>
      </Show>
    </div>
  );
};

export default Card;
