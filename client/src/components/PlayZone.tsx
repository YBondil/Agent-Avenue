import { Component, For, createMemo } from 'solid-js';
import type { AgentType, PlayerId, PlayerView } from '../types';
import { AGENT_LABELS } from '../constants';

interface PlayZoneProps {
  view: PlayerView;
}

function groupCards(cards: AgentType[]): Map<AgentType, number> {
  const map = new Map<AgentType, number>();
  for (const card of cards) {
    map.set(card, (map.get(card) ?? 0) + 1);
  }
  return map;
}

function badgeClass(card: AgentType, count: number): string {
  if (card === 'cryptologue' && count >= 3) return 'bg-spy-success text-white';
  if (card === 'risqueTout' && count >= 3) return 'bg-spy-danger text-white';
  if (card === 'cryptologue' && count === 2) return 'bg-spy-warn text-black';
  if (card === 'risqueTout' && count === 2) return 'bg-spy-warn text-black';
  return 'bg-spy-border text-spy-text';
}

interface ZoneProps {
  pid: PlayerId;
  cards: AgentType[];
  label: string;
}

const PlayerZone: Component<ZoneProps> = (props) => {
  const groups = createMemo(() => groupCards(props.cards));

  return (
    <div class="bg-spy-surface rounded-lg p-3 border border-spy-border">
      <div class="text-xs text-spy-muted uppercase tracking-wider mb-2">{props.label}</div>
      <div class="flex flex-wrap gap-2">
        <For each={[...groups().entries()]}>
          {([card, count]) => (
            <div class="flex items-center gap-1 bg-spy-card rounded px-2 py-1 border border-spy-border">
              <span class="text-xs text-spy-text">{AGENT_LABELS[card]}</span>
              <span
                class={`text-xs font-bold rounded-full px-1.5 py-0.5 ${badgeClass(card, count)}`}
              >
                x{count}
              </span>
            </div>
          )}
        </For>
        <For each={groups().size === 0 ? ['empty'] : []}>
          {() => (
            <span class="text-xs text-spy-muted italic">Aucune carte recrutee</span>
          )}
        </For>
      </div>
    </div>
  );
};

const PlayZone: Component<PlayZoneProps> = (props) => {
  const youPid = () => props.view.you;
  const oppPid = (): PlayerId | null => {
    if (props.view.you === 'p1') return 'p2';
    if (props.view.you === 'p2') return 'p1';
    return null;
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="text-sm font-semibold text-spy-text mb-1">Zone de jeu</div>
      {youPid() !== null ? (
        <>
          <PlayerZone
            pid={youPid()!}
            cards={props.view.inPlay[youPid()!]}
            label="Votre zone"
          />
          <PlayerZone
            pid={oppPid()!}
            cards={props.view.inPlay[oppPid()!]}
            label="Zone adversaire"
          />
        </>
      ) : (
        <>
          <PlayerZone pid="p1" cards={props.view.inPlay.p1} label="Joueur 1" />
          <PlayerZone pid="p2" cards={props.view.inPlay.p2} label="Joueur 2" />
        </>
      )}
    </div>
  );
};

export default PlayZone;
