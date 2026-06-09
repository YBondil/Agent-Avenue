import { Component, For, createMemo } from 'solid-js';
import type { PlayerId, PlayerView } from '../types';
import { BOARD_CELLS } from '../constants';

interface BoardProps {
  view: PlayerView;
}

const XL = 8;
const XR = 92;
const YT = 8;
const YB = 92;
const W = XR - XL;
const H = YB - YT;
const PERIM = 2 * (W + H);

// Map a track index (0..13) to a point on the rectangle perimeter, clockwise
// from the top-left corner. Percentage coordinates within the board.
function perimeterPoint(index: number): { x: number; y: number } {
  const d = (index / BOARD_CELLS) * PERIM;
  if (d <= W) return { x: XL + d, y: YT };
  if (d <= W + H) return { x: XR, y: YT + (d - W) };
  if (d <= 2 * W + H) return { x: XR - (d - (W + H)), y: YB };
  return { x: XL, y: YB - (d - (2 * W + H)) };
}

const Board: Component<BoardProps> = (props) => {
  const cells = createMemo(() =>
    Array.from({ length: BOARD_CELLS }, (_, i) => ({ i, ...perimeterPoint(i) }))
  );

  const you = () => props.view.you;
  const chip = (pid: PlayerId) =>
    you() === pid
      ? { base: '#d8b25a', edge: '#a9823f' }
      : { base: '#c0504a', edge: '#8c3a35' };
  const pawnPoint = (pid: PlayerId) => perimeterPoint(props.view.positions[pid]);

  return (
    <div class="absolute inset-0">
      {/* Inlaid felt track */}
      <div
        class="absolute rounded-[1.5rem]"
        style={{
          left: `${XL}%`,
          top: `${YT}%`,
          width: `${W}%`,
          height: `${H}%`,
          background: 'rgba(0,0,0,0.10)',
          border: '2px solid rgba(202,161,90,0.5)',
          'box-shadow':
            'inset 0 2px 8px rgba(0,0,0,0.45), inset 0 0 0 5px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.06)',
        }}
      />

      {/* Cell sockets */}
      <For each={cells()}>
        {(cell) => (
          <div
            class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
            style={{
              left: `${cell.x}%`,
              top: `${cell.y}%`,
              width: '3.4vh',
              height: '3.4vh',
              'max-width': '24px',
              'max-height': '24px',
              background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.35))',
              border: '1.5px solid rgba(202,161,90,0.35)',
              'box-shadow': 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            <span class="text-[9px] font-bold text-spy-accent/70">{cell.i}</span>
          </div>
        )}
      </For>

      {/* Pawns as poker chips */}
      <For each={['p1', 'p2'] as PlayerId[]}>
        {(pid) => {
          const c = chip(pid);
          return (
            <div
              class="pawn-move absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pawnPoint(pid).x}%`, top: `${pawnPoint(pid).y}%` }}
            >
              <div
                class={`rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-card ${
                  pid === 'p1' ? '-ml-1.5' : 'ml-1.5'
                }`}
                style={{
                  width: '4.4vh',
                  height: '4.4vh',
                  'max-width': '32px',
                  'max-height': '32px',
                  background: `radial-gradient(circle at 50% 35%, ${c.base}, ${c.edge})`,
                  border: '2px dashed rgba(255,255,255,0.85)',
                  'box-shadow': '0 3px 6px rgba(0,0,0,0.5)',
                }}
              >
                {pid.toUpperCase()}
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export default Board;
