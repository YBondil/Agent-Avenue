import { Component, For, Show, createSignal } from 'solid-js';
import type { PlayerView } from '../types';
import { AGENT_EFFECTS } from '../constants';
import type { AgentType } from '../types';

interface StatusProps {
  view: PlayerView;
}

const Status: Component<StatusProps> = (props) => {
  const [showTable, setShowTable] = createSignal(false);

  const view = () => props.view;
  const you = () => view().you;

  const activeLabel = () => {
    const active = view().activePlayer;
    if (active === you()) return 'Votre tour';
    return "Tour de l'adversaire";
  };

  const discardsLeft = (pid: 'p1' | 'p2') => 4 - view().discardsUsed[pid];

  const agentKeys = Object.keys(AGENT_EFFECTS) as AgentType[];

  return (
    <div class="bg-spy-surface rounded-lg p-4 border border-spy-border flex flex-col gap-3">
      {/* Turn indicator */}
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="text-sm font-semibold">
          <span class={view().activePlayer === you() ? 'text-spy-success' : 'text-spy-muted'}>
            {activeLabel()}
          </span>
        </div>
        <div class="text-xs text-spy-muted">
          Pioche: <span class="text-spy-text font-bold">{view().deckCount}</span> carte{view().deckCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Discards remaining */}
      <div class="flex gap-4 text-xs">
        <div>
          <span class="text-spy-muted">Defausses P1: </span>
          <span class="text-spy-text font-bold">{discardsLeft('p1')}</span>
          <span class="text-spy-muted"> restante{discardsLeft('p1') > 1 ? 's' : ''}</span>
        </div>
        <div>
          <span class="text-spy-muted">Defausses P2: </span>
          <span class="text-spy-text font-bold">{discardsLeft('p2')}</span>
          <span class="text-spy-muted"> restante{discardsLeft('p2') > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Win conditions summary */}
      <div class="text-xs text-spy-muted border-t border-spy-border pt-2">
        <div class="font-semibold text-spy-text mb-1">Conditions de victoire</div>
        <ul class="space-y-0.5">
          <li>Rattraper le pion adverse sur la piste</li>
          <li class="text-spy-success">3 Cryptologues recrutes = victoire immediate</li>
          <li class="text-spy-danger">3 Risque-tout recrutes = defaite immediate</li>
          <li>Pioche epuisee = victoire au pion le plus avance</li>
        </ul>
      </div>

      {/* Toggle effect table */}
      <button
        class="btn-secondary text-xs self-start"
        onClick={() => setShowTable((v) => !v)}
        type="button"
      >
        {showTable() ? 'Masquer le tableau des effets' : 'Voir le tableau des effets'}
      </button>

      <Show when={showTable()}>
        <div class="overflow-x-auto">
          <table class="text-xs w-full border-collapse">
            <thead>
              <tr class="text-spy-muted">
                <th class="text-left pr-2 py-1 border-b border-spy-border">Agent</th>
                <th class="px-2 py-1 border-b border-spy-border">1x</th>
                <th class="px-2 py-1 border-b border-spy-border">2x</th>
                <th class="px-2 py-1 border-b border-spy-border">3x+</th>
                <th class="px-2 py-1 border-b border-spy-border">Total</th>
              </tr>
            </thead>
            <tbody>
              <For each={agentKeys}>
                {(key) => {
                  const e = AGENT_EFFECTS[key];
                  return (
                    <tr class="hover:bg-spy-card">
                      <td class="pr-2 py-1 text-spy-text whitespace-nowrap">{e.label}</td>
                      <td class="px-2 py-1 text-center text-spy-text">{e.one}</td>
                      <td class="px-2 py-1 text-center text-spy-text">{e.two}</td>
                      <td
                        class={`px-2 py-1 text-center font-semibold ${
                          e.three === 'VICTOIRE' ? 'text-spy-success' : e.three === 'DEFAITE' ? 'text-spy-danger' : 'text-spy-text'
                        }`}
                      >
                        {e.three}
                      </td>
                      <td class="px-2 py-1 text-center text-spy-muted">{e.total}</td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};

export default Status;
