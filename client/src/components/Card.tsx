import { Component, For, Show } from 'solid-js';
import type { AgentType } from '../types';
import { AGENT_EFFECTS, AGENT_LABELS } from '../constants';
import AgentIcon from './AgentIcon';

interface CardProps {
  type?: AgentType;   // omit for a generic / face-down card
  faceDown?: boolean;
  count?: number;     // count badge (shown when > 1), anchored outside the card
  selected?: boolean; // gold highlight ring
  dim?: boolean;
  enter?: boolean;    // play placement animation on mount
  class?: string;     // width / extra classes from the parent
  onClick?: () => void;
}

type Cell = { text: string; bg: string; fg: string; ghost?: boolean };

// Classify one movement value into a colored circle.
function cell(v: string): Cell {
  if (v === '-') return { text: '', bg: 'transparent', fg: '#b8ad94', ghost: true };
  if (v === 'VICTOIRE') return { text: 'V', bg: '#2e8b57', fg: '#fff' };
  if (v === 'DEFAITE') return { text: 'X', bg: '#c0392b', fg: '#fff' };
  if (v === '0') return { text: '0', bg: '#a59a82', fg: '#fff' };
  const n = parseInt(v, 10);
  if (n > 0) return { text: v, bg: '#2e8b57', fg: '#fff' };
  if (n < 0) return { text: v, bg: '#c0392b', fg: '#fff' };
  return { text: v, bg: '#a59a82', fg: '#fff' };
}

const Card: Component<CardProps> = (props) => {
  const eff = () => (props.type ? AGENT_EFFECTS[props.type] : null);
  const cells = () => {
    const e = eff();
    return e ? [cell(e.one), cell(e.two), cell(e.three)] : [];
  };

  return (
    <div
      class={`relative ${props.dim ? 'opacity-60 saturate-50' : ''} ${
        props.onClick ? 'cursor-pointer' : ''
      } ${props.selected ? 'scale-[1.04]' : ''} transition-transform ${props.class ?? ''}`}
      onClick={() => props.onClick?.()}
    >
      <Show
        when={!props.faceDown && props.type}
        fallback={<div class="card-back" />}
      >
        <div
          class={`play-card ${props.enter ? 'animate-place' : ''}`}
          style={
            props.selected
              ? { 'box-shadow': '0 0 0 3px #caa15a, 0 12px 24px -8px rgba(0,0,0,0.7)' }
              : undefined
          }
        >
          {/* Effect rail: 1x / 2x / 3x stacked on the left edge */}
          <div class="absolute left-[3px] top-0 bottom-0 flex flex-col justify-center gap-[3px] z-[2]">
            <For each={cells()}>
              {(c) => (
                <div
                  class="rounded-full flex items-center justify-center font-extrabold"
                  style={{
                    width: '38%',
                    'aspect-ratio': '1',
                    'min-width': '14px',
                    background: c.ghost ? 'transparent' : c.bg,
                    color: c.fg,
                    border: c.ghost ? '1.5px dashed #c9bd9f' : '1.5px solid rgba(0,0,0,0.25)',
                    'font-size': 'clamp(6px, 1.7vw, 10px)',
                    'box-shadow': c.ghost ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {c.text}
                </div>
              )}
            </For>
          </div>

          {/* Centered agent artwork */}
          <div class="absolute inset-0 flex items-center justify-center pl-[22%]">
            <AgentIcon type={props.type!} class="w-[68%] h-[68%] drop-shadow" />
          </div>

          {/* Name plate */}
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/15 to-transparent pt-2 pb-0.5 px-0.5">
            <div
              class="text-center font-bold leading-none text-ink"
              style={{ 'font-size': 'clamp(6px, 1.9vw, 11px)' }}
            >
              {AGENT_LABELS[props.type!]}
            </div>
          </div>
        </div>
      </Show>

      {/* Count badge: anchored OUTSIDE the card so it is never clipped */}
      <Show when={props.count && props.count > 1}>
        <div
          class="absolute -top-2 -right-2 z-50 min-w-[22px] h-[22px] px-1 rounded-full
            flex items-center justify-center text-xs font-extrabold text-white shadow-card"
          style={{ background: '#26211a', border: '2px solid #caa15a' }}
        >
          x{props.count}
        </div>
      </Show>
    </div>
  );
};

export default Card;
