import * as THREE from 'three';
export class Checkpoint {
  constructor(scene, position) {
    this.position = position; this.active = false;
    this.mesh = new THREE.Mesh(new THREE.TorusGeometry(1.3,.12,12,32), new THREE.MeshStandardMaterial({ color:0x47a9ff, emissive:0x0a3155, emissiveIntensity:1 }));
    this.mesh.position.set(position.x, position.y + 1.25, position.z); scene.add(this.mesh);
  }
  check(p) { if (!this.active && Math.hypot(p.x-this.position.x,p.z-this.position.z)<1.6 && Math.abs(p.y-this.position.y)<2) { this.active=true; this.mesh.material.color.set(0x58ff9a); this.mesh.material.emissive.set(0x19c86a); this.mesh.material.emissiveIntensity=2.2; return true; } return false; }
}
