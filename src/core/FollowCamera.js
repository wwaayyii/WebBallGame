import * as THREE from 'three';
import { CONFIG } from '../config.js';

const TAU = Math.PI * 2;
const normalizeAngle = (angle) => THREE.MathUtils.euclideanModulo(angle + Math.PI, TAU) - Math.PI;

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.settings = CONFIG.camera;
    this.yaw = this.settings.defaultYaw;
    this.pitch = this.settings.defaultPitch;
    this.desiredYaw = this.yaw;
    this.desiredPitch = this.pitch;
    this.resetting = false;
    this.target = new THREE.Vector3();
    this.desiredPosition = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
  }
  snap(position) {
    this.target.copy(position).add(new THREE.Vector3(0, this.settings.targetHeight, 0));
    this.updateDesiredPosition();
    this.camera.position.copy(this.desiredPosition);
    this.camera.lookAt(this.target);
  }
  update(position, dt, input) {
    const drag = input.consumeCameraDrag();
    if (drag.x || drag.y) {
      this.resetting = false;
      this.desiredYaw = normalizeAngle(this.desiredYaw - drag.x * this.settings.mouseSensitivity);
      this.desiredPitch = THREE.MathUtils.clamp(this.desiredPitch + drag.y * this.settings.mouseSensitivity, this.settings.minPitch, this.settings.maxPitch);
    }
    if (input.cameraYaw) {
      this.resetting = false;
      this.desiredYaw = normalizeAngle(this.desiredYaw + input.cameraYaw * this.settings.keyboardYawSpeed * dt);
    }
    if (input.consumeResetView()) {
      this.desiredYaw = this.settings.defaultYaw;
      this.desiredPitch = this.settings.defaultPitch;
      this.resetting = true;
    }

    const angularAlpha = this.resetting ? 1 - Math.exp(-this.settings.resetSmoothing * dt) : 1;
    this.yaw = normalizeAngle(this.yaw + normalizeAngle(this.desiredYaw - this.yaw) * angularAlpha);
    this.pitch = THREE.MathUtils.clamp(THREE.MathUtils.lerp(this.pitch, this.desiredPitch, angularAlpha), this.settings.minPitch, this.settings.maxPitch);
    if (this.resetting && Math.abs(normalizeAngle(this.desiredYaw - this.yaw)) < 0.001 && Math.abs(this.desiredPitch - this.pitch) < 0.001) this.resetting = false;

    const targetAlpha = 1 - Math.exp(-this.settings.targetSmoothing * dt);
    this.lookTarget.copy(position).add(new THREE.Vector3(0, this.settings.targetHeight, 0));
    this.target.lerp(this.lookTarget, targetAlpha);
    this.updateDesiredPosition();
    const positionAlpha = 1 - Math.exp(-this.settings.positionSmoothing * dt);
    this.camera.position.lerp(this.desiredPosition, positionAlpha);
    this.camera.lookAt(this.target);
  }
  updateDesiredPosition() {
    const horizontalDistance = Math.cos(this.pitch) * this.settings.distance;
    this.desiredPosition.copy(this.target).add(new THREE.Vector3(
      Math.sin(this.yaw) * horizontalDistance,
      Math.sin(this.pitch) * this.settings.distance,
      Math.cos(this.yaw) * horizontalDistance
    ));
  }
  getHorizontalBasis() {
    return {
      forward: { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) },
      right: { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) }
    };
  }
}
