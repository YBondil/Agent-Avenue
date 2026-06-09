import { Component, For, createMemo } from 'solid-js';
import type { AgentType, PlayerId, PlayerView } from '../types';
import Card from './Card';

interface PlayZoneProps {
  view: PlayerView;
}

function groupCards(cards: AgentType[]): { card: AgentType; count: number }[] {
  const map = new Map<AgentType, number>();
  for (const c of cards) map.set(c, (map.get(c) ?? 0) + 1);
  return [...map.entries()].map(([card, count]) => ({ card, count }));
}

// Deterministic small tilt for an asymmetric, hand-placed feel.
const tilt = (i: number) => ((i * 37) % 5) - 2;

const Row: Component<{ cards: AgentType[]; side: 'top' | 'bottom'; label: string }> = (props) => {
  const groups = createMemo(() => groupCards(props.cards));
  return (
    <div
      class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
      style={{ [props.side]: '13%' }}
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-spy-muted">
        {props.label}
      </span>
      <For each={groups()}>
        {(g, i) => (
          <div class="w-[8.5vh] max-w-[56px]" style={{ transform: `rotate(${tilt(i())}deg)` }}>
            <Card type={g.card} count={g.count} enter />
          </div>
        )}
      </For>
    </div>
  );
};

// Recruited cards: opponent's along the top of the arena, yours along the bottom.
const PlayZone: Component<PlayZoneProps> = (props) => {
  const you = () => props.view.you;
  const opp = (): PlayerId => (you() === 'p1' ? 'p2' : 'p1');
  const mySide = you() ?? 'p1';
  const oppSide = you() ? opp() : 'p2';

  return (
    <div class="absolute inset-0 pointer-events-none">
      <Row cards={props.view.inPlay[oppSide]} side="top" label="Adversaire" />
      <Row cards={props.view.inPlay[mySide]} side="bottom" label="Vous" />
    </div>
  );
};

export default PlayZone;
