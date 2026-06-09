import { Component, Show, createSignal } from 'solid-js';
import type { PlayerView } from '../types';
import { getBaseUrl } from '../ws';

interface LobbyProps {
  view: PlayerView | null;
  code: string | null;
  onStart: () => void;
  onCreate: () => void;
  onJoin: (code: string) => void;
  isConnecting: boolean;
}

const Lobby: Component<LobbyProps> = (props) => {
  const [joinCode, setJoinCode] = createSignal('');
  const [copied, setCopied] = createSignal(false);

  const shareUrl = () => {
    if (!props.code) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${props.code}`;
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  const bothSeated = () => {
    const v = props.view;
    return v ? v.players.p1 && v.players.p2 : false;
  };

  const seatStatus = () => {
    const v = props.view;
    if (!v) return '';
    const p1 = v.players.p1 ? 'Joueur 1: connecte' : 'Joueur 1: en attente';
    const p2 = v.players.p2 ? 'Joueur 2: connecte' : 'Joueur 2: en attente';
    return `${p1} | ${p2}`;
  };

  function handleJoin(e: Event) {
    e.preventDefault();
    const code = joinCode().trim().toUpperCase();
    if (code.length === 4) {
      props.onJoin(code);
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-spy-surface rounded-2xl border border-spy-border p-8 w-full max-w-md shadow-2xl">
        <h1 class="text-3xl font-bold text-spy-text mb-2 tracking-tight">Agent Avenue</h1>
        <p class="text-spy-muted text-sm mb-6">
          Jeu de plateau 2 joueurs. Recrutez des agents, avancez sur la piste, rattrapez votre adversaire.
        </p>

        {/* No room yet */}
        <Show when={props.code === null}>
          <div class="flex flex-col gap-4">
            <button
              class="btn-primary w-full text-base py-3"
              onClick={props.onCreate}
              disabled={props.isConnecting}
              type="button"
            >
              {props.isConnecting ? 'Creation...' : 'Creer une partie'}
            </button>

            <div class="flex items-center gap-2 text-spy-muted text-xs">
              <div class="flex-1 h-px bg-spy-border" />
              ou rejoindre
              <div class="flex-1 h-px bg-spy-border" />
            </div>

            <form onSubmit={handleJoin} class="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="Code (4 lettres)"
                value={joinCode()}
                onInput={(e) => setJoinCode(e.currentTarget.value)}
                class="flex-1 bg-spy-card border border-spy-border rounded-lg px-3 py-2 text-spy-text placeholder-spy-muted uppercase tracking-widest text-center text-lg outline-none focus:border-spy-accent transition-colors"
              />
              <button
                class="btn-secondary"
                type="submit"
                disabled={joinCode().trim().length !== 4 || props.isConnecting}
              >
                Rejoindre
              </button>
            </form>
          </div>
        </Show>

        {/* Room created / joined */}
        <Show when={props.code !== null && props.view !== null}>
          <div class="flex flex-col gap-4">
            {/* Code display */}
            <div class="bg-spy-card rounded-xl border border-spy-border p-4 text-center">
              <div class="text-spy-muted text-xs uppercase tracking-wider mb-1">Code de la partie</div>
              <div class="text-4xl font-mono font-bold text-spy-accent tracking-widest mb-3">
                {props.code}
              </div>
              <div class="flex flex-col gap-2">
                <div class="text-xs text-spy-muted break-all">{shareUrl()}</div>
                <button
                  class="btn-secondary text-sm self-center"
                  onClick={handleCopy}
                  type="button"
                >
                  {copied() ? 'Copie !' : 'Copier le lien'}
                </button>
              </div>
            </div>

            {/* Seat status */}
            <div class="bg-spy-card rounded-lg border border-spy-border p-3 text-center">
              <div class="text-xs text-spy-muted">{seatStatus()}</div>
              <Show when={!bothSeated()}>
                <div class="text-spy-warn text-sm mt-1">En attente du 2e joueur...</div>
              </Show>
              <Show when={bothSeated()}>
                <div class="text-spy-success text-sm mt-1">Les deux joueurs sont connectes !</div>
              </Show>
            </div>

            {/* Your seat */}
            <Show when={props.view?.you !== null}>
              <div class="text-center text-sm text-spy-muted">
                Vous etes{' '}
                <span class="text-spy-accent font-bold">
                  {props.view?.you === 'p1' ? 'Joueur 1' : 'Joueur 2'}
                </span>
              </div>
            </Show>

            <Show when={bothSeated()}>
              <button
                class="btn-success w-full text-base py-3"
                onClick={props.onStart}
                type="button"
              >
                Commencer la partie
              </button>
            </Show>
          </div>
        </Show>

        {/* Connecting */}
        <Show when={props.code !== null && props.view === null}>
          <div class="text-center text-spy-muted text-sm py-4">
            Connexion en cours...
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Lobby;
