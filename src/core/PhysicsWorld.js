import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../config.js';
export class PhysicsWorld {
  async init() { await RAPIER.init(); this.RAPIER = RAPIER; this.world = new RAPIER.World({ x: 0, y: CONFIG.gravity, z: 0 }); }
  step() { this.world.timestep = CONFIG.fixedTimeStep; this.world.step(); }
}
