import { Component, For, createMemo } from 'solid-js';
import type { AgentType, PlayerId, PlayerView } from '../types';
import { AGENT_COLORS, AGENT_LABELS } from '../constants';

interface PlayZoneProps {
  view: PlayerView;
}

function groupCards(cards: AgentType[]): Map<AgentType, number> {
  const map = new Map<AgentType, number>();
  for (const card of cards) map.set(card, (map.get(card) ?? 0) + 1);
  return map;
}

// Ring color for counts that matter: 3 crypto wins, 3 risque loses, 2 is a warning.
function ringClass(card: AgentType, count: number): string {
  if (card === 'cryptologue' && count >= 3) return 'ring-2 ring-spy-success';
  if (card === 'risqueTout' && count >= 3) return 'ring-2 ring-spy-danger';
  if ((card === 'cryptologue' || card === 'risqueTout') && count === 2)
    return 'ring-2 ring-spy-warn';
  return '';
}

interface ZoneProps {
  cards: AgentType[];
  label: string;
  mine: boolean;
}

const PlayerZone: Component<ZoneProps> = (props) => {
  const groups = createMemo(() => [...groupCards(props.cards).entries()]);

  return (
    <div
      class={`rounded-2xl border-2 px-3 py-2 ${
        props.mine
          ? 'border-spy-accent/40 bg-spy-accent/5'
          : 'border-spy-border bg-spy-card'
      }`}
    >
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-spy-muted">
          {props.label}
        </span>
        <For each={groups()}>
          {([card, count]) => (
            <span
              class={`animate-card-enter inline-flex items-center gap-1.5 rounded-full bg-spy-surface border-2 border-spy-border pl-2 pr-1 py-0.5 shadow-card ${ringClass(card, count)}`}
            >
              <span
                class="w-2.5 h-2.5 rounded-full"
                style={{ background: AGENT_COLORS[card] }}
              />
              <span class="text-[12px] font-bold text-spy-text">{AGENT_LABELS[card]}</span>
              <span
                class="text-[11px] font-extrabold text-white rounded-full px-1.5 py-0.5"
                style={{ background: AGENT_COLORS[card] }}
              >
                x{count}
              </span>
            </span>
          )}
        </For>
        <For each={groups().length === 0 ? ['empty'] : []}>
          {() => <span class="text-[12px] text-spy-muted italic">Aucune carte</span>}
        </For>
      </div>
    </div>
  );
};

const PlayZone: Component<PlayZoneProps> = (props) => {
  const you = () => props.view.you;
  const opp = (): PlayerId | null =>
    you() === 'p1' ? 'p2' : you() === 'p2' ? 'p1' : null;

  return (
    <div class="flex flex-col gap-2 w-full">
      {you() !== null ? (
        <>
          <PlayerZone cards={props.view.inPlay[you()!]} label="Votre zone" mine={true} />
          <PlayerZone cards={props.view.inPlay[opp()!]} label="Zone adverse" mine={false} />
        </>
      ) : (
        <>
          <PlayerZone cards={props.view.inPlay.p1} label="Joueur 1" mine={false} />
          <PlayerZone cards={props.view.inPlay.p2} label="Joueur 2" mine={false} />
        </>
      )}
    </div>
  );
};

export default PlayZone;
