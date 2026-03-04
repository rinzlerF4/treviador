import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common'; // ← добавь
import { Question } from '../data/questions';

@Component({
  selector: 'app-question-modal',
  imports: [NgIf, NgFor], // ← добавь
  templateUrl: './question-modal.html',
  styleUrl: './question-modal.css',
})
export class QuestionModal {
  @Input() question: Question | null = null;
  @Input() visible: boolean = false;
  @Output() answer = new EventEmitter<number>();

  selectOption(index: number) {
    this.answer.emit(index);
  }
}
