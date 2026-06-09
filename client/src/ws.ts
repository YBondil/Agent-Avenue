import type { PlayerView } from './types';

export type ServerMessage =
  | { type: 'state'; view: PlayerView }
  | { type: 'error'; message: string };

export type ClientMessage =
  | { type: 'start' }
  | { type: 'discard'; card: import('./types').AgentType }
  | { type: 'play'; faceUp: import('./types').AgentType; faceDown: import('./types').AgentType }
  | { type: 'recruit'; choice: 'faceUp' | 'faceDown' }
  | { type: 'reset' };

function getOrCreateClientId(): string {
  const key = 'aa-cid';
  let cid = localStorage.getItem(key);
  if (!cid) {
    cid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, cid);
  }
  return cid;
}

function getWsBase(): string {
  const serverUrl = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
  return serverUrl.replace(/^http/, 'ws');
}

export function getBaseUrl(): string {
  return import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
}

export function getClientId(): string {
  return getOrCreateClientId();
}

export function createWebSocket(
  code: string,
  onMessage: (msg: ServerMessage) => void,
  onClose?: () => void,
): WebSocket {
  const cid = getOrCreateClientId();
  const wsBase = getWsBase();
  const url = `${wsBase}/ws?code=${encodeURIComponent(code)}&cid=${encodeURIComponent(cid)}`;
  const ws = new WebSocket(url);

  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data as string) as ServerMessage;
      onMessage(msg);
    } catch {
      // ignore malformed messages
    }
  });

  ws.addEventListener('close', () => {
    onClose?.();
  });

  return ws;
}

export function sendMessage(ws: WebSocket, msg: ClientMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
