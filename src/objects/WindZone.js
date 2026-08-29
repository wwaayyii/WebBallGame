import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class WindZone {
  constructor(scene, options = CONFIG.windZone) {
    this.options = options;
    this.center = new THREE.Vector3(options.bounds.center.x, options.bounds.center.y, options.bounds.center.z);
    this.size = new THREE.Vector3(options.bounds.size.x, options.bounds.size.y, options.bounds.size.z);
    this.halfSize = this.size.clone().multiplyScalar(0.5);
    this.direction = this.normalizedHorizontal(options.direction);
    this.force = Number.isFinite(options.force) ? Math.max(0, options.force) : 0;
    this.particleSpeed = Number.isFinite(options.particleSpeed) ? Math.max(0, options.particleSpeed) : 0;
    this.particleCount = Math.max(0, Math.floor(options.maxParticleCount));
    this.inside = false;
    this.lastResult = null;
    this.lastDebugTime = -Infinity;
    this.group = new THREE.Group();
    this.group.name = 'WindZone';
    scene.add(this.group);
    this.buildVisuals();
  }

  normalizedHorizontal(value) {
    const x = Number.isFinite(value?.x) ? value.x : 0;
    const z = Number.isFinite(value?.z) ? value.z : 0;
    const length = Math.hypot(x, z);
    return length > 1e-6 ? Object.freeze({ x: x / length, y: 0, z: z / length }) : Object.freeze({ x: 0, y: 0, z: 0 });
  }

  contains(position) {
    return Math.abs(position.x - this.center.x) <= this.halfSize.x
      && Math.abs(position.y - this.center.y) <= this.halfSize.y
      && Math.abs(position.z - this.center.z) <= this.halfSize.z;
  }

  update(body) {
    const position = body.translation();
    this.inside = this.contains(position);
    const mass = body.mass();
    const valid = this.inside && Number.isFinite(mass) && mass > 0 && (this.direction.x || this.direction.z);
    const impulseScale = valid ? this.force * CONFIG.fixedTimeStep : 0;
    const impulse = { x: this.direction.x * impulseScale, y: 0, z: this.direction.z * impulseScale };
    if (valid) body.applyImpulse(impulse, true);
    this.lastResult = { inside: this.inside, mass, direction: this.direction, impulse, acceleration: valid ? this.force / mass : 0 };
    if (CONFIG.debugPhysics && performance.now() - this.lastDebugTime >= 500) {
      console.debug('[WindZone]', this.lastResult);
      this.lastDebugTime = performance.now();
    }
    return this.lastResult;
  }

  buildVisuals() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(this.size.x, this.size.z),
      new THREE.MeshBasicMaterial({ color: 0x77ddff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(this.center.x, 0.57, this.center.z);
    this.group.add(floor);

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(this.size.x, 0.08, this.size.z)),
      new THREE.LineBasicMaterial({ color: 0xb8f2ff, transparent: true, opacity: 0.75 })
    );
    border.position.set(this.center.x, 0.62, this.center.z);
    this.group.add(border);

    const arrowShape = new THREE.Shape().moveTo(-0.65, -0.12).lineTo(0.2, -0.12).lineTo(0.2, -0.3).lineTo(0.72, 0).lineTo(0.2, 0.3).lineTo(0.2, 0.12).lineTo(-0.65, 0.12).closePath();
    const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xd9faff, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false });
    const yaw = -Math.atan2(this.direction.z, this.direction.x);
    for (const zOffset of [-1.8, 0, 1.8]) {
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.rotation.set(-Math.PI / 2, 0, yaw);
      arrow.position.set(this.center.x, 0.66, this.center.z + zOffset);
      this.group.add(arrow);
    }

    this.particleGeometry = new THREE.BoxGeometry(0.48, 0.025, 0.035);
    this.particleMaterial = new THREE.MeshBasicMaterial({ color: 0xe7fbff, transparent: true, opacity: 0.72, depthWrite: false });
    this.particles = new THREE.InstancedMesh(this.particleGeometry, this.particleMaterial, this.particleCount);
    this.particles.name = 'WindParticles';
    this.particles.frustumCulled = false;
    this.particleOffsets = Array.from({ length: this.particleCount }, (_, i) => ({
      along: (i * 0.61803398875 % 1) * this.size.x,
      across: ((i * 0.38196601125 % 1) - 0.5) * this.size.z * 0.9,
      height: 0.82 + (i % 5) * 0.28
    }));
    this.group.add(this.particles);
    this.updateVisual(0);
  }

  updateVisual(dt) {
    const dummy = new THREE.Object3D();
    const angle = Math.atan2(this.direction.x, this.direction.z) - Math.PI / 2;
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particleOffsets[i];
      particle.along = (particle.along + this.particleSpeed * dt) % this.size.x;
      const along = particle.along - this.halfSize.x;
      dummy.position.set(
        this.center.x + this.direction.x * along - this.direction.z * particle.across,
        particle.height,
        this.center.z + this.direction.z * along + this.direction.x * particle.across
      );
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      this.particles.setMatrixAt(i, dummy.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
    this.particleMaterial.opacity = this.inside ? 0.9 : 0.65;
  }
}
