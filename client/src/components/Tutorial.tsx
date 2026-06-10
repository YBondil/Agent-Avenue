import { Component, For, Show, createSignal } from 'solid-js';
import type { Mode } from '../types';

interface TutorialProps {
  mode: Mode;
  onClose: () => void;
}

type Step = { title: string; body: string[] };

const BASE_STEPS: Step[] = [
  {
    title: 'But du jeu',
    body: [
      'Chaque joueur a un pion Espion sur une piste circulaire de 14 cases.',
      'Les pions partent sur des cases opposees (votre Maison).',
      'Objectif : rattraper le pion adverse, c-a-d atteindre ou depasser sa case.',
    ],
  },
  {
    title: 'Votre main',
    body: [
      'Vous avez 4 cartes Agent en main, piochees dans la pioche commune.',
      'Chaque agent indique 3 deplacements selon le nombre d exemplaires que vous avez en jeu : 1x, 2x, 3 ou plus.',
      'Vert = avancer (sens horaire). Rouge = reculer.',
    ],
  },
  {
    title: 'Etape 1 : Jouer',
    body: [
      'A votre tour, jouez 2 cartes differentes de votre main : 1 face visible, 1 face cachee.',
      'Puis repiochez pour revenir a 4 cartes.',
    ],
  },
  {
    title: 'Etape 2 : Recruter',
    body: [
      'Votre adversaire choisit 1 des 2 cartes (sans voir la face cachee avant de choisir) et la place dans son jeu.',
      'Vous recuperez l autre carte.',
      'Chacun deplace alors son pion selon l effet de la carte recrutee. Les deux pions bougent en meme temps.',
    ],
  },
  {
    title: 'Etape 3 : Terminer le tour',
    body: [
      'On verifie les conditions : un pion en rattrape un autre (victoire), 3 Cryptologues en jeu (victoire), 3 Risque-tout en jeu (defaite).',
      'En cas d egalite, le joueur actif l emporte.',
      'On ne gagne JAMAIS pendant le recrutement, seulement a la fin du tour.',
    ],
  },
  {
    title: 'Astuce',
    body: [
      'Comme les pions bougent simultanement, l adversaire peut s echapper le meme tour : vous ne l avez alors pas rattrape.',
      'Si l adversaire recule sur votre case ou la depasse, il est rattrape.',
    ],
  },
];

const ADVANCED_STEPS: Step[] = [
  {
    title: 'Mode Avance',
    body: [
      'Toutes les regles du Mode de Base s appliquent.',
      'En plus : un paquet de 15 cartes Marche Noir aux capacites speciales.',
      '3 cartes Marche Noir sont revelees a cote du plateau (le Marche).',
    ],
  },
  {
    title: 'Cases Marche Noir',
    body: [
      'Le plateau possede 4 cases Marche Noir (les coins).',
      'Si votre pion s arrete EXACTEMENT sur une de ces cases (meme en reculant), vous gagnez 1 carte du Marche.',
      'Si vous ne faites que traverser la case sans vous y arreter, vous ne gagnez rien.',
    ],
  },
  {
    title: 'Choisir une carte',
    body: [
      'Vous choisissez 1 des 3 cartes du Marche, puis on la remplace aussitot par la premiere carte de la pioche.',
      'Si les deux pions s arretent sur une case Marche Noir le meme tour, le joueur actif choisit en premier.',
    ],
  },
  {
    title: 'Deux types de cartes',
    body: [
      'Immediat (eclair) : l effet se resout tout de suite, puis la carte est defaussee.',
      'Permanent (infini) : la carte reste devant vous ; son effet est actif tout le reste de la partie.',
      'Les cartes permanentes ne s appliquent pas a l agent que vous venez de recruter.',
    ],
  },
  {
    title: 'Exemples de capacites',
    body: [
      'Superordinateur : recruter un Cryptologue fait avancer de 3.',
      'Dispositif de diversion : recruter un Saboteur fait avancer au lieu de reculer.',
      'Manipulation de l esprit : prenez en main 1 agent que l adversaire a en jeu (peut retirer son 3e Cryptologue).',
    ],
  },
  {
    title: 'Nouvelles victoires',
    body: [
      'Cheffe de meute : 3 Risque-tout = victoire (au lieu de defaite).',
      'Plan des operations : 7 agents differents en jeu = victoire.',
      'Systeme de securite : l adversaire sur votre Maison en fin de tour = victoire.',
    ],
  },
];

const Tutorial: Component<TutorialProps> = (props) => {
  const steps = () => (props.mode === 'advanced' ? ADVANCED_STEPS : BASE_STEPS);
  const [i, setI] = createSignal(0);
  const step = () => steps()[i()];
  const last = () => i() === steps().length - 1;

  return (
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-spy-surface rounded-2xl border border-spy-border p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-widest text-spy-accent">
            Tutoriel {props.mode === 'advanced' ? 'avance' : 'classique'}
          </span>
          <button class="text-spy-muted text-sm" type="button" onClick={props.onClose}>
            Fermer
          </button>
        </div>

        <div class="flex gap-1">
          <For each={steps()}>
            {(_, idx) => (
              <div
                class={`h-1 flex-1 rounded-full ${idx() <= i() ? 'bg-spy-accent' : 'bg-spy-border'}`}
              />
            )}
          </For>
        </div>

        <h2 class="text-2xl font-extrabold text-spy-text">{step().title}</h2>
        <ul class="flex flex-col gap-2">
          <For each={step().body}>
            {(line) => (
              <li class="text-sm text-spy-muted leading-relaxed flex gap-2">
                <span class="text-spy-accent">-</span>
                <span>{line}</span>
              </li>
            )}
          </For>
        </ul>

        <div class="flex items-center justify-between mt-2">
          <button
            class="btn-secondary text-sm"
            type="button"
            disabled={i() === 0}
            onClick={() => setI((v) => Math.max(0, v - 1))}
          >
            Precedent
          </button>
          <span class="text-xs text-spy-muted">
            {i() + 1} / {steps().length}
          </span>
          <Show
            when={!last()}
            fallback={
              <button class="btn-primary text-sm" type="button" onClick={props.onClose}>
                Terminer
              </button>
            }
          >
            <button class="btn-primary text-sm" type="button" onClick={() => setI((v) => v + 1)}>
              Suivant
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
