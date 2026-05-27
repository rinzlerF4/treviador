// src/app/game-cell/game-cell.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';

@Component({
  selector: 'app-game-cell',
  imports: [],
  template: `
    <div
      class="game-cell"
      [class.owner-1]="owner === 1"
      [class.owner-2]="owner === 2"
      [class.empty]="owner === null"
      [class.capital]="isCapital"
      [class.clickable]="isClickable"
      [class.attackable]="isAttackable"
      (click)="onClick()"
    >
      @if (isCapital) {
        <span class="capital-icon">★</span>
      } @else {
        <span class="coord">{{ coord }}</span>
      }
    </div>
  `,
  styles: [`
    .game-cell {
      width: 64px;
      height: 64px;
      border: 2px solid rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s ease;
      border-radius: 4px;
      user-select: none;
    }

    .coord {
      font-size: 10px;
      color: rgba(255,255,255,0.2);
      font-family: monospace;
    }

    .empty {
      background: rgba(255,255,255,0.04);
      cursor: default;
    }

    .owner-1 {
      background: linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%);
    }

    .owner-2 {
      background: linear-gradient(135deg, #c0392b 0%, #7b241c 100%);
    }

    .capital {
      border: 2px solid #ffd700 !important;
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
    }

    .capital-icon {
      font-size: 22px;
      filter: drop-shadow(0 0 6px #ffd700);
    }

    .clickable {
      cursor: pointer;
    }
    .clickable:hover {
      transform: scale(1.08);
      border-color: rgba(255,255,255,0.6) !important;
      z-index: 2;
    }

    .attackable {
      cursor: crosshair;
      animation: pulse-attack 1.5s infinite;
    }

    @keyframes pulse-attack {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 100, 100, 0.4); }
      50%       { box-shadow: 0 0 0 6px rgba(255, 100, 100, 0); }
    }
  `],
})
export class GameCell {
  @Input() cellId: number = 0;
  @Input() gridSize: number = 6;
  @Input() owner: 1 | 2 | null = null;
  @Input() isCapital: boolean = false;
  @Input() isClickable: boolean = false;
  @Input() isAttackable: boolean = false;

  @Output() cellClicked = new EventEmitter<number>();

  get coord(): string {
    const row = Math.floor((this.cellId - 1) / this.gridSize) + 1;
    const col = ((this.cellId - 1) % this.gridSize) + 1;
    return `${row}.${col}`;
  }

  onClick() {
    if (this.isClickable || this.isAttackable) {
      this.cellClicked.emit(this.cellId);
    }
  }
}
