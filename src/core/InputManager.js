export class InputManager {
  constructor() {
    this.keys = new Set();
    this.onDown = (e) => { if (['KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault(); this.keys.add(e.code); };
    this.onUp = (e) => this.keys.delete(e.code);
    addEventListener('keydown', this.onDown); addEventListener('keyup', this.onUp); addEventListener('blur', () => this.keys.clear());
  }
  get movement() { return { x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0), z: (this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('KeyW') ? 1 : 0) }; }
}
