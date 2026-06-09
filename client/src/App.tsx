import { Component, Show, createSignal, onCleanup } from 'solid-js';
import type { AgentType, PlayerView } from './types';
import { createWebSocket, sendMessage, getBaseUrl } from './ws';
import type { ClientMessage } from './ws';

import Lobby from './components/Lobby';
import Board from './components/Board';
import Hand from './components/Hand';
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
  const [discardCandidate, setDiscardCandidate] = createSignal<AgentType | null>(null);
  const [discardMode, setDiscardMode] = createSignal(false);

  // WebSocket ref
  let ws: WebSocket | null = null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function resetSelection() {
    setSelectedFaceUp(null);
    setSelectedFaceDown(null);
    setDiscardCandidate(null);
    setDiscardMode(false);
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

  function handleToggleDiscardMode() {
    setDiscardMode((v) => !v);
    setDiscardCandidate(null);
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

  function handleSelectDiscard(card: AgentType) {
    setDiscardCandidate((prev) => (prev === card ? null : card));
  }

  const currentView = () => view();
  const phase = () => currentView()?.phase ?? 'lobby';

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

      {/* Game table */}
      <Show when={phase() !== 'lobby' && roomCode() !== null && currentView() !== null}>
        <div class="min-h-screen p-3 sm:p-4 max-w-2xl mx-auto flex flex-col gap-4">
          {/* Header */}
          <div class="flex items-center justify-between">
            <div class="text-lg font-bold text-spy-text tracking-tight">Agent Avenue</div>
            <div class="text-xs text-spy-muted font-mono">{roomCode()}</div>
          </div>

          {/* Win banner */}
          <Show when={phase() === 'ended' && currentView()?.winner !== null}>
            <WinBanner
              winner={currentView()!.winner!}
              you={currentView()!.you}
              winReason={currentView()!.winReason}
              onReset={() => handleSend({ type: 'reset' })}
            />
          </Show>

          {/* Board */}
          <Board view={currentView()!} />

          {/* Status */}
          <Status view={currentView()!} />

          {/* Play zone */}
          <PlayZone view={currentView()!} />

          {/* Hand */}
          <Show when={currentView()!.yourHand.length > 0 || currentView()!.oppHandCount > 0}>
            <Hand
              hand={currentView()!.yourHand}
              oppHandCount={currentView()!.oppHandCount}
              selectedFaceUp={selectedFaceUp()}
              selectedFaceDown={selectedFaceDown()}
              onSelectFaceUp={handleSelectFaceUp}
              onSelectFaceDown={handleSelectFaceDown}
              selectionMode={
                phase() === 'play' && currentView()!.you === currentView()!.activePlayer
                  ? 'picking'
                  : 'none'
              }
              discardCandidate={discardCandidate()}
              onSelectDiscard={handleSelectDiscard}
              discardMode={discardMode()}
            />
          </Show>

          {/* Action panel */}
          <ActionPanel
            view={currentView()!}
            selectedFaceUp={selectedFaceUp()}
            selectedFaceDown={selectedFaceDown()}
            discardCandidate={discardCandidate()}
            discardMode={discardMode()}
            onSend={handleSend}
            onToggleDiscardMode={handleToggleDiscardMode}
            onResetSelection={resetSelection}
          />
        </div>
      </Show>
    </>
  );
};

export default App;
