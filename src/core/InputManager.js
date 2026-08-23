import { CONFIG } from '../config.js';

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.onDown = (e) => {
      if (['KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault();
      if (this.keys.has(e.code)) return;
      this.keys.add(e.code);
      this.log('keydown', e.code);
    };
    this.onUp = (e) => {
      if (!this.keys.delete(e.code)) return;
      this.log('keyup', e.code);
    };
    this.onBlur = () => {
      if (!this.keys.size) return;
      this.keys.clear();
      if (CONFIG.debugPhysics) console.debug('[InputDebug] blur-clear');
    };
    addEventListener('keydown', this.onDown); addEventListener('keyup', this.onUp); addEventListener('blur', this.onBlur);
  }
  get movement() { return { x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0), z: (this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('KeyW') ? 1 : 0) }; }
  log(event, code) { if (!CONFIG.debugPhysics) return; const movement=this.movement; console.debug(`[InputDebug] ${event}`, { code, keys:[...this.keys], inputX:movement.x, inputZ:movement.z }); }
}
