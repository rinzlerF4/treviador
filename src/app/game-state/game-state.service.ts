// src/app/game-state/game-state.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { QUESTIONS, NUMERIC_QUESTIONS, Question, NumericQuestion } from '../data/questions';

export type Player = 1 | 2;
export type GamePhase = 'capture' | 'attack' | 'gameover';
export type ModalMode = 'capture' | 'attack' | null;

export interface CellState {
  id: number;
  owner: Player | null;
  isCapital: boolean;
}

export interface AttackState {
  attackerId: Player;
  defenderId: Player;
  targetCellId: number;
  question: NumericQuestion;
  answer1: number | null; // player 1 answer
  answer2: number | null; // player 2 answer
  timer: number; // seconds left
  revealed: boolean; // both answered → show result
}

export interface CapitalAttackState {
  attackerId: Player;
  defenderId: Player;
  targetCellId: number;
  step: 1 | 2 | 3; // which question in the 3-step sequence
  attackerProgress: number; // how many steps attacker passed (0,1,2,3)
  currentQuestion: Question;
  waitingForDefender: boolean; // step 3: defender must answer
  defenderAnswer: number | null;
  attackerAnswer: number | null;
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  readonly GRID_SIZE = 6;
  readonly TOTAL_CELLS = this.GRID_SIZE * this.GRID_SIZE;

  // ── Core state ──────────────────────────────────────────
  cells = signal<CellState[]>([]);
  currentPlayer = signal<Player>(1);
  phase = signal<GamePhase>('capture');
  usedQuestionIds = signal<number[]>([]);
  usedNumericIds = signal<number[]>([]);

  // ── Modal state ──────────────────────────────────────────
  modalMode = signal<ModalMode>(null);
  captureQuestion = signal<Question | null>(null);
  pendingCellId = signal<number | null>(null);

  attackState = signal<AttackState | null>(null);
  capitalAttackState = signal<CapitalAttackState | null>(null);

  // ── Derived ──────────────────────────────────────────────
  player1Cells = computed(() => this.cells().filter((c) => c.owner === 1));
  player2Cells = computed(() => this.cells().filter((c) => c.owner === 2));
  emptyCells = computed(() => this.cells().filter((c) => c.owner === null));

  winner = computed(() => {
    if (this.phase() !== 'gameover') return null;
    const p1 = this.player1Cells().length;
    const p2 = this.player2Cells().length;
    if (p1 > p2) return 1 as Player;
    if (p2 > p1) return 2 as Player;
    return null; // draw
  });

  constructor() {
    this.initGrid();
  }

  // ── Initialisation ───────────────────────────────────────
  private initGrid() {
    const cells: CellState[] = Array.from({ length: this.TOTAL_CELLS }, (_, i) => ({
      id: i + 1,
      owner: null,
      isCapital: false,
    }));
    this.cells.set(cells);
  }

  // ── Cell helpers ─────────────────────────────────────────
  getCell(id: number): CellState | undefined {
    return this.cells().find((c) => c.id === id);
  }

  /** Neighbours (up/down/left/right) for a cell */
  getNeighbours(cellId: number): number[] {
    const row = Math.floor((cellId - 1) / this.GRID_SIZE);
    const col = (cellId - 1) % this.GRID_SIZE;
    const neighbours: number[] = [];
    if (row > 0) neighbours.push(cellId - this.GRID_SIZE);
    if (row < this.GRID_SIZE - 1) neighbours.push(cellId + this.GRID_SIZE);
    if (col > 0) neighbours.push(cellId - 1);
    if (col < this.GRID_SIZE - 1) neighbours.push(cellId + 1);
    return neighbours;
  }

  /** Cells adjacent to a player's territory */
  getExpandableCells(player: Player): number[] {
    const owned = this.cells()
      .filter((c) => c.owner === player)
      .map((c) => c.id);
    if (owned.length === 0) return []; // first move handled separately
    const adj = new Set<number>();
    for (const id of owned) {
      this.getNeighbours(id).forEach((n) => adj.add(n));
    }
    return [...adj].filter((id) => this.getCell(id)?.owner === null);
  }

  /** Can player click this cell during capture phase? */
  canCapture(cellId: number, player: Player): boolean {
    const cell = this.getCell(cellId);
    if (!cell || cell.owner !== null) return false;
    const owned = this.cells().filter((c) => c.owner === player);
    if (owned.length === 0) return true; // first capital pick
    const expandable = this.getExpandableCells(player);
    if (expandable.length > 0) return expandable.includes(cellId);
    return true; // trapped — can pick any empty cell
  }

  /** Can player attack this cell during attack phase? */
  canAttack(cellId: number, attacker: Player): boolean {
    const cell = this.getCell(cellId);
    const defender = attacker === 1 ? 2 : 1;
    if (!cell || cell.owner !== defender) return false;
    const adjToAttacker = this.getNeighbours(cellId).some(
      (n) => this.getCell(n)?.owner === attacker,
    );
    return adjToAttacker;
  }

  // ── Question helpers ──────────────────────────────────────
  getRandomQuestion(): Question | null {
    const used = this.usedQuestionIds();
    const avail = QUESTIONS.filter((q) => !used.includes(q.id));
    if (avail.length === 0) return null;
    return avail[Math.floor(Math.random() * avail.length)];
  }

  getRandomNumericQuestion(): NumericQuestion | null {
    const used = this.usedNumericIds();
    const avail = NUMERIC_QUESTIONS.filter((q) => !used.includes(q.id));
    if (avail.length === 0) return null;
    return avail[Math.floor(Math.random() * avail.length)];
  }

  markQuestionUsed(id: number) {
    this.usedQuestionIds.set([...this.usedQuestionIds(), id]);
  }

  markNumericUsed(id: number) {
    this.usedNumericIds.set([...this.usedNumericIds(), id]);
  }

  // ── Capture phase actions ─────────────────────────────────
  startCaptureAttempt(cellId: number) {
    if (this.phase() !== 'capture') return;
    if (!this.canCapture(cellId, this.currentPlayer())) return;
    const q = this.getRandomQuestion();
    if (!q) return;
    this.captureQuestion.set(q);
    this.pendingCellId.set(cellId);
    this.modalMode.set('capture');
  }

  resolveCaptureAnswer(answerIndex: number) {
    const q = this.captureQuestion();
    const cellId = this.pendingCellId();
    if (!q || cellId === null) return;

    this.markQuestionUsed(q.id);
    const correct = answerIndex === q.correctIndex;

    if (correct) {
      this.setCellOwner(cellId, this.currentPlayer());
      // Check if all cells captured
      if (this.emptyCells().length === 0) {
        this.phase.set('attack');
      }
    }

    this.captureQuestion.set(null);
    this.pendingCellId.set(null);
    this.modalMode.set(null);
    this.switchTurn();
  }

  private setCellOwner(cellId: number, owner: Player, isCapital = false) {
    this.cells.update((cells) =>
      cells.map((c) =>
        c.id === cellId ? { ...c, owner, isCapital: isCapital || c.isCapital } : c,
      ),
    );
  }

  /** First-move capital selection */
  selectCapital(cellId: number) {
    const player = this.currentPlayer();
    const owned = this.cells().filter((c) => c.owner === player);
    if (owned.length !== 0) return; // already has capital
    const q = this.getRandomQuestion();
    if (!q) return;
    this.captureQuestion.set(q);
    this.pendingCellId.set(cellId);
    this.modalMode.set('capture');
  }

  resolveCapitalSelection(answerIndex: number) {
    const q = this.captureQuestion();
    const cellId = this.pendingCellId();
    if (!q || cellId === null) return;
    this.markQuestionUsed(q.id);
    if (answerIndex === q.correctIndex) {
      // Mark as capital
      this.cells.update((cells) =>
        cells.map((c) =>
          c.id === cellId ? { ...c, owner: this.currentPlayer(), isCapital: true } : c,
        ),
      );
    }
    this.captureQuestion.set(null);
    this.pendingCellId.set(null);
    this.modalMode.set(null);
    this.switchTurn();
  }

  // ── Attack phase ──────────────────────────────────────────
  startAttack(targetCellId: number) {
    const attacker = this.currentPlayer();
    const defender: Player = attacker === 1 ? 2 : 1;
    const cell = this.getCell(targetCellId);
    if (!cell || cell.owner !== defender) return;

    if (cell.isCapital) {
      this.startCapitalAttack(targetCellId, attacker, defender);
      return;
    }

    const q = this.getRandomNumericQuestion();
    if (!q) return;
    this.markNumericUsed(q.id);

    this.attackState.set({
      attackerId: attacker,
      defenderId: defender,
      targetCellId,
      question: q,
      answer1: null,
      answer2: null,
      timer: 30,
      revealed: false,
    });
    this.modalMode.set('attack');
  }

  submitAttackAnswer(player: Player, answer: number) {
    const st = this.attackState();
    if (!st || st.revealed) return;

    const updated: AttackState = {
      ...st,
      answer1: player === 1 ? answer : st.answer1,
      answer2: player === 2 ? answer : st.answer2,
    };

    // Both answered or timer expired?
    if (updated.answer1 !== null && updated.answer2 !== null) {
      updated.revealed = true;
    }

    this.attackState.set(updated);

    if (updated.revealed) {
      setTimeout(() => this.resolveAttack(), 3000);
    }
  }

  forceRevealAttack() {
    const st = this.attackState();
    if (!st) return;
    this.attackState.set({ ...st, revealed: true });
    setTimeout(() => this.resolveAttack(), 3000);
  }

  private resolveAttack() {
    const st = this.attackState();
    if (!st) return;
    const correct = st.question.correctAnswer;
    const d1 = st.answer1 !== null ? Math.abs(st.answer1 - correct) : Infinity;
    const d2 = st.answer2 !== null ? Math.abs(st.answer2 - correct) : Infinity;

    if (d1 < d2) {
      // attacker (we always start attack from current player perspective)
      // but attacker could be p1 or p2, so use attackerId
      const winner: Player = st.attackerId;
      this.setCellOwner(st.targetCellId, winner);
    } else if (d2 < d1) {
      // defender wins — nothing changes
    }
    // equal → no change

    this.attackState.set(null);
    this.modalMode.set(null);
    this.checkGameOver();
    this.switchTurn();
  }

  // ── Capital attack (3-step) ───────────────────────────────
  private startCapitalAttack(cellId: number, attacker: Player, defender: Player) {
    const q = this.getRandomQuestion();
    if (!q) return;
    this.markQuestionUsed(q.id);
    this.capitalAttackState.set({
      attackerId: attacker,
      defenderId: defender,
      targetCellId: cellId,
      step: 1,
      attackerProgress: 0,
      currentQuestion: q,
      waitingForDefender: false,
      defenderAnswer: null,
      attackerAnswer: null,
    });
    this.modalMode.set('capture'); // reuse capture modal for steps 1&2
  }

  resolveCapitalStep(player: Player, answerIndex: number) {
    const st = this.capitalAttackState();
    if (!st) return;

    if (player === st.attackerId) {
      this.resolveCapitalAttackerAnswer(answerIndex);
    } else {
      this.resolveCapitalDefenderAnswer(answerIndex);
    }
  }

  private resolveCapitalAttackerAnswer(answerIndex: number) {
    const st = this.capitalAttackState();
    if (!st) return;
    const correct = answerIndex === st.currentQuestion.correctIndex;
    this.markQuestionUsed(st.currentQuestion.id);

    if (!correct) {
      // Failed — turn ends, come back from step attackerProgress (min 1)
      this.capitalAttackState.set(null);
      this.modalMode.set(null);
      this.switchTurn();
      return;
    }

    const newProgress = st.attackerProgress + 1;

    if (newProgress < 2) {
      // Steps 1 & 2 — just advance
      const q = this.getRandomQuestion();
      if (!q) return;
      this.markQuestionUsed(q.id);
      this.capitalAttackState.set({
        ...st,
        step: (st.step + 1) as 1 | 2 | 3,
        attackerProgress: newProgress,
        currentQuestion: q,
        attackerAnswer: null,
      });
    } else {
      // Step 3 — defender joins
      const q = this.getRandomNumericQuestion();
      if (!q) return;
      this.markNumericUsed(q.id);
      this.capitalAttackState.set({
        ...st,
        step: 3,
        attackerProgress: newProgress,
        currentQuestion: q as any,
        waitingForDefender: true,
        attackerAnswer: null,
        defenderAnswer: null,
      });
      this.modalMode.set('attack'); // numeric modal for step 3
    }
  }

  private resolveCapitalDefenderAnswer(answerIndex: number) {
    // step 3 numeric — both must answer; this called after attacker also answered
    // (we'll handle via attackState flow for step3, this path is fallback)
    this.capitalAttackState.set(null);
    this.modalMode.set(null);
    this.switchTurn();
  }

  // ── Utility ───────────────────────────────────────────────
  private switchTurn() {
    this.currentPlayer.update((p) => (p === 1 ? 2 : 1));
  }

  private checkGameOver() {
    const p1 = this.cells().filter((c) => c.owner === 1);
    const p2 = this.cells().filter((c) => c.owner === 2);
    if (p1.length === 0 || p2.length === 0) {
      this.phase.set('gameover');
    }
  }

  resetGame() {
    this.initGrid();
    this.currentPlayer.set(1);
    this.phase.set('capture');
    this.usedQuestionIds.set([]);
    this.usedNumericIds.set([]);
    this.modalMode.set(null);
    this.captureQuestion.set(null);
    this.pendingCellId.set(null);
    this.attackState.set(null);
    this.capitalAttackState.set(null);
  }
}
