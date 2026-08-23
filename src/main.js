import './style.css';
import { Game } from './core/Game.js';

const game = new Game(document.querySelector('#app'));
game.start().catch((error) => {
  console.error(error);
  document.querySelector('#app').textContent = `Unable to start: ${error.message}`;
});
