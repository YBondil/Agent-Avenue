import { Component, For, Show, createSignal } from 'solid-js';
import type { AgentType, PlayerView } from '../types';
import { BLACK_MARKET_LABELS } from '../constants';
import BMCard from './BMCard';
import Card from './Card';

interface OverlayProps {
  view: PlayerView;
  onPick: (slot: number) => void;
  onCapacity: (agent: AgentType, recruit?: boolean) => void;
}

// Modal flow for the Marché Noir acquisition (pick 1 of 3) and for resolving an
// interactive immediate capability (choose an agent).
const MarcheNoirOverlay: Component<OverlayProps> = (props) => {
  const view = () => props.view;
  const isMyPick = () => view().pendingMarket !== null && view().pendingMarket === view().you;
  const cap = () => view().pendingCapacity;
  const isMyCap = () => cap() !== null && cap()!.player === view().you;
  const [recruitNow, setRecruitNow] = createSignal(false);

  return (
    <>
      {/* Marché Noir pick */}
      <Show when={view().phase === 'market'}>
        <div class="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <Show
            when={isMyPick()}
            fallback={
              <div class="text-spy-accent text-sm font-bold uppercase tracking-[0.25em] neon-text">
                L'adversaire choisit au Marche Noir...
              </div>
            }
          >
            <div class="flex flex-col items-center gap-3 max-w-[94%]">
              <span class="text-sm font-extrabold uppercase tracking-wider text-spy-accent">
                Choisissez une carte Marche Noir
              </span>
              <div class="flex gap-3 justify-center flex-wrap">
                <For each={view().market}>
                  {(card, i) => (
                    <Show when={card}>
                      <div class="w-[clamp(96px,22dvh,150px)]">
                        <BMCard card={card!} onClick={() => props.onPick(i())} />
                      </div>
                    </Show>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Interactive immediate capability */}
      <Show when={view().phase === 'capacity' && cap()}>
        <div class="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <Show
            when={isMyCap()}
            fallback={
              <div class="text-spy-accent text-sm font-bold uppercase tracking-[0.25em] neon-text">
                L'adversaire resout {BLACK_MARKET_LABELS[cap()!.card]}...
              </div>
            }
          >
            <div class="flex flex-col items-center gap-3 max-w-[94%]">
              <span class="text-sm font-extrabold uppercase tracking-wider text-spy-accent">
                {BLACK_MARKET_LABELS[cap()!.card]}
              </span>
              <span class="text-xs text-spy-muted text-center">
                Choisissez un agent.
              </span>
              <Show when={cap()!.optional}>
                <label class="flex items-center gap-2 text-xs text-spy-text">
                  <input
                    type="checkbox"
                    checked={recruitNow()}
                    onChange={(e) => setRecruitNow(e.currentTarget.checked)}
                  />
                  Recruter aussitot
                </label>
              </Show>
              <div class="flex gap-3 justify-center flex-wrap">
                <For each={cap()!.agents}>
                  {(agent) => (
                    <div class="w-[clamp(72px,16dvh,108px)]">
                      <Card type={agent} onClick={() => props.onCapacity(agent, recruitNow())} />
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
};

export default MarcheNoirOverlay;
