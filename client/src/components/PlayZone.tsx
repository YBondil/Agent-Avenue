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

// Deterministic small rotation for a hand-placed feel.
const tilt = (i: number) => ((i * 37) % 5) - 2;

const Cluster: Component<{ cards: AgentType[]; side: 'left' | 'right'; label: string }> = (
  props
) => {
  const groups = createMemo(() => groupCards(props.cards));
  return (
    <div
      class="absolute top-1/2 -translate-y-1/2 w-[26%] max-w-[140px] flex flex-col items-center gap-1.5"
      style={{ [props.side]: '2%' }}
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-spy-muted">
        {props.label}
      </span>
      <div class="flex flex-wrap justify-center gap-x-2 gap-y-3">
        <For each={groups()}>
          {(g, i) => (
            <div class="w-[8vh] max-w-[52px]" style={{ transform: `rotate(${tilt(i())}deg)` }}>
              <Card type={g.card} count={g.count} enter />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

// Recruited cards on either side of the arena interior.
const PlayZone: Component<PlayZoneProps> = (props) => {
  const you = () => props.view.you;
  const opp = (): PlayerId => (you() === 'p1' ? 'p2' : 'p1');
  const mySide = you() ?? 'p1';
  const oppSide = you() ? opp() : 'p2';

  return (
    <div class="absolute inset-0 pointer-events-none">
      <Cluster cards={props.view.inPlay[oppSide]} side="left" label="Adversaire" />
      <Cluster cards={props.view.inPlay[mySide]} side="right" label="Vous" />
    </div>
  );
};

export default PlayZone;
