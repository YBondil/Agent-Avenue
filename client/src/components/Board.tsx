import { Component, For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { PlayerId, PlayerView } from '../types';
import { BOARD_CELLS, MARCHE_NOIR_CELLS } from '../constants';

interface BoardProps {
  view: PlayerView;
}

// Stadium (oblong) geometry in SVG user units. Cell 0 sits at the left apex
// (player 1's house) and cell 7 at the right apex (player 2's house), exactly
// opposite as on the physical board.
const VBW = 340;
const VBH = 210;
const R = 79;
const CXL = 105; // left semicircle centre
const CXR = 235; // right semicircle centre
const CY = 105;
const LX = CXR - CXL; // straight run length
const S1 = (Math.PI * R) / 2; // upper-left quarter
const S2 = LX; // top straight
const S3 = Math.PI * R; // right semicircle
const PERIM = 2 * LX + 2 * Math.PI * R;
const STEP_MS = 280; // pause between single-cell hops

// Point at perimeter index (0..13), walking clockwise from the left apex.
function cellPoint(index: number): { x: number; y: number } {
  const d = (index / BOARD_CELLS) * PERIM;
  if (d <= S1) {
    const a = Math.PI + (d / S1) * (Math.PI / 2); // left apex -> top-left
    return { x: CXL + R * Math.cos(a), y: CY + R * Math.sin(a) };
  }
  if (d <= S1 + S2) {
    return { x: CXL + (d - S1), y: CY - R }; // top straight
  }
  if (d <= S1 + S2 + S3) {
    const a = 1.5 * Math.PI + ((d - S1 - S2) / S3) * Math.PI; // right semicircle
    return { x: CXR + R * Math.cos(a), y: CY + R * Math.sin(a) };
  }
  if (d <= S1 + S2 + S3 + LX) {
    return { x: CXR - (d - S1 - S2 - S3), y: CY + R }; // bottom straight
  }
  const a = 0.5 * Math.PI + ((d - S1 - S2 - S3 - LX) / S1) * (Math.PI / 2); // lower-left quarter
  return { x: CXL + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

const Board: Component<BoardProps> = (props) => {
  const cells = createMemo(() =>
    Array.from({ length: BOARD_CELLS }, (_, i) => ({ i, ...cellPoint(i) }))
  );

  const you = () => props.view.you;
  const colorFor = (pid: PlayerId) => (you() === pid ? '#e8c170' : '#4aa3df');

  // Animated cell index per pawn. Plain refs drive the stepping logic (so the
  // effect only tracks the server target), signals drive the render.
  const cur: Record<PlayerId, number> = {
    p1: props.view.positions.p1,
    p2: props.view.positions.p2,
  };
  const [renderP1, setRenderP1] = createSignal(cur.p1);
  const [renderP2, setRenderP2] = createSignal(cur.p2);
  const setters: Record<PlayerId, (n: number) => void> = { p1: setRenderP1, p2: setRenderP2 };
  const timers: Record<PlayerId, ReturnType<typeof setTimeout> | undefined> = {
    p1: undefined,
    p2: undefined,
  };
  let initialised = false;

  // Walk a pawn from its current cell to `target` one cell at a time, in the
  // real movement direction (deltas are bounded to [-3, +6], so the signed step
  // is recoverable from the two positions).
  function stepTo(pid: PlayerId, target: number) {
    clearTimeout(timers[pid]);
    if (cur[pid] === target) return;
    const fwd = (target - cur[pid] + 14) % 14; // 0..13
    const dir = fwd >= 11 ? -1 : 1; // 11,12,13 == -3,-2,-1
    const hop = () => {
      cur[pid] = (cur[pid] + dir + 14) % 14;
      setters[pid](cur[pid]);
      if (cur[pid] !== target) timers[pid] = setTimeout(hop, STEP_MS);
    };
    timers[pid] = setTimeout(hop, STEP_MS);
  }

  createEffect(() => {
    const t1 = props.view.positions.p1;
    const t2 = props.view.positions.p2;
    if (!initialised) {
      cur.p1 = t1;
      cur.p2 = t2;
      setRenderP1(t1);
      setRenderP2(t2);
      initialised = true;
      return;
    }
    stepTo('p1', t1);
    stepTo('p2', t2);
  });

  onCleanup(() => {
    clearTimeout(timers.p1);
    clearTimeout(timers.p2);
  });

  const pawnIndex: Record<PlayerId, () => number> = { p1: renderP1, p2: renderP2 };

  // A small house marker; the door faces inward (toward the track centre). P2's
  // is mirrored so both houses face each other.
  const House = (pid: PlayerId, flip: boolean) => {
    const c = colorFor(pid);
    return (
      <g transform={`scale(${flip ? -1 : 1}, 1)`}>
        <path d="M -13 -9 L 0 -18 L 13 -9 Z" fill={c} opacity="0.7" />
        <rect x={-12} y={-9} width={24} height={19} rx={2} fill={c} opacity="0.22" stroke={c} stroke-width="1.5" />
        <rect x={3} y={-1} width={7} height={11} rx={1.5} fill={c} opacity="0.85" />
      </g>
    );
  };

  return (
    <div class="absolute inset-0 flex items-center justify-center px-2">
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        class="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Plateau de jeu"
      >
        {/* Track surface (road) */}
        <rect
          x={CXL - R}
          y={CY - R}
          width={2 * R + LX}
          height={2 * R}
          rx={R}
          ry={R}
          fill="rgba(20,32,58,0.85)"
          stroke="#34507e"
          stroke-width="22"
        />
        {/* Dashed centre line */}
        <rect
          x={CXL - R}
          y={CY - R}
          width={2 * R + LX}
          height={2 * R}
          rx={R}
          ry={R}
          fill="none"
          stroke="rgba(232,193,112,0.5)"
          stroke-width="1.5"
          stroke-dasharray="2 9"
        />

        {/* Houses at the two apexes. P1 faces right (inward), P2 mirrored. */}
        <g transform={`translate(${cellPoint(0).x}, ${cellPoint(0).y})`}>{House('p1', false)}</g>
        <g transform={`translate(${cellPoint(7).x}, ${cellPoint(7).y})`}>{House('p2', true)}</g>

        {/* Cell sockets. In advanced mode the 4 corners are Marché Noir cases. */}
        <For each={cells()}>
          {(cell) => {
            const isMN = () => props.view.mode === 'advanced' && MARCHE_NOIR_CELLS.includes(cell.i);
            return (
              <g transform={`translate(${cell.x}, ${cell.y})`}>
                <circle
                  r={isMN() ? 11 : 9}
                  fill={isMN() ? '#2a210e' : '#0e1a30'}
                  stroke={isMN() ? '#e8c170' : '#3a577f'}
                  stroke-width={isMN() ? 2 : 1.5}
                />
                <Show when={isMN()}>
                  <text text-anchor="middle" y="-13" font-size="8" font-weight="800" fill="#e8c170">
                    MN
                  </text>
                </Show>
                <text text-anchor="middle" y="3" font-size="8" font-weight="700" fill={isMN() ? '#e8c170' : '#6f8cb8'}>
                  {cell.i}
                </text>
              </g>
            );
          }}
        </For>

        {/* Pawns: spy chips hopping cell by cell along the track. */}
        <For each={['p1', 'p2'] as PlayerId[]}>
          {(pid) => {
            const pt = () => cellPoint(pawnIndex[pid]());
            const dx = pid === 'p1' ? -5 : 5;
            return (
              <g
                class="pawn-move"
                style={{ transform: `translate(${pt().x + dx}px, ${pt().y}px)` }}
              >
                <circle r="11" fill={colorFor(pid)} stroke="#0b1220" stroke-width="2" />
                <circle r="11" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1" stroke-dasharray="2 2" />
                <text text-anchor="middle" y="3.5" font-size="9" font-weight="800" fill="#0b1220">
                  {pid.toUpperCase()}
                </text>
              </g>
            );
          }}
        </For>
      </svg>
    </div>
  );
};

export default Board;
