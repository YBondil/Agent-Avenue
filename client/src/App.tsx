import { Component, For, Show, createSignal, onCleanup } from 'solid-js';
import type { AgentType, BlackMarketType, PlayerView } from './types';
import { createWebSocket, sendMessage, getBaseUrl } from './ws';
import type { ClientMessage } from './ws';

import Lobby from './components/Lobby';
import Tutorial from './components/Tutorial';
import Board from './components/Board';
import PlayerHand from './components/PlayerHand';
import OpponentHand from './components/OpponentHand';
import PlayZone from './components/PlayZone';
import ActionPanel from './components/ActionPanel';
import DilemmaArena from './components/DilemmaArena';
import RecruitReveal from './components/RecruitReveal';
import Market from './components/Market';
import MarcheNoirOverlay from './components/MarcheNoirOverlay';
import BMCard from './components/BMCard';
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
  const [tutorial, setTutorial] = createSignal<'base' | 'advanced' | null>(null);

  // Hand selection state
  const [selectedFaceUp, setSelectedFaceUp] = createSignal<AgentType | null>(null);
  const [selectedFaceDown, setSelectedFaceDown] = createSignal<AgentType | null>(null);

  // Transient "who recruited what" reveal after a recruit resolves.
  const [reveal, setReveal] = createSignal<{ oppCard: AgentType; myCard: AgentType } | null>(null);

  // WebSocket ref
  let ws: WebSocket | null = null;
  let prevView: PlayerView | null = null;

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
          const prev = prevView;
          const v = msg.view;
          // A recruit just resolved: reveal which card went where.
          if (prev && prev.phase === 'recruit' && v.phase !== 'recruit' && prev.proposed) {
            const me = v.you ?? 'p1';
            const opp = me === 'p1' ? 'p2' : 'p1';
            const oppCard = v.inPlay[opp].at(-1);
            const myCard = v.inPlay[me].at(-1);
            if (oppCard && myCard) {
              setReveal({ oppCard, myCard });
              setTimeout(() => setReveal(null), 1750);
            }
          }
          setView(v);
          if (v.phase === 'play') resetSelection();
          prevView = v;
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

  async function handleCreate(mode: 'base' | 'advanced') {
    setIsConnecting(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
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
  const meId = (): 'p1' | 'p2' => currentView()?.you ?? 'p1';
  const oppId = (): 'p1' | 'p2' => (meId() === 'p1' ? 'p2' : 'p1');

  // A player's Marché Noir permanent cards (advanced mode only).
  const bmRow = (cards: BlackMarketType[]) => (
    <Show when={currentView()?.mode === 'advanced' && cards.length > 0}>
      <div class="flex items-center justify-center gap-1 py-0.5">
        <For each={cards}>
          {(c) => (
            <div class="w-[5vh] max-w-[34px]">
              <BMCard card={c} />
            </div>
          )}
        </For>
      </div>
    </Show>
  );

  return (
    <>
      <Toast message={toast()} />

      {/* Tutorial overlay (from the lobby) */}
      <Show when={tutorial() !== null}>
        <Tutorial mode={tutorial()!} onClose={() => setTutorial(null)} />
      </Show>

      {/* Lobby: show when no room or phase is lobby */}
      <Show when={(phase() === 'lobby' || roomCode() === null) && tutorial() === null}>
        <Lobby
          view={currentView()}
          code={roomCode()}
          onStart={() => handleSend({ type: 'start' })}
          onCreate={handleCreate}
          onJoin={handleJoin}
          onTutorial={(m) => setTutorial(m)}
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
          {/* TOP ZONE: opponent's card backs + their recruited cards + Marché Noir */}
          <header class="pt-2 flex flex-col">
            <OpponentHand count={currentView()!.oppHandCount} />
            <PlayZone cards={currentView()!.inPlay[oppId()]} label="Adversaire" mine={false} />
            {bmRow(currentView()!.blackMarket[oppId()])}
            <Market view={currentView()!} />
          </header>

          {/* CENTER ZONE: the plateau, kept clear of the recruited cards. */}
          <main class="relative">
            <Board view={currentView()!} />

            <Show when={phase() === 'recruit' && currentView()!.proposed !== null}>
              <DilemmaArena
                view={currentView()!}
                onRecruit={(choice) => handleSend({ type: 'recruit', choice })}
              />
            </Show>

            <Show when={phase() === 'market' || phase() === 'capacity'}>
              <MarcheNoirOverlay
                view={currentView()!}
                onPick={(slot) => handleSend({ type: 'market', slot })}
                onCapacity={(agent, recruit) => handleSend({ type: 'capacity', agent, recruit })}
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

          {/* BOTTOM ZONE: your recruited cards + action tokens + fanned hand */}
          <footer class="pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col gap-1">
            {bmRow(currentView()!.blackMarket[meId()])}
            <PlayZone cards={currentView()!.inPlay[meId()]} label="Vous" mine={true} />
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

          {/* Recruit reveal: chosen card to the opponent, the other to you */}
          <Show when={reveal()}>
            <RecruitReveal oppCard={reveal()!.oppCard} myCard={reveal()!.myCard} />
          </Show>
        </div>
      </Show>
    </>
  );
};

export default App;
