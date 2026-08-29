import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { getBallMaterials } from '../materials/BallMaterials.js';
export class BallController {
  constructor(scene, physics) {
    const R = physics.RAPIER;
    const initial = CONFIG.ball.types[CONFIG.ball.defaultType];
    this.body = physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(CONFIG.spawn.x, CONFIG.spawn.y, CONFIG.spawn.z).setLinearDamping(initial.linearDamping).setAngularDamping(initial.angularDamping).setCcdEnabled(true));
    this.collider = physics.world.createCollider(R.ColliderDesc.ball(CONFIG.ball.radius).setMass(initial.mass).setFriction(initial.friction).setRestitution(.05), this.body);
    this.materials = getBallMaterials();
    this.material = this.materials[CONFIG.ball.defaultType];
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.ball.radius, 32, 20), this.material);
    this.mesh.castShadow = true; scene.add(this.mesh);
    this.currentType = CONFIG.ball.defaultType;
    this.lastDebugTime = -Infinity;
    this.belowStopSpeedLogged = false;
    this.snapStopped = false;
    this.movedAfterStopLogged = false;
  }
  get tuning() { return CONFIG.ball.types[this.currentType]; }
  setBallType(type) {
    const next = CONFIG.ball.types[type];
    if (!next) throw new RangeError(`Unknown ball type: ${type}`);
    if (type === this.currentType) return false;
    this.collider.setMass(next.mass);
    this.body.recomputeMassPropertiesFromColliders();
    this.collider.setFriction(next.friction);
    this.body.setLinearDamping(next.linearDamping);
    this.body.setAngularDamping(next.angularDamping);
    this.material = this.materials[type];
    this.mesh.material = this.material;
    this.currentType = type;
    return true;
  }
  update(move, ground, state = 'PLAYING') {
    const tuning = this.tuning;
    const length = Math.hypot(move.x, move.z);
    const grounded = Boolean(ground);
    let action = grounded ? 'IDLE_NO_ACTION' : 'AIRBORNE_NO_BRAKE';
    let downhillForce = null, canSettle = null, brake = null;
    if (length) {
      this.snapStopped = false;
      this.movedAfterStopLogged = false;
      this.belowStopSpeedLogged = false;
      const impulse = tuning.moveForce * CONFIG.fixedTimeStep
        * (grounded ? 1 : tuning.airControl) / length;
      this.body.applyImpulse({ x: move.x * impulse, y: 0, z: move.z * impulse }, true);
      action = grounded ? 'DRIVE_GROUND' : 'DRIVE_AIR';
    }

    const v = this.body.linvel(), horizontal = Math.hypot(v.x, v.z);
    if (!length && grounded) {
      // Do not snap the ball to rest where gravity can overcome resistance. This
      // keeps shallow ramps physically active instead of behaving like brakes.
      downhillForce = this.body.mass() * Math.abs(CONFIG.gravity)
        * Math.sqrt(Math.max(0, 1 - ground.normalY ** 2));
      canSettle = downhillForce <= tuning.rollingResistance;

      if (horizontal < CONFIG.ball.stopSpeed && canSettle) {
        action = 'SNAP_STOP';
        this.body.setLinvel({ x: 0, y: v.y, z: 0 }, true);
        const angular = this.body.angvel();
        // Always remove residual rolling axes so friction cannot start the ball
        // moving again. Preserve meaningful spin around the vertical axis.
        this.body.setAngvel({
          x: 0,
          y: Math.abs(angular.y) < CONFIG.ball.angularStopSpeed ? 0 : angular.y,
          z: 0
        }, true);
      } else if (horizontal > 0) {
        action = 'BRAKE_IMPULSE';
        // A one-step impulse cannot exceed current horizontal momentum, so the
        // brake cannot persist across steps or reverse the ball at low speed.
        const resistanceImpulse = Math.min(
          tuning.rollingResistance * CONFIG.fixedTimeStep,
          this.body.mass() * horizontal
        );
        this.body.applyImpulse({
          x: -v.x / horizontal * resistanceImpulse,
          y: 0,
          z: -v.z / horizontal * resistanceImpulse
        }, true);
        brake = { resistanceImpulse, currentHorizontalMomentum: this.body.mass() * horizontal, impulseX: -v.x / horizontal * resistanceImpulse, impulseZ: -v.z / horizontal * resistanceImpulse };
      } else if (!canSettle) {
        action = 'COAST_ON_SLOPE';
      }
    }

    if (CONFIG.debugPhysics) this.debug({ state, move, length, grounded, ground, v, horizontal, downhillForce, canSettle, action, brake });

    if (horizontal > tuning.maxSpeed) this.body.setLinvel({ x: v.x / horizontal * tuning.maxSpeed, y: v.y, z: v.z / horizontal * tuning.maxSpeed }, true);
  }
  debug({ state, move, length, grounded, ground, v, horizontal, downhillForce, canSettle, action, brake }) {
    const angular=this.body.angvel(), userForce=this.body.userForce(), position=this.body.translation();
    const vector=(value)=>({x:value.x,y:value.y,z:value.z});
    const details={ state,ballType:this.currentType,inputX:move.x,inputZ:move.z,inputLength:length,grounded,groundNormalY:ground?.normalY??null,position:vector(position),velocity:vector(v),horizontalSpeed:horizontal,angularVelocity:vector(angular),bodyMass:this.body.mass(),userForce:vector(userForce),isSleeping:this.body.isSleeping(),downhillForce,canSettle,rollingResistance:this.tuning.rollingResistance,stopSpeed:CONFIG.ball.stopSpeed,action,...brake };
    if (horizontal<CONFIG.ball.stopSpeed && !this.belowStopSpeedLogged) { console.debug('[BallDebug] below-stop-speed', details); this.belowStopSpeedLogged=true; }
    if (action==='SNAP_STOP' && !this.snapStopped) { console.debug('[BallDebug] snap-stop', details); this.snapStopped=true; }
    if (this.snapStopped && horizontal>CONFIG.ball.stopSpeed && !this.movedAfterStopLogged) { console.warn('[BallDebug] moved-after-stop', { velocity:details.velocity,angularVelocity:details.angularVelocity,grounded,groundNormalY:details.groundNormalY,userForce:details.userForce,isSleeping:details.isSleeping }); this.movedAfterStopLogged=true; }
    const now=performance.now();
    if(now-this.lastDebugTime>=250){console.debug('[BallDebug]',details);this.lastDebugTime=now;}
  }
  sync() { const p=this.body.translation(), q=this.body.rotation(); this.mesh.position.set(p.x,p.y,p.z); this.mesh.quaternion.set(q.x,q.y,q.z,q.w); }
  clearExternalLoads() { this.body.resetForces(false); this.body.resetTorques(false); }
  teleport(p) { this.clearExternalLoads(); this.body.setTranslation(p, true); this.body.setLinvel({x:0,y:0,z:0}, true); this.body.setAngvel({x:0,y:0,z:0}, true); this.body.setRotation({x:0,y:0,z:0,w:1}, true); }
}
