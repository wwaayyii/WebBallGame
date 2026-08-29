export class StuckDetector {
  constructor() { this.reset(); }
  reset(position = null) { this.anchor = position ? { x: position.x, z: position.z } : null; this.stationaryTime = 0; this.stuck = false; }
  update({ state, movingInput, position, horizontalSpeed, dt, excluded = false }) {
    if (state !== 'PLAYING' || !movingInput || excluded) { this.reset(position); return false; }
    if (!this.anchor) this.anchor = { x: position.x, z: position.z };
    const displacement = Math.hypot(position.x - this.anchor.x, position.z - this.anchor.z);
    if (horizontalSpeed > .35 || displacement > .3) { this.reset(position); return false; }
    this.stationaryTime += dt;
    this.stuck = this.stationaryTime >= 1.7;
    return this.stuck;
  }
}
