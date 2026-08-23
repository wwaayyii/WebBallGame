import * as THREE from 'three';
export class FollowCamera {
  constructor(camera) { this.camera = camera; this.offset = new THREE.Vector3(0, 6.4, 10); this.target = new THREE.Vector3(); }
  snap(position) { this.target.copy(position); this.camera.position.copy(position).add(this.offset); this.camera.lookAt(position); }
  update(position, dt) {
    const alpha = 1 - Math.exp(-5 * dt);
    this.target.lerp(position, alpha); this.camera.position.lerp(position.clone().add(this.offset), alpha);
    this.camera.lookAt(this.target.clone().add(new THREE.Vector3(0, .35, -1.5)));
  }
}
