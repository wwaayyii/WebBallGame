import * as THREE from 'three';

const PAD_STYLE = {
  wood: { color: 0xb97842, emissive: 0x4b1d08 },
  stone: { color: 0x777d83, emissive: 0x242a30 },
  paper: { color: 0xeee5ce, emissive: 0x635d50 }
};

export class TransformPad {
  constructor(scene, position, type) {
    this.position = position;
    this.type = type;
    this.radius = 1.05;
    this.inside = false;
    const style = PAD_STYLE[type];
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: style.color, emissive: style.emissive, emissiveIntensity: 0.65, roughness: 0.65 })
    );
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(this.radius * 0.72, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: style.color }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.065;
    this.mesh.add(ring);
  }

  update(ballPosition, onEnter) {
    const dx = ballPosition.x - this.position.x;
    const dz = ballPosition.z - this.position.z;
    const nowInside = dx * dx + dz * dz <= this.radius * this.radius && Math.abs(ballPosition.y - this.position.y) < 1.5;
    if (nowInside && !this.inside) onEnter(this.type);
    this.inside = nowInside;
  }
}
