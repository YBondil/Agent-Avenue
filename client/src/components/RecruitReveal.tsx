import { Component, onMount } from 'solid-js';
import type { AgentType } from '../types';
import Card from './Card';

interface RecruitRevealProps {
  oppCard: AgentType; // the card the opponent recruited (flies up to their zone)
  myCard: AgentType;  // the card you received (flies down to your zone)
}

// Brief flourish after a recruit resolves so both players can see which card the
// opponent chose: it rises to the opponent's side, the other drops to yours.
const RecruitReveal: Component<RecruitRevealProps> = (props) => {
  let up: HTMLDivElement | undefined;
  let down: HTMLDivElement | undefined;

  onMount(() => {
    if (!up || !down) return;
    up.style.transform = 'translateY(0) scale(1)';
    down.style.transform = 'translateY(0) scale(1)';
    // Hold a beat at centre, then deal the cards to their owners.
    setTimeout(() => {
      if (!up || !down) return;
      up.style.transform = 'translateY(-42dvh) scale(0.55)';
      up.style.opacity = '0';
      down.style.transform = 'translateY(42dvh) scale(0.55)';
      down.style.opacity = '0';
    }, 450);
  });

  return (
    <div class="fixed inset-0 z-[58] pointer-events-none flex items-center justify-center">
      <div class="flex items-end gap-5">
        <div ref={up} class="reveal-card flex flex-col items-center gap-1">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-spy-accent2 neon-text">
            Adversaire
          </span>
          <div class="w-[clamp(92px,21dvh,140px)]">
            <Card type={props.oppCard} selected />
          </div>
        </div>
        <div ref={down} class="reveal-card flex flex-col items-center gap-1">
          <div class="w-[clamp(92px,21dvh,140px)]">
            <Card type={props.myCard} selected />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-spy-accent">
            Vous
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecruitReveal;
