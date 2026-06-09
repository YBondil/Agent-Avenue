// Hono server: REST for room creation + WebSocket for realtime sync.
// Runtime: Bun (`bun run src/index.ts`).
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import type { ClientMessage, PlayerId, RoomState } from './types';
import { applyAction, createRoom, viewFor } from './engine';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

type Conn = { send: (data: string) => void };
type Room = { state: RoomState; conns: Map<string, Conn> }; // clientId -> conn

const rooms = new Map<string, Room>();
// clientId -> { code, role } so reconnects keep their seat.
const seats = new Map<string, { code: string; role: PlayerId }>();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O ambiguity
function makeCode(): string {
  let code = '';
  do {
    code = Array.from({ length: 4 }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

// Reap rooms older than 6h to keep memory bounded.
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.state.createdAt < cutoff && room.conns.size === 0) rooms.delete(code);
  }
}, 30 * 60 * 1000);

function roleFor(room: Room, clientId: string): PlayerId | null {
  if (room.state.players.p1 === clientId) return 'p1';
  if (room.state.players.p2 === clientId) return 'p2';
  if (room.state.players.p1 === null) {
    room.state.players.p1 = clientId;
    return 'p1';
  }
  if (room.state.players.p2 === null) {
    room.state.players.p2 = clientId;
    return 'p2';
  }
  return null; // spectator (room full)
}

function broadcast(room: Room) {
  for (const [clientId, conn] of room.conns) {
    const role = roleViewId(room, clientId);
    conn.send(JSON.stringify({ type: 'state', view: viewFor(room.state, role) }));
  }
}

function roleViewId(room: Room, clientId: string): PlayerId | null {
  if (room.state.players.p1 === clientId) return 'p1';
  if (room.state.players.p2 === clientId) return 'p2';
  return null;
}

const app = new Hono();
app.use('/*', cors());

app.get('/', (c) => c.json({ ok: true, service: 'agent-avenue', rooms: rooms.size }));

// Create a fresh room and return its code.
app.post('/api/create', (c) => {
  const code = makeCode();
  rooms.set(code, { state: createRoom(code), conns: new Map() });
  return c.json({ code });
});

// Check a room exists and report seat availability.
app.get('/api/room/:code', (c) => {
  const room = rooms.get(c.req.param('code').toUpperCase());
  if (!room) return c.json({ error: 'Room introuvable.' }, 404);
  return c.json({
    code: room.state.code,
    p1: room.state.players.p1 !== null,
    p2: room.state.players.p2 !== null,
    phase: room.state.phase,
  });
});

// WebSocket: /ws?code=ABCD&cid=<clientId>
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    const code = (c.req.query('code') || '').toUpperCase();
    const clientId = c.req.query('cid') || '';
    return {
      onOpen(_evt, ws) {
        const room = rooms.get(code);
        if (!room || !clientId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room introuvable.' }));
          ws.close();
          return;
        }
        const role = roleFor(room, clientId);
        if (role) seats.set(clientId, { code, role });
        room.conns.set(clientId, { send: (d) => ws.send(d) });
        broadcast(room);
      },
      onMessage(evt, ws) {
        const room = rooms.get(code);
        if (!room) return;
        const role = roleViewId(room, clientId);
        if (!role) {
          ws.send(JSON.stringify({ type: 'error', message: 'Vous êtes spectateur.' }));
          return;
        }
        let msg: ClientMessage;
        try {
          msg = JSON.parse(String(evt.data));
        } catch {
          return;
        }
        const err = applyAction(room.state, role, msg);
        if (err) {
          ws.send(JSON.stringify({ type: 'error', message: err }));
          return;
        }
        broadcast(room);
      },
      onClose() {
        const room = rooms.get(code);
        if (room) room.conns.delete(clientId);
      },
    };
  })
);

const port = Number(process.env.PORT) || 3001;
console.log(`Agent Avenue server on :${port}`);

export default { port, fetch: app.fetch, websocket };
