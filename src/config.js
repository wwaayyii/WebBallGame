// Central tuning surface for the phase-one physics prototype.
export const CONFIG = Object.freeze({
  gravity: -18, // Stronger than Earth gravity keeps the ball planted on ramps.
  fixedTimeStep: 1 / 60, // Physics stays independent from render refresh rate.
  maxSubSteps: 5,
  ball: {
    radius: 0.65,
    mass: 2.2,
    moveForce: 19, // Continuous force; Rapier integration creates natural rolling.
    airControl: 0.16, // Small fraction of ground authority while airborne.
    friction: 1.35,
    linearDamping: 0.32,
    angularDamping: 0.5,
    maxSpeed: 10
  },
  respawnHeight: -10,
  respawnDelay: 1,
  initialLives: 3,
  spawn: { x: 0, y: 2.2, z: 8 }
});
