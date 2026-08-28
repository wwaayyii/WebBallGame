// Central tuning surface for the phase-one physics prototype.
export const CONFIG = Object.freeze({
  debugPhysics: false,
  gravity: -18, // Stronger than Earth gravity keeps the ball planted on ramps.
  fixedTimeStep: 1 / 60, // Physics stays independent from render refresh rate.
  maxSubSteps: 5,
  ball: {
    radius: 0.65,
    defaultType: 'wood',
    stopSpeed: 0.12,
    angularStopSpeed: 0.15,
    types: {
      wood: { mass: 2.2, moveForce: 19, friction: 1.35, linearDamping: 0.32, angularDamping: 0.5, maxSpeed: 10, airControl: 0.16, rollingResistance: 4.5, color: 0xb97842, roughness: 0.7, metalness: 0.03 },
      stone: { mass: 5.5, moveForce: 28, friction: 1.5, linearDamping: 0.38, angularDamping: 0.55, maxSpeed: 8, airControl: 0.07, rollingResistance: 7, color: 0x777d83, roughness: 0.95, metalness: 0.02 },
      paper: { mass: 0.3, moveForce: 3.2, friction: 0.65, linearDamping: 0.5, angularDamping: 0.7, maxSpeed: 11, airControl: 0.25, rollingResistance: 0.64, color: 0xeee5ce, roughness: 0.58, metalness: 0 }
    }
  },
  respawnHeight: -10,
  respawnDelay: 1,
  initialLives: 3,
  spawn: { x: 0, y: 2.2, z: 8 },
  camera: {
    distance: 11.2,
    targetHeight: 0.65,
    defaultYaw: 0,
    defaultPitch: 0.5,
    minPitch: 0.18,
    maxPitch: 1.15,
    mouseSensitivity: 0.004,
    keyboardYawSpeed: 1.65,
    positionSmoothing: 7,
    targetSmoothing: 10,
    resetSmoothing: 6
  }
});
