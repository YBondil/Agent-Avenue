import { Component, For, Show, createMemo } from 'solid-js';
import type { AgentType } from '../types';
import Card from './Card';

interface PlayZoneProps {
  cards: AgentType[];
  label: string;
  mine: boolean;
}

function group(cards: AgentType[]): { card: AgentType; count: number }[] {
  const m = new Map<AgentType, number>();
  for (const c of cards) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m.entries()].map(([card, count]) => ({ card, count }));
}

// A thin horizontal strip of recruited cards (grouped by type), placed next to
// the owner's hand and clear of the board. Centers when it fits, scrolls
// horizontally otherwise, so it never spills off-screen.
const PlayZone: Component<PlayZoneProps> = (props) => {
  const groups = createMemo(() => group(props.cards));
  return (
    <div class="overflow-x-auto overflow-y-visible">
      <div class="flex items-center gap-1.5 w-max mx-auto px-2 py-2 min-h-[44px]">
        <span class="shrink-0 text-[9px] font-bold uppercase tracking-wider text-spy-muted">
          {props.label}
        </span>
        <Show
          when={groups().length > 0}
          fallback={<span class="text-[10px] text-spy-muted/70 italic">vide</span>}
        >
          <For each={groups()}>
            {(g) => (
              <div class="shrink-0 w-[clamp(34px,5.2dvh,48px)]">
                <Card type={g.card} count={g.count} enter />
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default PlayZone;
