import { Component, createMemo } from 'solid-js';
import type { PlayerId, PlayerView } from '../types';
import { BOARD_CELLS } from '../constants';

interface BoardProps {
  view: PlayerView;
}

function cellCoords(index: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const angle = (index / BOARD_CELLS) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

const Board: Component<BoardProps> = (props) => {
  const SVG_SIZE = 320;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const TRACK_R = 128;
  const CELL_R = 17;

  const cells = createMemo(() =>
    Array.from({ length: BOARD_CELLS }, (_, i) => ({
      i,
      ...cellCoords(i, CX, CY, TRACK_R),
    }))
  );

  const pawnPos = (pid: PlayerId) => {
    const idx = props.view.positions[pid];
    return cellCoords(idx, CX, CY, TRACK_R);
  };

  const youPid = () => props.view.you;
  const colorFor = (pid: PlayerId) => (youPid() === pid ? '#6C5CE7' : '#FF5C7A');

  return (
    <div class="flex flex-col items-center gap-2 w-full">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        class="w-full max-w-[78vh] sm:max-w-sm"
        aria-label="Plateau de jeu"
      >
        <defs>
          <radialGradient id="board-face" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#fdeccf" />
          </radialGradient>
        </defs>

        {/* Board face */}
        <circle cx={CX} cy={CY} r={TRACK_R + CELL_R + 10} fill="url(#board-face)" />
        <circle
          cx={CX}
          cy={CY}
          r={TRACK_R}
          fill="none"
          stroke="#F1DDC2"
          stroke-width="3"
          stroke-dasharray="2 10"
          stroke-linecap="round"
        />

        {/* Cells */}
        {cells().map((cell) => (
          <g>
            <circle
              cx={cell.x}
              cy={cell.y}
              r={CELL_R}
              fill="#ffffff"
              stroke="#EAD9BE"
              stroke-width="2"
            />
            <text
              x={cell.x}
              y={cell.y + 4}
              text-anchor="middle"
              font-size="11"
              font-weight="700"
              fill="#B9A98C"
            >
              {cell.i}
            </text>
          </g>
        ))}

        {/* Pawns: transform-based, springy travel. Slight offset so both are
            visible when sharing a cell. */}
        <g
          class="pawn-move"
          style={{ transform: `translate(${pawnPos('p1').x - 6}px, ${pawnPos('p1').y}px)` }}
        >
          <circle r={12} fill={colorFor('p1')} stroke="white" stroke-width="3" />
          <text text-anchor="middle" y={4} font-size="10" font-weight="800" fill="white">
            P1
          </text>
        </g>
        <g
          class="pawn-move"
          style={{ transform: `translate(${pawnPos('p2').x + 6}px, ${pawnPos('p2').y}px)` }}
        >
          <circle r={12} fill={colorFor('p2')} stroke="white" stroke-width="3" />
          <text text-anchor="middle" y={4} font-size="10" font-weight="800" fill="white">
            P2
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div class="flex gap-4 text-xs font-bold text-spy-muted">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full" style={{ background: colorFor('p1') }} />
          P1 {youPid() === 'p1' ? '(vous)' : '(adv.)'}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full" style={{ background: colorFor('p2') }} />
          P2 {youPid() === 'p2' ? '(vous)' : '(adv.)'}
        </span>
      </div>
    </div>
  );
};

export default Board;
