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

// Deterministic small rotation in [-2, 2] degrees for an asymmetric, hand-placed feel.
const tilt = (i: number) => ((i * 37) % 5) - 2;

interface ClusterProps {
  cards: AgentType[];
  side: 'left' | 'right';
  mine: boolean;
}

const Cluster: Component<ClusterProps> = (props) => {
  const groups = createMemo(() => groupCards(props.cards));
  return (
    <div
      class="absolute top-1/2 -translate-y-1/2 w-[30%] max-w-[150px] flex flex-wrap justify-center gap-x-1 gap-y-2"
      style={{ [props.side]: '8%' }}
    >
      <For each={groups()}>
        {(g, i) => (
          <div class="w-12" style={{ transform: `rotate(${tilt(i())}deg)` }}>
            <Card type={g.card} count={g.count} glow={props.mine} enter />
          </div>
        )}
      </For>
    </div>
  );
};

// Recruited cards laid out on either side of the arena interior.
const PlayZone: Component<PlayZoneProps> = (props) => {
  const you = () => props.view.you;
  const opp = (): PlayerId => (you() === 'p1' ? 'p2' : 'p1');

  // Your cards sit on the right (near your hand), opponent's on the left.
  const mySide = you() ?? 'p1';
  const oppSide = you() ? opp() : 'p2';

  return (
    <div class="absolute inset-0 pointer-events-none">
      <Cluster cards={props.view.inPlay[oppSide]} side="left" mine={false} />
      <Cluster cards={props.view.inPlay[mySide]} side="right" mine={you() !== null} />
    </div>
  );
};

export default PlayZone;
