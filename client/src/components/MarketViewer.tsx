import { Component, For, Show } from 'solid-js';
import type { PlayerView } from '../types';
import BMCard from './BMCard';

interface MarketViewerProps {
  view: PlayerView;
  onClose: () => void;
}

// On-demand, readable Marché Noir consultation. Opened from a floating button at
// any time (including during the dilemma). Shows the 3 available cards large, the
// pile, and each player's permanent cards.
const MarketViewer: Component<MarketViewerProps> = (props) => {
  const me = (): 'p1' | 'p2' => props.view.you ?? 'p1';
  const opp = (): 'p1' | 'p2' => (me() === 'p1' ? 'p2' : 'p1');

  return (
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={props.onClose}
    >
      <div
        class="bg-spy-surface rounded-2xl border border-spy-border shadow-2xl p-5 w-full max-w-lg flex flex-col gap-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-extrabold uppercase tracking-wider text-spy-accent">Marche Noir</h2>
          <button class="token-ghost text-xs px-3 py-1" type="button" onClick={props.onClose}>
            Fermer
          </button>
        </div>

        {/* The 3 available cards + the pile */}
        <div>
          <div class="text-[11px] font-bold uppercase tracking-wider text-spy-muted mb-2">
            Cartes disponibles
          </div>
          <div class="flex items-start justify-center gap-3 flex-wrap">
            <For each={props.view.market}>
              {(card) => (
                <div class="w-[clamp(86px,16vh,118px)]">
                  <Show
                    when={card}
                    fallback={
                      <div
                        class="w-full rounded-xl border border-dashed border-spy-border flex items-center justify-center text-[10px] text-spy-muted"
                        style={{ 'aspect-ratio': '5/7' }}
                      >
                        vide
                      </div>
                    }
                  >
                    <BMCard card={card!} />
                  </Show>
                </div>
              )}
            </For>
            <div class="relative w-[clamp(70px,13vh,96px)]">
              <BMCard faceDown />
              <div class="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-ink border border-spy-accent text-xs font-extrabold flex items-center justify-center text-spy-text">
                {props.view.marketDeckCount}
              </div>
            </div>
          </div>
        </div>

        {/* Permanent cards owned by each player */}
        <ZoneCards label="Vos cartes permanentes" cards={props.view.blackMarket[me()]} />
        <ZoneCards label="Adversaire" cards={props.view.blackMarket[opp()]} />
      </div>
    </div>
  );
};

const ZoneCards: Component<{ label: string; cards: PlayerView['blackMarket']['p1'] }> = (props) => (
  <div>
    <div class="text-[11px] font-bold uppercase tracking-wider text-spy-muted mb-2">{props.label}</div>
    <Show
      when={props.cards.length > 0}
      fallback={<div class="text-xs text-spy-muted/70 italic">aucune</div>}
    >
      <div class="flex flex-wrap gap-2">
        <For each={props.cards}>
          {(c) => (
            <div class="w-[clamp(70px,13vh,96px)]">
              <BMCard card={c} />
            </div>
          )}
        </For>
      </div>
    </Show>
  </div>
);

export default MarketViewer;
