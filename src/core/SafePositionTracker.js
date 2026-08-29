import { CONFIG } from '../config.js';

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };

/** Records only stable, verified positions on roomy, fixed ground. */
export class SafePositionTracker {
  constructor(physics, ball, initialPosition = CONFIG.spawn) {
    this.physics = physics;
    this.ball = ball;
    this.lastSafePosition = { ...initialPosition };
    this.candidate = null;
    this.candidateTime = 0;
    this.requiredStableTime = 0.4;
  }
  update({ state, ground, inWindZone, dt }) {
    const position = this.ball.body.translation();
    const velocity = this.ball.body.linvel();
    const stable = Math.hypot(velocity.x, velocity.z) < 0.8 && Math.abs(velocity.y) < 0.45;
    if (state !== 'PLAYING' || !ground || ground.normalY < 0.88 || !ground.fixed || inWindZone
      || position.y < CONFIG.respawnHeight || !stable || !this.hasReliableGround(position)
      || !this.hasSpawnClearance(position)) {
      this.resetCandidate(); return false;
    }
    if (!this.candidate || this.horizontalDistance(this.candidate, position) > 0.18) {
      this.candidate = { x: position.x, y: position.y, z: position.z };
      this.candidateTime = 0; return false;
    }
    this.candidateTime += dt;
    if (this.candidateTime < this.requiredStableTime) return false;
    this.lastSafePosition = { x: position.x, y: position.y, z: position.z };
    return true;
  }
  hasReliableGround(position) {
    const R = this.physics.RAPIER;
    const offsets = [[0, 0], [.42, 0], [-.42, 0], [0, .42], [0, -.42]];
    let height = null;
    for (const [x, z] of offsets) {
      const ray = new R.Ray({ x: position.x + x, y: position.y, z: position.z + z }, { x: 0, y: -1, z: 0 });
      const hit = this.physics.world.castRayAndGetNormal(ray, CONFIG.ball.radius + .28, true,
        undefined, undefined, this.ball.collider, this.ball.body);
      if (!hit || hit.normal.y < .88 || !hit.collider.parent()?.isFixed()) return false;
      const groundHeight = position.y - hit.timeOfImpact;
      if (height !== null && Math.abs(height - groundHeight) > .16) return false;
      height = groundHeight;
    }
    return true;
  }
  hasSpawnClearance(position) {
    const R = this.physics.RAPIER;
    const lifted = { x: position.x, y: position.y + .08, z: position.z };
    const shape = new R.Ball(CONFIG.ball.radius * .96);
    return !this.physics.world.intersectionWithShape(lifted, IDENTITY, shape,
      undefined, undefined, this.ball.collider, this.ball.body, collider => {
        const parent = collider.parent();
        if (!parent?.isFixed()) return true;
        const center = collider.translation();
        return center.y > lifted.y - CONFIG.ball.radius;
      });
  }
  resetCandidate() { this.candidate = null; this.candidateTime = 0; }
  horizontalDistance(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
  get position() { return { ...this.lastSafePosition }; }
}
