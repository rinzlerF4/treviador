// src/app/question-modal/question-modal.ts
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, signal, SimpleChanges, inject, computed } from '@angular/core';
import { Question, NumericQuestion } from '../data/questions';
import { GameStateService } from '../game-state/game-state.service';
export type ModalMode = 'capture' | 'attack';

@Component({
  selector: 'app-question-modal',
  imports: [],
  template: `
    @if (visible) {
      <div class="modal-backdrop">
        <div class="modal" [class.attack-mode]="mode === 'attack'">

          <!-- Header -->
          <div class="modal-header">
            <div class="player-badge" [class.p1]="activePlayer === 1" [class.p2]="activePlayer === 2">
              {{ activePlayer === 1 ? '🔵 Игрок 1' : '🔴 Игрок 2' }}
            </div>
            @if (mode === 'attack') {
              <div class="phase-badge">⚔️ Атака</div>
            } @else if (capitalStep) {
              <div class="phase-badge capital-phase">★ Столица — шаг {{ capitalStep }}/3</div>
            } @else {
              <div class="phase-badge">🗺️ Захват</div>
            }
          </div>

          <!-- Question -->
          <h3 class="question-text">{{ questionText }}</h3>

          <!-- CAPTURE MODE -->
          @if (mode === 'capture') {
            <ul class="options-list">
              @for (opt of captureOptions; track $index) {
                <li>
                  <button
                    class="option-btn"
                    [class.correct]="selectedIndex !== null && $index === correctIndex"
                    [class.wrong]="selectedIndex === $index && $index !== correctIndex"
                    [class.disabled]="selectedIndex !== null"
                    (click)="selectCapture($index)"
                  >{{ opt }}</button>
                </li>
              }
            </ul>
          }

          <!-- ATTACK MODE: input phase -->
          @if (mode === 'attack' && !revealed()) {
            <div class="attack-layout">
              <!-- P1 -->
              <div class="answer-box p1-box" [class.answered]="p1Answered()">
                <div class="player-label">🔵 Игрок 1</div>
                @if (p1Answered()) {
                  <div class="answered-check">✓ Готово</div>
                } @else {
                  <input class="num-input" type="number" placeholder="Ваш ответ"
                    (input)="onP1Input($event)" [disabled]="gs.pusher.myPlayerNumber() !== 1" />
                  <button class="submit-btn p1-submit" (click)="submitAttack(1)" [disabled]="gs.pusher.myPlayerNumber() !== 1">Ответить</button>
                }
              </div>
              <!-- Timer -->
              <div class="timer-circle" [class.urgent]="timer() <= 10">
                <span class="timer-num">{{ timer() }}</span>
                <span class="timer-label">сек</span>
              </div>

              <!-- P2 -->
              <div class="answer-box p2-box" [class.answered]="p2Answered()">
                <div class="player-label">🔴 Игрок 2</div>
                @if (p2Answered()) {
                  <div class="answered-check">✓ Готово</div>
                } @else {
                  <input class="num-input" type="number" placeholder="Ваш ответ"
                    (input)="onP2Input($event)" [disabled]="gs.pusher.myPlayerNumber() !== 2" />
                  <button class="submit-btn p2-submit" (click)="submitAttack(2)" [disabled]="gs.pusher.myPlayerNumber() !== 2">Ответить</button>
                }
              </div>            </div>
          }

          <!-- ATTACK MODE: result phase -->
          @if (mode === 'attack' && revealed()) {
            <div class="result-panel">

              <!-- Vertical Bars Visualization -->
              <div class="bars-container">
                <div class="bar-wrapper p1-bar">
                  <div class="bar-value">{{ p1Answer() }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="p1BarHeight()"></div>
                  </div>
                  <div class="bar-label">Игрок 1</div>
                </div>

                <div class="bar-wrapper correct-bar" [class.visible]="showCorrect()">
                  <div class="bar-value">{{ numericCorrect }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="correctBarHeight()"></div>
                  </div>
                  <div class="bar-label">Верно</div>
                </div>

                <div class="bar-wrapper p2-bar">
                  <div class="bar-value">{{ p2Answer() }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="p2BarHeight()"></div>
                  </div>
                  <div class="bar-label">Игрок 2</div>
                </div>
              </div>

              <!-- Score cards (shown after correct answer) -->
              @if (showCorrect()) {
                <div class="score-cards">
                  <div class="score-card" [class.winner-card]="attackWinner() === 'p1'">
                    <div class="sc-player p1-color">🔵 Игрок 1</div>
                    <div class="sc-delta">Δ {{ p1Delta() }}</div>
                    @if (attackWinner() === 'p1') { <div class="sc-crown">👑 Ближе!</div> }
                  </div>
                  <div class="sc-vs">VS</div>
                  <div class="score-card" [class.winner-card]="attackWinner() === 'p2'">
                    <div class="sc-player p2-color">🔴 Игрок 2</div>
                    <div class="sc-delta">Δ {{ p2Delta() }}</div>
                    @if (attackWinner() === 'p2') { <div class="sc-crown">👑 Ближе!</div> }
                  </div>
                </div>

                <div class="result-verdict">
                  @if (attackWinner() === 'draw') {
                    🤝 Ничья — клетка остаётся у защитника
                  } @else {
                    {{ attackWinner() === 'p1' ? '🔵 Игрок 1' : '🔴 Игрок 2' }} захватывает клетку!
                  }
                </div>

                <div class="confirm-row">
                  <button class="confirm-btn p1-confirm" [class.confirmed]="p1Confirmed()" (click)="confirm(1)" [disabled]="gs.pusher.myPlayerNumber() !== 1">
                    {{ p1Confirmed() ? '✓ Игрок 1 готов' : '🔵 Игрок 1 — Продолжить' }}
                  </button>
                  <button class="confirm-btn p2-confirm" [class.confirmed]="p2Confirmed()" (click)="confirm(2)" [disabled]="gs.pusher.myPlayerNumber() !== 2">
                    {{ p2Confirmed() ? '✓ Игрок 2 готов' : '🔴 Игрок 2 — Продолжить' }}
                  </button>
                </div>              } @else {
                <div class="result-loading">Сравнение результатов...</div>
              }
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal {
      background: #161b27;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 28px 32px;
      max-width: 500px;
      width: 100%;
      color: #e8eaf0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7);
      animation: modal-in 0.2s ease;
    }
    @keyframes modal-in {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal.attack-mode { max-width: 620px; }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .player-badge {
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
    }
    .player-badge.p1 { background: rgba(26,86,219,0.25); border: 1px solid #3b6fd4; }
    .player-badge.p2 { background: rgba(192,57,43,0.25); border: 1px solid #c0392b; }

    .phase-badge {
      margin-left: auto;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      background: rgba(255,255,255,0.07);
      color: #aaa;
    }
    .capital-phase { border: 1px solid #ffd700; color: #ffd700; background: rgba(255,215,0,0.1); }

    .question-text {
      font-size: 19px;
      font-weight: 700;
      margin: 0 0 22px;
      line-height: 1.45;
      text-align: center;
      color: #fff;
    }

    /* ── Capture options ── */
    .options-list {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .option-btn {
      width: 100%;
      padding: 13px 18px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      color: #e0e0e0;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .option-btn:hover:not(.disabled) {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.35);
      color: #fff;
    }
    .option-btn.correct { background: #1b5e20; border-color: #4caf50; color: #a5d6a7; }
    .option-btn.wrong   { animation: wrong-flash 0.85s ease forwards; }
    .option-btn.disabled { cursor: not-allowed; }
    @keyframes wrong-flash {
      0%   { background: rgba(255,255,255,0.04); }
      30%  { background: #c62828; color: #fff; border-color: #ef5350; }
      100% { background: rgba(180,30,30,0.3); border-color: #e53935; color: #ef9a9a; }
    }

    /* ── Attack input phase ── */
    .attack-layout {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .answer-box {
      flex: 1;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      min-height: 130px;
      justify-content: center;
      transition: all 0.3s;
    }
    .p1-box { border-color: rgba(59,111,212,0.5); background: rgba(26,86,219,0.07); }
    .p2-box { border-color: rgba(192,57,43,0.5);  background: rgba(192,57,43,0.07); }
    .answer-box.answered { opacity: 0.65; }

    .player-label { font-size: 13px; font-weight: 700; }
    .answered-check { font-size: 15px; color: #81c784; font-weight: 600; }

    .num-input {
      width: 100%;
      padding: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      color: #fff;
      font-size: 20px;
      text-align: center;
      font-weight: 700;
    }
    .num-input:focus { outline: none; border-color: rgba(255,255,255,0.45); }
    .num-input::-webkit-inner-spin-button { display: none; }

    .submit-btn {
      width: 100%;
      padding: 9px 0;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.2s;
    }
    .p1-submit { background: #1a56db; color: #fff; }
    .p2-submit { background: #c0392b; color: #fff; }
    .submit-btn:hover { filter: brightness(1.15); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Timer */
    .timer-circle {
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.18);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .timer-circle.urgent { border-color: #ef5350; animation: tpulse 0.6s infinite; }
    @keyframes tpulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(239,83,80,0.5); }
      50%     { box-shadow: 0 0 0 10px rgba(239,83,80,0); }
    }
    .timer-num  { font-size: 22px; font-weight: 800; line-height: 1; }
    .timer-label { font-size: 9px; opacity: 0.45; }

    /* ── Result panel ── */
    .result-panel {
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fade-in 0.4s ease;
    }

    .bars-container {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 200px;
      padding: 20px 0;
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      gap: 10px;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
    }

    .bar-track {
      flex: 1;
      width: 40px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .bar-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      transition: height 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
    }

    .p1-bar .bar-fill { background: linear-gradient(to top, #1a56db, #6ea8ff); }
    .p2-bar .bar-fill { background: linear-gradient(to top, #c0392b, #ff7070); }
    .correct-bar .bar-fill { background: linear-gradient(to top, #f59e0b, #ffd700); }

    .correct-bar {
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.5s ease;
    }
    .correct-bar.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .bar-value {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }
    .bar-label {
      font-size: 11px;
      color: #888;
      font-weight: 600;
    }

    .result-loading {
      text-align: center;
      font-style: italic;
      color: #666;
    }

    /* Score cards */
    .score-cards {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .score-card {
      flex: 1;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      transition: all 0.3s;
    }
    .score-card.winner-card {
      border-color: rgba(255,215,0,0.5);
      background: rgba(255,215,0,0.06);
      box-shadow: 0 0 16px rgba(255,215,0,0.1);
    }

    .sc-vs { font-size: 12px; color: #555; font-weight: 700; flex-shrink: 0; }
    .sc-player  { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .sc-answer  { font-size: 22px; font-weight: 800; color: #fff; }
    .sc-delta   { font-size: 12px; color: #888; margin-top: 2px; }
    .sc-crown   { margin-top: 6px; font-size: 13px; color: #ffd700; font-weight: 700; }

    .p1-color { color: #6ea8ff; }
    .p2-color { color: #ff7070; }

    /* Result verdict */
    .result-verdict {
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      padding: 10px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }

    /* Confirm buttons */
    .confirm-row {
      display: flex;
      gap: 10px;
    }

    .confirm-btn {
      flex: 1;
      padding: 12px;
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .p1-confirm {
      background: rgba(26,86,219,0.2);
      border-color: #1a56db;
      color: #6ea8ff;
    }
    .p2-confirm {
      background: rgba(192,57,43,0.2);
      border-color: #c0392b;
      color: #ff7070;
    }
    .confirm-btn.confirmed {
      opacity: 0.5;
      cursor: default;
    }
    .p1-confirm:not(.confirmed):hover { background: rgba(26,86,219,0.35); }
    .p2-confirm:not(.confirmed):hover { background: rgba(192,57,43,0.35); }

    .confirm-hint {
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      margin-top: -8px;
    }
  `],
})
export class QuestionModal implements OnChanges, OnDestroy {
  gs = inject(GameStateService);

  @Input() visible: boolean = false;  @Input() mode: ModalMode = 'capture';
  @Input() activePlayer: 1 | 2 = 1;
  @Input() capitalStep: number | null = null;
  @Input() captureQuestion: Question | null = null;
  @Input() attackQuestion: NumericQuestion | null = null;

  @Output() captureAnswer = new EventEmitter<number>();
  @Output() attackAnswer  = new EventEmitter<{ player: 1|2; value: number }>();
  @Output() attackClose   = new EventEmitter<void>(); // both confirmed

  // Capture
  selectedIndex: number | null = null;

  // Attack inputs
  p1InputVal  = signal('');
  p2InputVal  = signal('');
  p1Answered  = computed(() => this.gs.attackState()?.answer1 !== null);
  p2Answered  = computed(() => this.gs.attackState()?.answer2 !== null);
  p1Answer    = computed(() => this.gs.attackState()?.answer1 ?? null);
  p2Answer    = computed(() => this.gs.attackState()?.answer2 ?? null);
  revealed    = computed(() => this.gs.attackState()?.revealed ?? false);
  showCorrect = signal(false);
  timer       = signal(30);
  // Confirm to close
  p1Confirmed = signal(false);
  p2Confirmed = signal(false);

  private timerInterval: any = null;

  get questionText()    { return this.mode === 'capture' ? (this.captureQuestion?.text ?? '') : (this.attackQuestion?.text ?? ''); }
  get captureOptions()  { return this.captureQuestion?.options ?? []; }
  get correctIndex()    { return this.captureQuestion?.correctIndex ?? -1; }
  get numericCorrect()  { return this.attackQuestion?.correctAnswer ?? 0; }
  get numericUnit()     { return this.attackQuestion?.unit ?? ''; }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']) {
      if (this.visible && this.mode === 'attack') {
        this.resetAttack();
        this.startTimer();
      }
      if (!this.visible) {
        this.resetAll();
      }
    }
    // if mode changes while visible
    if (changes['mode'] && this.visible && this.mode === 'attack') {
      this.resetAttack();
      this.startTimer();
    }
  }

  ngOnDestroy() { this.stopTimer(); }

  // ── Capture ───────────────────────────────────────────────
  selectCapture(index: number) {
    if (this.selectedIndex !== null) return;
    this.selectedIndex = index;
    setTimeout(() => {
      this.captureAnswer.emit(index);
      this.selectedIndex = null;
    }, 900);
  }

  // ── Attack ────────────────────────────────────────────────
  onP1Input(ev: Event) { this.p1InputVal.set((ev.target as HTMLInputElement).value); }
  onP2Input(ev: Event) { this.p2InputVal.set((ev.target as HTMLInputElement).value); }

  submitAttack(player: 1 | 2) {
    if (player === 1 && !this.p1Answered()) {
      const val = parseFloat(this.p1InputVal());
      if (isNaN(val)) return;
      this.p1Answer.set(val);
      this.p1Answered.set(true);
      this.attackAnswer.emit({ player: 1, value: val });
    }
    if (player === 2 && !this.p2Answered()) {
      const val = parseFloat(this.p2InputVal());
      if (isNaN(val)) return;
      this.p2Answer.set(val);
      this.p2Answered.set(true);
      this.attackAnswer.emit({ player: 2, value: val });
    }
    if (this.p1Answered() && this.p2Answered()) {
      this.stopTimer();
      this.revealed.set(true);
      setTimeout(() => this.showCorrect.set(true), 1500);
    }
  }

  confirm(player: 1 | 2) {
    if (player === 1) this.p1Confirmed.set(true);
    if (player === 2) this.p2Confirmed.set(true);
    if (this.p1Confirmed() && this.p2Confirmed()) {
      this.attackClose.emit();
    }
  }

  private startTimer() {
    this.timer.set(30);
    this.timerInterval = setInterval(() => {
      const t = this.timer() - 1;
      this.timer.set(t);
      if (t <= 0) {
        this.stopTimer();
        this.revealed.set(true);
        setTimeout(() => this.showCorrect.set(true), 1500);
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private resetAttack() {
    this.p1InputVal.set(''); this.p2InputVal.set('');
    this.p1Answered.set(false); this.p2Answered.set(false);
    this.p1Answer.set(null); this.p2Answer.set(null);
    this.revealed.set(false);
    this.showCorrect.set(false);
    this.p1Confirmed.set(false); this.p2Confirmed.set(false);
    this.stopTimer();
  }

  private resetAll() {
    this.selectedIndex = null;
    this.resetAttack();
  }

  // ── Bar heights ───────────────────────────────────────────
  private getMaxValue() {
    const vals = [this.numericCorrect, this.p1Answer(), this.p2Answer()].filter(v => v !== null) as number[];
    return Math.max(...vals, 1); // avoid div by zero
  }

  p1BarHeight      = () => this.p1Answer() !== null ? (this.p1Answer()! / this.getMaxValue()) * 100 : 0;
  p2BarHeight      = () => this.p2Answer() !== null ? (this.p2Answer()! / this.getMaxValue()) * 100 : 0;
  correctBarHeight = () => (this.numericCorrect / this.getMaxValue()) * 100;

  p1Delta = () => this.p1Answer() !== null ? Math.abs(this.p1Answer()! - this.numericCorrect) : '—';
  p2Delta = () => this.p2Answer() !== null ? Math.abs(this.p2Answer()! - this.numericCorrect) : '—';

  attackWinner = (): 'p1' | 'p2' | 'draw' => {
    const d1 = this.p1Answer() !== null ? Math.abs(this.p1Answer()! - this.numericCorrect) : Infinity;
    const d2 = this.p2Answer() !== null ? Math.abs(this.p2Answer()! - this.numericCorrect) : Infinity;
    if (d1 < d2) return 'p1';
    if (d2 < d1) return 'p2';
    return 'draw';
  };
}
