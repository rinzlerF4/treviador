import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameGrid } from './game-grid/game-grid';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GameGrid],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('triviador');
}
