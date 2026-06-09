# Agent Avenue (web, 2 joueurs)

Adaptation web en ligne du jeu de plateau **Agent Avenue** (Iello, 2025), Mode de Base, pour 2 joueurs chacun sur son appareil. Les joueurs se connectent via un code de room a 4 lettres partage par URL.

- **Frontend**: SolidJS + Vite + TypeScript + Tailwind CSS (`client/`)
- **Backend**: Hono sur Bun, etat en memoire, synchronisation temps reel par WebSocket (`server/`)

## Regles implementees (Mode de Base)

But: rattraper le pion adverse sur une piste circulaire de 14 cases. Les pions demarrent aux cases opposees 0 et 7. Sens horaire = avance (positif), antihoraire = recul (negatif).

Deck de 38 cartes. Effet selon le nombre d'exemplaires de la carte dans votre zone (1x / 2x / 3+x):

| Agent | 1x | 2x | 3+x | Quantite |
|---|---|---|---|---|
| Agent Double | -1 | +6 | -1 | 6 |
| Saboteur | -1 | 0 | +2 | 6 |
| Mercenaire | +2 | +1 | +3 | 6 |
| Risque-tout | +3 | +2 | DEFAITE | 6 |
| Cryptologue | 0 | 0 | VICTOIRE | 6 |
| Sentinelle | 0 | +2 | +6 | 6 |
| Acolyte | +4 | - | - | 1 |
| Taupe | -3 | - | - | 1 |

Tour: le joueur actif joue 2 cartes (1 face visible, 1 face cachee, differentes sauf main identique). L'adversaire recrute une des 2 cartes, le joueur actif prend l'autre. Les deux pions bougent simultanement. Conditions de fin verifiees dans l'ordre: rattrapage > 3 Cryptologues (victoire) > 3 Risque-tout (defaite); egalite tranchee en faveur du joueur actif. Pioche vide: le pion le plus proche de rattraper gagne, egalite au joueur actif.

La logique pure et ces regles sont couvertes par `server/src/game.test.ts` (18 cas).

## Developpement local

Prerequis: [Bun](https://bun.sh) (backend + tests) et Node.js (frontend Vite).

### 1. Backend

```bash
cd server
bun install
bun run dev      # http://localhost:3001 (rechargement a chaud)
bun test         # logique de jeu
```

### 2. Frontend

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

Le frontend lit l'URL du backend depuis `VITE_SERVER_URL` (defaut `http://localhost:3001`). Voir `client/.env.example`.

### Jouer

1. Ouvrez `http://localhost:5173`, cliquez **Creer une partie**.
2. Partagez l'URL `...?room=XXXX` (ou le code) au second joueur, sur un autre appareil ou onglet.
3. Quand les deux joueurs sont connectes, cliquez **Commencer la partie**.

## Deploiement

### Backend (Node.js / Bun)

Le serveur Hono utilise l'API WebSocket de Bun (`hono/bun`). Lancez-le avec Bun:

```bash
cd server
bun install --production
PORT=3001 bun run src/index.ts
```

Deployable sur toute plateforme supportant Bun (Railway, Render, Fly.io, VM, conteneur). Le port est configurable par la variable `PORT`. L'etat est en memoire: une seule instance (pas de scaling horizontal sans store partage). Les rooms inactives de plus de 6h sont nettoyees automatiquement.

### Frontend (Vercel / Netlify)

```bash
cd client
npm install
npm run build    # genere client/dist/
```

Deployez le dossier `client/dist/` comme site statique. Configurez la variable d'environnement de build `VITE_SERVER_URL` vers l'URL publique du backend (par exemple `https://agent-avenue-api.example.com`). En HTTPS, le client passe automatiquement le WebSocket en `wss://`.

## Architecture

```
client/                 Frontend SolidJS
  src/
    App.tsx              Routing ?room=CODE, connexion WS, store de vue
    ws.ts                Client WebSocket + clientId persistant (localStorage)
    types.ts             Miroir des types serveur (PlayerView, messages)
    components/          Board, Hand, PlayZone, ActionPanel, Status, Lobby, ...
server/                  Backend Hono (Bun)
  src/
    types.ts             RoomState (autoritatif) et PlayerView (projection)
    game.ts              Logique pure: deck, effets, deplacement, rattrapage
    engine.ts            Etat de room, actions, resolution des conditions, vues
    index.ts             Hono REST (/api/create, /api/room/:code) + WebSocket /ws
    game.test.ts         Tests de la logique
```

### Flux reseau

1. `POST /api/create` cree une room et renvoie un code a 4 lettres.
2. Chaque client ouvre `GET /ws?code=XXXX&cid=<id>`. Les deux premiers `cid` distincts recoivent les sieges `p1` et `p2`; le `cid` persiste en `localStorage` pour conserver son siege a la reconnexion.
3. Le serveur garde l'etat autoritatif en memoire et diffuse a chaque client une **projection** (`PlayerView`) qui masque la main adverse et la carte face cachee non encore revelee.
4. Les actions (`start`, `play`, `recruit`, `reset`) transitent par le WebSocket; le serveur valide, applique, puis rediffuse l'etat.
