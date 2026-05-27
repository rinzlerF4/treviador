import { Component } from '@angular/core';
import { GameGrid } from './game-grid/game-grid';

@Component({
  selector: 'app-root',
  imports: [GameGrid],
  template: '<app-game-grid></app-game-grid>',
  styles: [`:host { display: block; }`],
})
export class App {}
