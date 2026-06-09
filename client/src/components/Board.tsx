import { Component, For, createMemo } from 'solid-js';
import type { PlayerId, PlayerView } from '../types';
import { BOARD_CELLS } from '../constants';

interface BoardProps {
  view: PlayerView;
}

// Track rectangle inset, as percentages of the arena container.
const XL = 6;
const XR = 94;
const YT = 7;
const YB = 93;
const W = XR - XL;
const H = YB - YT;
const PERIM = 2 * (W + H);

// Map a track index (0..13) to a point on the rectangle perimeter, walking
// clockwise from the top-left corner. Returns percentage coordinates.
function perimeterPoint(index: number): { x: number; y: number } {
  const d = (index / BOARD_CELLS) * PERIM;
  if (d <= W) return { x: XL + d, y: YT }; // top edge L->R
  if (d <= W + H) return { x: XR, y: YT + (d - W) }; // right edge T->B
  if (d <= 2 * W + H) return { x: XR - (d - (W + H)), y: YB }; // bottom edge R->L
  return { x: XL, y: YB - (d - (2 * W + H)) }; // left edge B->T
}

const Board: Component<BoardProps> = (props) => {
  const cells = createMemo(() =>
    Array.from({ length: BOARD_CELLS }, (_, i) => ({ i, ...perimeterPoint(i) }))
  );

  const you = () => props.view.you;
  const colorFor = (pid: PlayerId) => (you() === pid ? '#22D3EE' : '#E879F9');
  const pawnPoint = (pid: PlayerId) => perimeterPoint(props.view.positions[pid]);

  return (
    <div class="absolute inset-0">
      {/* Rectangular track outline delimiting the arena */}
      <div
        class="absolute rounded-[2rem]"
        style={{
          left: `${XL}%`,
          top: `${YT}%`,
          width: `${W}%`,
          height: `${H}%`,
          'box-shadow': '0 0 24px rgba(34,211,238,0.25), inset 0 0 24px rgba(34,211,238,0.12)',
          border: '1.5px solid rgba(34,211,238,0.35)',
        }}
      />

      {/* Cell nodes */}
      <For each={cells()}>
        {(cell) => (
          <div
            class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
          >
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,211,238,0.06)',
                border: '1.5px solid rgba(34,211,238,0.4)',
                'box-shadow': '0 0 8px rgba(34,211,238,0.3)',
              }}
            >
              <span class="text-[8px] font-bold text-spy-accent/70">{cell.i}</span>
            </div>
          </div>
        )}
      </For>

      {/* Pawns: orthogonal travel via staggered left/top transitions. */}
      <div
        class="pawn-move absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${pawnPoint('p1').x}%`, top: `${pawnPoint('p1').y}%` }}
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-black -ml-1.5"
          style={{ background: colorFor('p1'), 'box-shadow': `0 0 16px ${colorFor('p1')}` }}
        >
          P1
        </div>
      </div>
      <div
        class="pawn-move absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${pawnPoint('p2').x}%`, top: `${pawnPoint('p2').y}%` }}
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-black ml-1.5"
          style={{ background: colorFor('p2'), 'box-shadow': `0 0 16px ${colorFor('p2')}` }}
        >
          P2
        </div>
      </div>
    </div>
  );
};

export default Board;
