// src/app/game-grid/game-grid.ts
import { Component, computed, inject } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { GameCell } from '../game-cell/game-cell';
import { QuestionModal } from '../question-modal/question-modal';

@Component({
  selector: 'app-game-grid',
  imports: [GameCell, QuestionModal],
  template: `
    <app-question-modal
      [visible]="gs.modalMode() !== null"
      [mode]="gs.modalMode() === 'attack' ? 'attack' : 'capture'"
      [activePlayer]="gs.currentPlayer()"
      [capitalStep]="capitalStep()"
      [captureQuestion]="gs.captureQuestion()"
      [attackQuestion]="attackQuestion()"
      (captureAnswer)="onCaptureAnswer($event)"
      (attackAnswer)="onAttackAnswer($event)"
      (attackClose)="onAttackClose()"
    ></app-question-modal>

    <div class="game-root">

      <!-- Score bar -->
      <div class="scorebar">
        <div class="score-block p1-score" [class.active]="gs.currentPlayer() === 1 && gs.phase() !== 'gameover'">
          <span class="player-name">🔵 Игрок 1</span>
          <span class="cell-count">{{ gs.player1Cells().length }}</span>
          @if (gs.player1Cells().length > 0) { <span class="capital-flag">★</span> }
        </div>

        <div class="center-info">
          @if (gs.phase() === 'capture') {
            <span class="phase-label">🗺️ Захват</span>
          } @else if (gs.phase() === 'attack') {
            <span class="phase-label attack-label">⚔️ Битва</span>
          } @else {
            <span class="phase-label gameover-label">🏆 Конец игры</span>
          }
          @if (gs.phase() !== 'gameover') {
            <span class="turn-label">Ход: {{ gs.currentPlayer() === 1 ? '🔵' : '🔴' }}</span>
          }
        </div>

        <div class="score-block p2-score" [class.active]="gs.currentPlayer() === 2 && gs.phase() !== 'gameover'">
          @if (gs.player2Cells().length > 0) { <span class="capital-flag">★</span> }
          <span class="cell-count">{{ gs.player2Cells().length }}</span>
          <span class="player-name">Игрок 2 🔴</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid-wrapper">
        <div class="grid" [style.gridTemplateColumns]="'repeat(' + gs.GRID_SIZE + ', 1fr)'">
          @for (cell of gs.cells(); track cell.id) {
            <app-game-cell
              [cellId]="cell.id"
              [gridSize]="gs.GRID_SIZE"
              [owner]="cell.owner"
              [isCapital]="cell.isCapital"
              [isClickable]="isCellClickable(cell.id)"
              [isAttackable]="isCellAttackable(cell.id)"
              (cellClicked)="onCellClick($event)"
            ></app-game-cell>
          }
        </div>
      </div>

      <!-- Game over -->
      @if (gs.phase() === 'gameover') {
        <div class="gameover-panel">
          @if (gs.winner()) {
            <h2>{{ gs.winner() === 1 ? '🔵 Игрок 1' : '🔴 Игрок 2' }} победил!</h2>
            <p>{{ gs.player1Cells().length }} vs {{ gs.player2Cells().length }} клеток</p>
          } @else {
            <h2>🤝 Ничья!</h2>
          }
          <button class="restart-btn" (click)="gs.resetGame()">Играть снова</button>
        </div>
      }

      <!-- Hint -->
      @if (gs.phase() !== 'gameover' && gs.modalMode() === null) {
        <div class="hint">
          @if (gs.phase() === 'capture') {
            @if (isFirstMove()) { Выберите стартовую клетку — она станет вашей столицей ★
            } @else { Кликните на соседнюю пустую клетку чтобы захватить её }
          } @else {
            Нападите на соседнюю клетку противника
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #0d1117; }

    .game-root {
      display: flex; flex-direction: column; align-items: center;
      min-height: 100vh; padding: 24px 16px; gap: 20px;
    }

    .scorebar {
      display: flex; align-items: center; gap: 12px;
      width: 100%; max-width: 460px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 12px 20px;
    }
    .score-block {
      display: flex; align-items: center; gap: 8px; flex: 1;
      padding: 6px 10px; border-radius: 8px; transition: background 0.3s;
    }
    .score-block.active { background: rgba(255,255,255,0.07); }
    .p1-score { flex-direction: row; }
    .p2-score { flex-direction: row-reverse; }
    .player-name { font-size: 13px; font-weight: 600; color: #ccc; white-space: nowrap; }
    .cell-count  { font-size: 26px; font-weight: 800; color: #fff; min-width: 28px; text-align: center; }
    .capital-flag { font-size: 14px; color: #ffd700; }

    .center-info {
      display: flex; flex-direction: column; align-items: center;
      gap: 2px; min-width: 90px;
    }
    .phase-label   { font-size: 13px; font-weight: 700; color: #aaa; }
    .attack-label  { color: #ff7070; }
    .gameover-label { color: #ffd700; }
    .turn-label    { font-size: 18px; }

    .grid-wrapper {
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
    }
    .grid { display: grid; gap: 4px; }

    .gameover-panel {
      text-align: center; color: #fff;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px; padding: 28px 40px;
    }
    .gameover-panel h2 { font-size: 28px; margin: 0 0 8px; }
    .gameover-panel p  { color: #aaa; margin: 0 0 20px; }
    .restart-btn {
      padding: 12px 32px; background: #1a56db;
      border: none; border-radius: 8px; color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .restart-btn:hover { background: #1e40af; }

    .hint { font-size: 13px; color: rgba(255,255,255,0.3); text-align: center; }
  `],
})
export class GameGrid {
  gs = inject(GameStateService);

  isFirstMove = computed(() =>
    this.gs.cells().filter(c => c.owner === this.gs.currentPlayer()).length === 0
  );

  capitalStep    = computed(() => this.gs.capitalAttackState()?.step ?? null);
  attackQuestion = computed(() => this.gs.attackState()?.question ?? null);

  /** Set of cell IDs that are clickable this turn — recomputed reactively */
  clickableCells = computed<Set<number>>(() => {
    if (this.gs.modalMode() !== null) return new Set();
    if (this.gs.phase() !== 'capture') return new Set();
    const player = this.gs.currentPlayer();
    return new Set(
      this.gs.cells()
        .filter(c => this.gs.canCapture(c.id, player))
        .map(c => c.id)
    );
  });

  attackableCells = computed<Set<number>>(() => {
    if (this.gs.modalMode() !== null) return new Set();
    if (this.gs.phase() !== 'attack') return new Set();
    const player = this.gs.currentPlayer();
    return new Set(
      this.gs.cells()
        .filter(c => this.gs.canAttack(c.id, player))
        .map(c => c.id)
    );
  });

  isCellClickable(cellId: number): boolean  { return this.clickableCells().has(cellId); }
  isCellAttackable(cellId: number): boolean { return this.attackableCells().has(cellId); }

  // Track whether the pending cell should become a capital
  private _pendingIsCapital = false;

  onCellClick(cellId: number) {
    if (this.gs.phase() === 'capture') {
      this._pendingIsCapital = this.isFirstMove();
      const q = this.gs.getRandomQuestion();
      if (!q) return;
      this.gs.captureQuestion.set(q);
      this.gs.pendingCellId.set(cellId);
      this.gs.modalMode.set('capture');
    } else if (this.gs.phase() === 'attack') {
      this.gs.startAttack(cellId);
    }
  }

  onCaptureAnswer(answerIndex: number) {
    const q = this.gs.captureQuestion();
    const cellId = this.gs.pendingCellId();
    if (!q || cellId === null) return;

    this.gs.markQuestionUsed(q.id);
    const correct = answerIndex === q.correctIndex;

    if (correct) {
      this.gs.cells.update(cells =>
        cells.map(c => c.id === cellId
          ? { ...c, owner: this.gs.currentPlayer(), isCapital: this._pendingIsCapital }
          : c
        )
      );
      if (this.gs.emptyCells().length === 0) {
        this.gs.phase.set('attack');
      }
    }

    this.gs.captureQuestion.set(null);
    this.gs.pendingCellId.set(null);
    this.gs.modalMode.set(null);
    this.gs.currentPlayer.update(p => p === 1 ? 2 : 1);
  }

  onAttackAnswer(ev: { player: 1 | 2; value: number }) {
    // Just record the answer — modal handles reveal state internally.
    // We save the value to attackState so onAttackClose can resolve.
    const st = this.gs.attackState();
    if (!st) return;
    this.gs.attackState.set({
      ...st,
      answer1: ev.player === 1 ? ev.value : st.answer1,
      answer2: ev.player === 2 ? ev.value : st.answer2,
    });
  }

  onAttackClose() {
    // Both players confirmed — resolve the attack
    const st = this.gs.attackState();
    if (!st) return;

    const correct = st.question.correctAnswer;
    const d1 = st.answer1 !== null ? Math.abs(st.answer1 - correct) : Infinity;
    const d2 = st.answer2 !== null ? Math.abs(st.answer2 - correct) : Infinity;

    if (d1 < d2) {
      // attacker wins
      this.gs.cells.update(cells =>
        cells.map(c => c.id === st.targetCellId ? { ...c, owner: st.attackerId } : c)
      );
    }
    // defender wins or draw → no change

    // Check game over
    const p1 = this.gs.cells().filter(c => c.owner === 1).length;
    const p2 = this.gs.cells().filter(c => c.owner === 2).length;
    if (p1 === 0 || p2 === 0) {
      this.gs.phase.set('gameover');
    }

    this.gs.attackState.set(null);
    this.gs.modalMode.set(null);
    this.gs.currentPlayer.update(p => p === 1 ? 2 : 1);
  }
}
