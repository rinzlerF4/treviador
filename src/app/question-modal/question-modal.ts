import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../data/questions';

@Component({
  selector: 'app-question-modal',
  templateUrl: './question-modal.html',
  styleUrl: './question-modal.css',
})
export class QuestionModal {
  @Input() question: Question | null = null;
  @Input() visible: boolean = false;
  @Output() answer = new EventEmitter<number>();

  selectedIndex: number | null = null;
  isCorrect: boolean | null = null;

  selectOption(index: number) {
    if (this.selectedIndex !== null) return; // не дать кликнуть дважды

    this.selectedIndex = index;
    this.isCorrect = index === this.question?.correctIndex;

    // Ждём анимацию, потом эмитим
    setTimeout(() => {
      this.answer.emit(index);
      this.selectedIndex = null;
      this.isCorrect = null;
    }, 1000);
  }

  getButtonClass(index: number): string {
    if (this.selectedIndex === null) return '';
    if (index === this.question?.correctIndex) return 'correct';
    if (index === this.selectedIndex) return 'wrong';
    return '';
  }
}
