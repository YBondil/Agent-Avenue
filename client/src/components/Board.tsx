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
  const TRACK_R = 120;
  const CELL_R = 16;

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

  const p1Color = () => (youPid() === 'p1' ? '#3b82f6' : '#ef4444');
  const p2Color = () => (youPid() === 'p2' ? '#3b82f6' : '#ef4444');

  return (
    <div class="flex flex-col items-center gap-2">
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        class="w-full max-w-xs sm:max-w-sm"
        aria-label="Plateau de jeu"
      >
        {/* Track circle guide */}
        <circle
          cx={CX}
          cy={CY}
          r={TRACK_R}
          fill="none"
          stroke="#2a3a5e"
          stroke-width="2"
          stroke-dasharray="4 4"
        />

        {/* Cells */}
        {cells().map((cell) => (
          <g>
            <circle
              cx={cell.x}
              cy={cell.y}
              r={CELL_R}
              fill="#1a2236"
              stroke="#2a3a5e"
              stroke-width="1.5"
            />
            <text
              x={cell.x}
              y={cell.y + 4}
              text-anchor="middle"
              font-size="10"
              fill="#64748b"
            >
              {cell.i}
            </text>
          </g>
        ))}

        {/* P1 pawn */}
        <circle
          cx={pawnPos('p1').x - 6}
          cy={pawnPos('p1').y}
          r={9}
          fill={p1Color()}
          stroke="white"
          stroke-width="2"
          style={{ transition: 'cx 0.6s ease-in-out, cy 0.6s ease-in-out' }}
        />
        <text
          x={pawnPos('p1').x - 6}
          y={pawnPos('p1').y + 4}
          text-anchor="middle"
          font-size="9"
          fill="white"
          font-weight="bold"
          style={{ transition: 'x 0.6s ease-in-out, y 0.6s ease-in-out' }}
        >
          P1
        </text>

        {/* P2 pawn */}
        <circle
          cx={pawnPos('p2').x + 6}
          cy={pawnPos('p2').y}
          r={9}
          fill={p2Color()}
          stroke="white"
          stroke-width="2"
          style={{ transition: 'cx 0.6s ease-in-out, cy 0.6s ease-in-out' }}
        />
        <text
          x={pawnPos('p2').x + 6}
          y={pawnPos('p2').y + 4}
          text-anchor="middle"
          font-size="9"
          fill="white"
          font-weight="bold"
          style={{ transition: 'x 0.6s ease-in-out, y 0.6s ease-in-out' }}
        >
          P2
        </text>
      </svg>

      {/* Legend */}
      <div class="flex gap-4 text-xs text-spy-muted">
        <span class="flex items-center gap-1">
          <span
            class="inline-block w-3 h-3 rounded-full"
            style={{ background: youPid() === 'p1' ? '#3b82f6' : '#ef4444' }}
          />
          P1 {youPid() === 'p1' ? '(vous)' : '(adversaire)'}
        </span>
        <span class="flex items-center gap-1">
          <span
            class="inline-block w-3 h-3 rounded-full"
            style={{ background: youPid() === 'p2' ? '#3b82f6' : '#ef4444' }}
          />
          P2 {youPid() === 'p2' ? '(vous)' : '(adversaire)'}
        </span>
      </div>
    </div>
  );
};

export default Board;
