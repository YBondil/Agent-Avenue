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
import DilemmaArena from './components/DilemmaArena';
import Deck from './components/Deck';
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

      {/* Casino table: Opponent (top) / Plateau (center) / Player (bottom).
          Grid rows keep all three visible on one screen without scrolling. */}
      <Show when={phase() !== 'lobby' && roomCode() !== null && currentView() !== null}>
        <div
          class="grid mx-auto max-w-3xl overflow-hidden"
          style={{ height: '100dvh', 'grid-template-rows': 'auto minmax(0,1fr) auto' }}
        >
          {/* TOP ZONE: opponent's card backs */}
          <header class="pt-2 pb-1">
            <OpponentHand count={currentView()!.oppHandCount} />
          </header>

          {/* CENTER ZONE: the plateau. Board, play zones, dilemma, result. */}
          <main class="relative">
            <Board view={currentView()!} />
            {/* During recruit the dilemma's "Voir les jeux" toggle shows the
                zones inline, so hide the ambient PlayZone to avoid duplicates. */}
            <Show when={phase() !== 'recruit'}>
              <PlayZone view={currentView()!} />
            </Show>

            <Show when={phase() === 'recruit' && currentView()!.proposed !== null}>
              <DilemmaArena
                view={currentView()!}
                onRecruit={(choice) => handleSend({ type: 'recruit', choice })}
              />
            </Show>

            <Show when={phase() === 'ended' && currentView()?.winner !== null}>
              <WinBanner
                winner={currentView()!.winner!}
                you={currentView()!.you}
                winReason={currentView()!.winReason}
                onReset={() => handleSend({ type: 'reset' })}
              />
            </Show>
          </main>

          {/* BOTTOM ZONE: action tokens + the player's fanned hand */}
          <footer class="pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-1">
            <ActionPanel
              view={currentView()!}
              selectedFaceUp={selectedFaceUp()}
              selectedFaceDown={selectedFaceDown()}
              onSend={handleSend}
              onResetSelection={resetSelection}
            />
            <PlayerHand
              hand={currentView()!.yourHand}
              selectedFaceUp={selectedFaceUp()}
              selectedFaceDown={selectedFaceDown()}
              onSelectFaceUp={handleSelectFaceUp}
              onSelectFaceDown={handleSelectFaceDown}
              selectionMode={phase() === 'play' && myTurn() ? 'picking' : 'none'}
            />
          </footer>

          {/* Deck pile + 3D draw animation overlay (local and opponent draws) */}
          <Deck view={currentView()!} />
        </div>
      </Show>
    </>
  );
};

export default App;
