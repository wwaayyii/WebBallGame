import * as THREE from 'three';
import { CONFIG } from '../config.js';
export class BallController {
  constructor(scene, physics) {
    const R = physics.RAPIER;
    this.body = physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(CONFIG.spawn.x, CONFIG.spawn.y, CONFIG.spawn.z).setLinearDamping(CONFIG.ball.linearDamping).setAngularDamping(CONFIG.ball.angularDamping).setCcdEnabled(true));
    physics.world.createCollider(R.ColliderDesc.ball(CONFIG.ball.radius).setDensity(CONFIG.ball.mass / (4 / 3 * Math.PI * CONFIG.ball.radius ** 3)).setFriction(CONFIG.ball.friction).setRestitution(.05), this.body);
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.ball.radius, 32, 20), new THREE.MeshStandardMaterial({ color: 0xb97842, roughness: .7, metalness: .03 }));
    this.mesh.castShadow = true; scene.add(this.mesh);
  }
  update(input, grounded) {
    const move = input.movement, length = Math.hypot(move.x, move.z);
    if (length) { const scale = CONFIG.ball.moveForce * (grounded ? 1 : CONFIG.ball.airControl) / length; this.body.addForce({ x: move.x * scale, y: 0, z: move.z * scale }, true); }
    const v = this.body.linvel(), horizontal = Math.hypot(v.x, v.z);
    if (horizontal > CONFIG.ball.maxSpeed) this.body.setLinvel({ x: v.x / horizontal * CONFIG.ball.maxSpeed, y: v.y, z: v.z / horizontal * CONFIG.ball.maxSpeed }, true);
  }
  sync() { const p=this.body.translation(), q=this.body.rotation(); this.mesh.position.set(p.x,p.y,p.z); this.mesh.quaternion.set(q.x,q.y,q.z,q.w); }
  teleport(p) { this.body.setTranslation(p, true); this.body.setLinvel({x:0,y:0,z:0}, true); this.body.setAngvel({x:0,y:0,z:0}, true); this.body.setRotation({x:0,y:0,z:0,w:1}, true); }
}
