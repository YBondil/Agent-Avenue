import { Component, Show } from 'solid-js';
import type { AgentType } from '../types';
import { AGENT_ART, AGENT_COLORS, AGENT_LABELS } from '../constants';

interface CardProps {
  type?: AgentType;     // omit for a generic / face-down card
  faceDown?: boolean;   // show the holographic back
  count?: number;       // optional count badge (play zone)
  glow?: boolean;       // emphasised neon glow
  dim?: boolean;        // de-emphasise (not your turn etc.)
  class?: string;       // width / extra classes from the parent
  enter?: boolean;      // play the reveal animation on mount
  onClick?: () => void;
}

// One card to render them all: hand, play zone, deck backs, dilemma.
const Card: Component<CardProps> = (props) => {
  const accent = () => (props.type ? AGENT_COLORS[props.type] : '#22D3EE');

  return (
    <div
      class={`tcg-card flip ${props.faceDown ? 'is-down' : ''} ${
        props.enter ? 'animate-card-enter' : ''
      } ${props.dim ? 'opacity-50 saturate-50' : ''} ${
        props.onClick ? 'cursor-pointer' : ''
      } ${props.class ?? ''}`}
      style={{
        'box-shadow': props.glow
          ? `0 0 34px -2px ${accent()}, 0 16px 36px -10px rgba(0,0,0,0.85)`
          : `0 0 16px -4px ${accent()}aa, 0 10px 22px -10px rgba(0,0,0,0.8)`,
      }}
      onClick={() => props.onClick?.()}
    >
      <div class="flip__inner">
        {/* Front (face up) */}
        <div
          class="flip__face tcg-front flex flex-col"
          style={{ 'box-shadow': `inset 0 0 0 2px ${accent()}88` }}
        >
          <Show when={props.type}>
            <img
              src={AGENT_ART[props.type!]}
              alt=""
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            {/* Neon accent header bar */}
            <div class="absolute top-0 left-0 right-0 h-1.5" style={{ background: accent() }} />
            {/* Name plate */}
            <div class="mt-auto relative z-[1] px-1.5 pb-1.5 pt-3 bg-gradient-to-t from-black/85 to-transparent">
              <div
                class="text-center font-bold leading-tight neon-text"
                style={{ color: accent(), 'font-size': 'clamp(8px, 2.4vw, 13px)' }}
              >
                {AGENT_LABELS[props.type!]}
              </div>
            </div>
          </Show>
          {/* Count badge */}
          <Show when={props.count && props.count > 1}>
            <div
              class="absolute -top-2 -right-2 z-[2] min-w-6 h-6 px-1 rounded-full flex items-center justify-center text-xs font-extrabold text-black"
              style={{ background: accent(), 'box-shadow': `0 0 12px ${accent()}` }}
            >
              x{props.count}
            </div>
          </Show>
        </div>

        {/* Back (face down) */}
        <div class="flip__face flip__back tcg-back" />
      </div>
    </div>
  );
};

export default Card;
