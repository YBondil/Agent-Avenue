import { Component, Show, createSignal, onCleanup } from 'solid-js';
import type { AgentType, PlayerView } from './types';
import { createWebSocket, sendMessage, getBaseUrl } from './ws';
import type { ClientMessage } from './ws';

import Lobby from './components/Lobby';
import Board from './components/Board';
import PlayerHand from './components/PlayerHand';
import OpponentHand from './components/OpponentHand';
import PlayZone from './components/PlayZone';
import ActionPanel from './components/ActionPanel';
import Status from './components/Status';
import Toast from './components/Toast';
import WinBanner from './components/WinBanner';

const App: Component = () => {
  // --- Routing by query param ---
  function getRoomCode(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  }

  // --- State ---
  const [roomCode, setRoomCode] = createSignal<string | null>(getRoomCode());
  const [view, setView] = createSignal<PlayerView | null>(null);
  const [toast, setToast] = createSignal<string | null>(null);
  const [isConnecting, setIsConnecting] = createSignal(false);

  // Hand selection state
  const [selectedFaceUp, setSelectedFaceUp] = createSignal<AgentType | null>(null);
  const [selectedFaceDown, setSelectedFaceDown] = createSignal<AgentType | null>(null);

  // WebSocket ref
  let ws: WebSocket | null = null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function resetSelection() {
    setSelectedFaceUp(null);
    setSelectedFaceDown(null);
  }

  function connectToRoom(code: string) {
    if (ws) {
      ws.close();
      ws = null;
    }

    ws = createWebSocket(
      code,
      (msg) => {
        if (msg.type === 'state') {
          setView(msg.view);
          // Reset selection when phase changes to play
          if (msg.view.phase === 'play') {
            resetSelection();
          }
        } else if (msg.type === 'error') {
          showToast(msg.message);
        }
      },
      () => {
        // WebSocket closed — optionally show a message
      },
    );
  }

  // Auto-connect if room code is in URL
  const initialCode = getRoomCode();
  if (initialCode) {
    connectToRoom(initialCode);
  }

  onCleanup(() => {
    ws?.close();
  });

  async function handleCreate() {
    setIsConnecting(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Echec de la creation de la partie');
      const data = (await res.json()) as { code: string };
      const code = data.code;
      setRoomCode(code);
      setRoomCodeUrl(code);
      connectToRoom(code);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erreur reseau');
    } finally {
      setIsConnecting(false);
    }
  }

  function setRoomCodeUrl(code: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('room', code);
    window.history.pushState({}, '', url.toString());
  }

  function handleJoin(code: string) {
    setRoomCode(code);
    setRoomCodeUrl(code);
    connectToRoom(code);
  }

  function handleSend(msg: ClientMessage) {
    if (ws) {
      sendMessage(ws, msg);
    }
  }

  function handleSelectFaceUp(card: AgentType) {
    if (selectedFaceUp() === card) {
      setSelectedFaceUp(null);
    } else {
      // If this card is already face-down, swap
      if (selectedFaceDown() === card) {
        setSelectedFaceDown(null);
      }
      setSelectedFaceUp(card);
    }
  }

  function handleSelectFaceDown(card: AgentType) {
    if (selectedFaceDown() === card) {
      setSelectedFaceDown(null);
    } else {
      if (selectedFaceUp() === card) {
        setSelectedFaceUp(null);
      }
      setSelectedFaceDown(card);
    }
  }

  const currentView = () => view();
  const phase = () => currentView()?.phase ?? 'lobby';
  const myTurn = () =>
    currentView() !== null && currentView()!.you === currentView()!.activePlayer;

  // Simplified turn label for the top zone.
  const turnText = () => {
    const v = currentView();
    if (!v) return '';
    if (v.phase === 'ended') return 'Partie terminee';
    if (v.phase === 'recruit') return myTurn() ? 'Adversaire recrute...' : 'A vous de recruter';
    return myTurn() ? 'A vous de jouer' : "Tour de l'adversaire";
  };

  return (
    <>
      <Toast message={toast()} />

      {/* Lobby: show when no room or phase is lobby */}
      <Show when={phase() === 'lobby' || roomCode() === null}>
        <Lobby
          view={currentView()}
          code={roomCode()}
          onStart={() => handleSend({ type: 'start' })}
          onCreate={handleCreate}
          onJoin={handleJoin}
          isConnecting={isConnecting()}
        />
      </Show>

      {/* Game table: vertical, touch-first, fixed top and bottom zones */}
      <Show when={phase() !== 'lobby' && roomCode() !== null && currentView() !== null}>
        <div class="h-screen flex flex-col overflow-hidden mx-auto max-w-xl">
          {/* TOP ZONE: turn indicator + compact status + opponent hand */}
          <header class="shrink-0 px-3 pt-3 pb-2 flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div
                class={`flex items-center gap-2 rounded-full px-3 py-1.5 font-extrabold text-sm border-2 ${
                  myTurn() && phase() !== 'ended'
                    ? 'bg-spy-success/15 border-spy-success text-spy-success'
                    : 'bg-spy-card border-spy-border text-spy-muted'
                }`}
              >
                <Show when={myTurn() && phase() !== 'ended'}>
                  <span class="w-2 h-2 rounded-full bg-spy-success animate-pulse-dot" />
                </Show>
                {turnText()}
              </div>
              <Status view={currentView()!} />
            </div>
            <OpponentHand count={currentView()!.oppHandCount} />
          </header>

          {/* CENTER ZONE: board + play zones (scrolls only if needed) */}
          <main class="flex-1 min-h-0 overflow-y-auto px-3 flex flex-col items-center justify-center gap-3 py-1">
            <Show when={phase() === 'ended' && currentView()?.winner !== null}>
              <WinBanner
                winner={currentView()!.winner!}
                you={currentView()!.you}
                winReason={currentView()!.winReason}
                onReset={() => handleSend({ type: 'reset' })}
              />
            </Show>
            <Board view={currentView()!} />
            <PlayZone view={currentView()!} />
          </main>

          {/* BOTTOM ZONE: player hand + action panel, anchored */}
          <footer class="shrink-0 panel rounded-b-none rounded-t-4xl border-b-0 px-3 pt-3 pb-4 flex flex-col gap-3">
            <PlayerHand
              hand={currentView()!.yourHand}
              selectedFaceUp={selectedFaceUp()}
              selectedFaceDown={selectedFaceDown()}
              onSelectFaceUp={handleSelectFaceUp}
              onSelectFaceDown={handleSelectFaceDown}
              selectionMode={phase() === 'play' && myTurn() ? 'picking' : 'none'}
            />
            <ActionPanel
              view={currentView()!}
              selectedFaceUp={selectedFaceUp()}
              selectedFaceDown={selectedFaceDown()}
              onSend={handleSend}
              onResetSelection={resetSelection}
            />
          </footer>
        </div>
      </Show>
    </>
  );
};

export default App;
