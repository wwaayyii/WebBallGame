import { CONFIG } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.keys = new Set();
    this.cameraDrag = { x: 0, y: 0 };
    this.resetViewRequested = false;
    this.dragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.onDown = (e) => {
      if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyR'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyR' && !e.repeat && !this.keys.has(e.code)) this.resetViewRequested = true;
      if (this.keys.has(e.code)) return;
      this.keys.add(e.code);
      this.log('keydown', e.code);
    };
    this.onUp = (e) => {
      if (!this.keys.delete(e.code)) return;
      this.log('keyup', e.code);
    };
    this.onBlur = () => {
      this.keys.clear();
      this.endDrag();
      if (CONFIG.debugPhysics) console.debug('[InputDebug] blur-clear');
    };
    this.onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.dragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      document.body.classList.add('camera-dragging');
    };
    this.onMouseMove = (e) => {
      if (!this.dragging) return;
      this.cameraDrag.x += e.clientX - this.lastPointer.x;
      this.cameraDrag.y += e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    this.endDrag = () => {
      this.dragging = false;
      document.body.classList.remove('camera-dragging');
    };
    this.onWindowOut = (e) => { if (!e.relatedTarget) this.endDrag(); };
    addEventListener('keydown', this.onDown); addEventListener('keyup', this.onUp); addEventListener('blur', this.onBlur);
    canvas.addEventListener('mousedown', this.onMouseDown);
    addEventListener('mousemove', this.onMouseMove);
    addEventListener('mouseup', this.endDrag);
    addEventListener('mouseout', this.onWindowOut);
  }
  get movement() { return { x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0), z: (this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('KeyW') ? 1 : 0) }; }
  get cameraYaw() { return (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0); }
  consumeCameraDrag() { const drag = { ...this.cameraDrag }; this.cameraDrag.x = 0; this.cameraDrag.y = 0; return drag; }
  consumeResetView() { const requested = this.resetViewRequested; this.resetViewRequested = false; return requested; }
  log(event, code) { if (!CONFIG.debugPhysics) return; const movement=this.movement; console.debug(`[InputDebug] ${event}`, { code, keys:[...this.keys], inputX:movement.x, inputZ:movement.z }); }
}
