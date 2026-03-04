import { Component, signal } from '@angular/core';
import { GameCell } from '../game-cell/game-cell';
import { QUESTIONS, Question } from '../data/questions';
import { QuestionModal } from '../question-modal/question-modal';

/**
 * GameGridComponent - The main game grid container
 *
 * Responsibilities:
 * - Define grid dimensions (GRID_SIZE x GRID_SIZE)
 * - Generate cell IDs dynamically
 * - Render cells using *ngFor loop
 * - Manage overall grid layout with CSS Grid
 *
 * How it works:
 * - GRID_SIZE = 8 means 8x8 = 64 cells total
 * - cells signal contains an array of cell IDs [1, 2, 3, ... 64]
 * - Template loops through cells with *ngFor
 * - Each iteration creates a <app-game-cell> component
 * - The component is imported as dependency in imports array
 */

@Component({
  selector: 'app-game-grid',
  imports: [GameCell, QuestionModal],
  templateUrl: './game-grid.html',
  styleUrl: './game-grid.css',
})
export class GameGrid {
  // Configuration
  readonly GRID_SIZE = 4;

  // Сигналы для клеток и состояния
  cells = signal<number[]>([]);
  capturedCells = signal<number[]>([]);
  usedQuestionIds = signal<number[]>([]);

  // Для модалки
  currentQuestion: Question | null = null;
  modalVisible = false;
  pendingCellId: number | null = null;

  // Hardcoded questions for the MVP
  private readonly questions: Question[] = QUESTIONS;

  constructor() {
    // Initialize cells when component is created
    this.initializeGrid();
  }

  /**
   * Initialize the grid with cell IDs
   */
  private initializeGrid() {
    const cellCount = this.GRID_SIZE * this.GRID_SIZE;
    const cellIds = Array.from({ length: cellCount }, (_, i) => i + 1);
    this.cells.set(cellIds);
  }

  /**
   * Check if a cell is currently captured
   */
  isCellCaptured(cellId: number): boolean {
    return this.capturedCells().includes(cellId);
  }

  /**
   * Get a random question that hasn't been used yet
   * Returns null if all questions have been used
   */
  private getRandomQuestion(): Question | null {
    const used = this.usedQuestionIds();
    const availableQuestions = this.questions.filter((q) => !used.includes(q.id));

    if (availableQuestions.length === 0) {
      return null;
    }

    // Get random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }

  /**
   * Capture a cell (make it permanent)
   */
  private captureCell(cellId: number) {
    const captured = this.capturedCells();
    if (!captured.includes(cellId)) {
      this.capturedCells.set([...captured, cellId]);
    }
  }

  /**
   * Handle cell click - show quiz and capture if correct
   */
  onCellClick(cellId: number) {
    // Don't allow clicking on already captured cells
    if (this.isCellCaptured(cellId)) {
      return;
    }

    // Get random question
    const question = this.getRandomQuestion();

    if (!question) {
      alert('No more questions available. Game Over!');
      return;
    }

    this.currentQuestion = question;
    this.modalVisible = true;
    this.pendingCellId = cellId;
  }

  /** Ответ из модалки */
  onAnswer(answerIndex: number) {
    if (!this.currentQuestion || this.pendingCellId === null) return;

    // Если правильный — захватываем клетку
    if (answerIndex === this.currentQuestion.correctIndex) {
      this.captureCell(this.pendingCellId);
    }

    // Помечаем вопрос как использованный
    this.usedQuestionIds.set([...this.usedQuestionIds(), this.currentQuestion.id]);

    // Сбрасываем модалку
    this.usedQuestionIds.set([...this.usedQuestionIds(), this.currentQuestion.id]);

    this.currentQuestion = null;
    this.modalVisible = false;
    this.pendingCellId = null;
  }

  /**
   * Track function for Angular's *ngFor optimization
   * Tells Angular: "This is how you identify each cell uniquely"
   * Without this, Angular might re-render cells unnecessarily
   */
  trackByFn(index: number, cellId: number): number {
    return cellId;
  }
}
