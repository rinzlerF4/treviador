// src/app/question-modal/question-modal.ts
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, signal, SimpleChanges } from '@angular/core';
import { Question, NumericQuestion } from '../data/questions';

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
                    (input)="onP1Input($event)" [disabled]="p1Answered()" />
                  <button class="submit-btn p1-submit" (click)="submitAttack(1)">Ответить</button>
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
                    (input)="onP2Input($event)" [disabled]="p2Answered()" />
                  <button class="submit-btn p2-submit" (click)="submitAttack(2)">Ответить</button>
                }
              </div>
            </div>
          }

          <!-- ATTACK MODE: result phase -->
          @if (mode === 'attack' && revealed()) {
            <div class="result-panel">

              <!-- Number line visualization -->
              <div class="nl-section">
                <div class="nl-title">📍 Правильный ответ: <strong>{{ numericCorrect }} {{ numericUnit }}</strong></div>
                <div class="nl-container">
                  <div class="nl-track">
                    <!-- gradient fill from left to right -->
                    <div class="nl-fill"></div>

                    <!-- correct marker -->
                    <div class="nl-marker correct-marker" [style.left]="correctPercent() + '%'">
                      <div class="nl-stem correct-stem"></div>
                      <div class="nl-dot correct-dot"></div>
                      <div class="nl-tag correct-tag">{{ numericCorrect }}<br><span class="tag-sub">{{ numericUnit }}</span></div>
                    </div>

                    <!-- p1 marker -->
                    @if (p1Answer() !== null) {
                      <div class="nl-marker p1-marker-pos" [style.left]="p1Percent() + '%'">
                        <div class="nl-stem p1-stem"></div>
                        <div class="nl-dot p1-dot"></div>
                        <div class="nl-tag p1-tag">{{ p1Answer() }}<br><span class="tag-sub">Игрок 1</span></div>
                      </div>
                    }

                    <!-- p2 marker -->
                    @if (p2Answer() !== null) {
                      <div class="nl-marker p2-marker-pos" [style.left]="p2Percent() + '%'">
                        <div class="nl-stem p2-stem"></div>
                        <div class="nl-dot p2-dot"></div>
                        <div class="nl-tag p2-tag">{{ p2Answer() }}<br><span class="tag-sub">Игрок 2</span></div>
                      </div>
                    }
                  </div>

                  <!-- axis labels -->
                  <div class="nl-axis">
                    <span>{{ lineMin() }}</span>
                    <span>{{ lineMax() }}</span>
                  </div>
                </div>
              </div>

              <!-- Score cards -->
              <div class="score-cards">
                <div class="score-card" [class.winner-card]="attackWinner() === 'p1'">
                  <div class="sc-player p1-color">🔵 Игрок 1</div>
                  <div class="sc-answer">{{ p1Answer() ?? '—' }} {{ numericUnit }}</div>
                  <div class="sc-delta">Δ {{ p1Delta() }}</div>
                  @if (attackWinner() === 'p1') { <div class="sc-crown">👑 Ближе!</div> }
                </div>
                <div class="sc-vs">VS</div>
                <div class="score-card" [class.winner-card]="attackWinner() === 'p2'">
                  <div class="sc-player p2-color">🔴 Игрок 2</div>
                  <div class="sc-answer">{{ p2Answer() ?? '—' }} {{ numericUnit }}</div>
                  <div class="sc-delta">Δ {{ p2Delta() }}</div>
                  @if (attackWinner() === 'p2') { <div class="sc-crown">👑 Ближе!</div> }
                </div>
              </div>

              <!-- Result text -->
              <div class="result-verdict">
                @if (attackWinner() === 'draw') {
                  🤝 Ничья — клетка остаётся у защитника
                } @else {
                  {{ attackWinner() === 'p1' ? '🔵 Игрок 1' : '🔴 Игрок 2' }} захватывает клетку!
                }
              </div>

              <!-- Both players must confirm to close -->
              <div class="confirm-row">
                <button class="confirm-btn p1-confirm" [class.confirmed]="p1Confirmed()" (click)="confirm(1)">
                  {{ p1Confirmed() ? '✓ Игрок 1 готов' : '🔵 Игрок 1 — Продолжить' }}
                </button>
                <button class="confirm-btn p2-confirm" [class.confirmed]="p2Confirmed()" (click)="confirm(2)">
                  {{ p2Confirmed() ? '✓ Игрок 2 готов' : '🔴 Игрок 2 — Продолжить' }}
                </button>
              </div>
              @if (!p1Confirmed() || !p2Confirmed()) {
                <div class="confirm-hint">Оба игрока должны нажать кнопку</div>
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
      gap: 18px;
      animation: fade-in 0.4s ease;
    }
    @keyframes fade-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

    /* Number line */
    .nl-section { }
    .nl-title {
      font-size: 14px;
      text-align: center;
      color: #aaa;
      margin-bottom: 14px;
    }
    .nl-title strong { color: #ffd700; }

    .nl-container { padding: 0 8px; }

    .nl-track {
      position: relative;
      height: 56px;
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 4px;
    }

    .nl-fill {
      position: absolute;
      inset: 0;
      border-radius: 6px;
      background: linear-gradient(90deg,
        rgba(192,57,43,0.15) 0%,
        rgba(255,215,0,0.08) 50%,
        rgba(26,86,219,0.15) 100%);
    }

    .nl-marker {
      position: absolute;
      top: 0; bottom: 0;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 4px;
    }

    .nl-stem {
      position: absolute;
      top: 0; bottom: 0;
      width: 2px;
    }
    .correct-stem { background: #ffd700; }
    .p1-stem      { background: #6ea8ff; }
    .p2-stem      { background: #ff7070; }

    .nl-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      position: absolute;
      top: 50%; transform: translateY(-50%);
    }
    .correct-dot { background: #ffd700; box-shadow: 0 0 8px #ffd700; width: 12px; height: 12px; }
    .p1-dot      { background: #6ea8ff; box-shadow: 0 0 6px #6ea8ff; }
    .p2-dot      { background: #ff7070; box-shadow: 0 0 6px #ff7070; }

    .nl-tag {
      position: absolute;
      top: 4px;
      font-size: 9px;
      line-height: 1.3;
      text-align: center;
      white-space: nowrap;
      padding: 2px 5px;
      border-radius: 4px;
      font-weight: 700;
    }
    .correct-tag { color: #ffd700; background: rgba(255,215,0,0.15); }
    .p1-tag      { color: #6ea8ff; background: rgba(110,168,255,0.12); }
    .p2-tag      { color: #ff7070; background: rgba(255,112,112,0.12); }
    .tag-sub     { font-weight: 400; opacity: 0.7; }

    .nl-axis {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      padding: 0 4px;
      margin-top: 2px;
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
  @Input() visible: boolean = false;
  @Input() mode: ModalMode = 'capture';
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
  p1Answered  = signal(false);
  p2Answered  = signal(false);
  p1Answer    = signal<number | null>(null);
  p2Answer    = signal<number | null>(null);
  revealed    = signal(false);
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
    this.p1Confirmed.set(false); this.p2Confirmed.set(false);
    this.stopTimer();
  }

  private resetAll() {
    this.selectedIndex = null;
    this.resetAttack();
  }

  // ── Number line ───────────────────────────────────────────
  lineMin = () => {
    const vals = [this.numericCorrect, this.p1Answer(), this.p2Answer()].filter(v => v !== null) as number[];
    if (vals.length === 0) return 0;
    const spread = Math.max(...vals) - Math.min(...vals);
    return Math.min(...vals) - Math.ceil(spread * 0.15 + 1);
  };
  lineMax = () => {
    const vals = [this.numericCorrect, this.p1Answer(), this.p2Answer()].filter(v => v !== null) as number[];
    if (vals.length === 0) return 100;
    const spread = Math.max(...vals) - Math.min(...vals);
    return Math.max(...vals) + Math.ceil(spread * 0.15 + 1);
  };

  private toPercent(val: number): number {
    const min = this.lineMin(), max = this.lineMax();
    if (min === max) return 50;
    return Math.round(((val - min) / (max - min)) * 80 + 10);
  }

  correctPercent = () => this.toPercent(this.numericCorrect);
  p1Percent      = () => this.p1Answer() !== null ? this.toPercent(this.p1Answer()!) : 0;
  p2Percent      = () => this.p2Answer() !== null ? this.toPercent(this.p2Answer()!) : 0;

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
