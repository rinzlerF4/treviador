import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

/**
 * GameCellComponent - A single cell in the game grid
 *
 * Responsibilities:
 * - Display a single grid cell
 * - Track if this cell is highlighted (selected)
 * - Toggle highlight on click
 *
 * How it works:
 * - We use Angular's signal() for reactive state
 * - isHighlighted is a boolean that toggles on each click
 * - The CSS class is bound to isHighlighted value
 */

@Component({
  selector: 'app-game-cell',
  imports: [NgIf, NgFor],
  templateUrl: './game-cell.html',
  styleUrl: './game-cell.css',
})
export class GameCell {
  // Inputs from parent (GameGrid)
  @Input() cellId: number = 0;
  @Input() gridSize: number = 8;
  @Input() isCaptured: boolean = false;

  // Output: emit click event to parent
  @Output() cellClicked = new EventEmitter<void>();

  /**
   * Calculate row coordinate (1-indexed)
   * Example: cellId=45 -> row = Math.floor((45-1)/8) + 1 = 6
   */
  get row(): number {
    return Math.floor((this.cellId - 1) / this.gridSize) + 1;
  }

  /**
   * Calculate column coordinate (1-indexed)
   * Example: cellId=45 -> col = ((45-1) % 8) + 1 = 5
   */
  get col(): number {
    return ((this.cellId - 1) % this.gridSize) + 1;
  }

  /**
   * Get formatted coordinates as "row.col"
   * Example: "6.5" for cellId=45
   */
  get coordinates(): string {
    return `${this.row}.${this.col}`;
  }

  /**
   * Handle cell click
   * Emit event to parent, let parent handle game logic
   */
  onClick() {
    if (!this.isCaptured) {
      this.cellClicked.emit();
    }
  }
}
