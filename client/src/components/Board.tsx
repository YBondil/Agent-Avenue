import { Component, For, createMemo } from 'solid-js';
import type { PlayerId, PlayerView } from '../types';
import { BOARD_CELLS } from '../constants';

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
const S4 = LX; // bottom straight
const PERIM = 2 * LX + 2 * Math.PI * R;

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
  if (d <= S1 + S2 + S3 + S4) {
    return { x: CXR - (d - S1 - S2 - S3), y: CY + R }; // bottom straight
  }
  const a = 0.5 * Math.PI + ((d - S1 - S2 - S3 - S4) / S1) * (Math.PI / 2); // lower-left quarter
  return { x: CXL + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

const Board: Component<BoardProps> = (props) => {
  const cells = createMemo(() =>
    Array.from({ length: BOARD_CELLS }, (_, i) => ({ i, ...cellPoint(i) }))
  );

  const you = () => props.view.you;
  const colorFor = (pid: PlayerId) => (you() === pid ? '#e8c170' : '#4aa3df');
  const pawnPoint = (pid: PlayerId) => cellPoint(props.view.positions[pid]);

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

        {/* Houses at the two apexes */}
        <For each={[{ pid: 'p1' as PlayerId, p: cellPoint(0) }, { pid: 'p2' as PlayerId, p: cellPoint(7) }]}>
          {(h) => (
            <g transform={`translate(${h.p.x}, ${h.p.y})`}>
              <rect
                x={-12}
                y={-9}
                width={24}
                height={18}
                rx={3}
                fill={colorFor(h.pid)}
                opacity="0.25"
                stroke={colorFor(h.pid)}
                stroke-width="1.5"
              />
              <path d={`M -12 -9 L 0 -17 L 12 -9 Z`} fill={colorFor(h.pid)} opacity="0.6" />
            </g>
          )}
        </For>

        {/* Cell sockets */}
        <For each={cells()}>
          {(cell) => (
            <g transform={`translate(${cell.x}, ${cell.y})`}>
              <circle r="9" fill="#0e1a30" stroke="#3a577f" stroke-width="1.5" />
              <text text-anchor="middle" y="3" font-size="8" font-weight="700" fill="#6f8cb8">
                {cell.i}
              </text>
            </g>
          )}
        </For>

        {/* Pawns: spy chips gliding along the track. */}
        <For each={['p1', 'p2'] as PlayerId[]}>
          {(pid) => {
            const pt = () => pawnPoint(pid);
            const dx = pid === 'p1' ? -6 : 6;
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
