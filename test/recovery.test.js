import test from 'node:test';
import assert from 'node:assert/strict';
import { SafePositionTracker } from '../src/core/SafePositionTracker.js';
import { StuckDetector } from '../src/core/StuckDetector.js';
import { CONFIG } from '../src/config.js';

function safeFixture() {
  const state = { position: { ...CONFIG.spawn }, velocity: { x: 0, y: 0, z: 0 }, fixed: true, clearance: true };
  const collider = { parent: () => ({ isFixed: () => state.fixed }), translation: () => ({ x: 0, y: -1, z: 0 }) };
  class Ray { constructor(origin) { this.origin = origin; } }
  class Ball { constructor(radius) { this.radius = radius; } }
  const world = {
    castRayAndGetNormal: ray => state.ground === false ? null : ({ normal: { y: state.normalY ?? 1 }, collider, timeOfImpact: ray.origin.y - .5 }),
    intersectionWithShape: () => state.clearance ? null : collider
  };
  const body = { translation: () => state.position, linvel: () => state.velocity };
  const ball = { body, collider: {} };
  return { state, tracker: new SafePositionTracker({ RAPIER: { Ray, Ball }, world }, ball) };
}

test('safe position starts at spawn and requires a stable interval', () => {
  const { state, tracker } = safeFixture();
  assert.deepEqual(tracker.position, CONFIG.spawn);
  state.position = { x: 2, y: 1.2, z: 2 };
  for (let i = 0; i < 25; i++) tracker.update({ state: 'PLAYING', ground: { normalY: 1, fixed: true }, inWindZone: false, dt: 1 / 60 });
  assert.deepEqual(tracker.position, CONFIG.spawn);
  tracker.update({ state: 'PLAYING', ground: { normalY: 1, fixed: true }, inWindZone: false, dt: 1 / 60 });
  assert.deepEqual(tracker.position, state.position);
});

test('unsafe airborne, wind, dynamic, edge, and obstructed candidates never replace safety', () => {
  const cases = [
    { ground: null },
    { ground: { normalY: 1, fixed: true }, inWindZone: true },
    { ground: { normalY: 1, fixed: false } },
    { ground: { normalY: .5, fixed: true } }
  ];
  for (const sample of cases) {
    const { state, tracker } = safeFixture(); state.position = { x: 3, y: 2, z: 3 };
    for (let i = 0; i < 40; i++) tracker.update({ state: 'PLAYING', inWindZone: false, dt: 1 / 60, ...sample });
    assert.deepEqual(tracker.position, CONFIG.spawn);
  }
  const edge = safeFixture(); edge.state.ground = false;
  edge.tracker.update({ state: 'PLAYING', ground: { normalY: 1, fixed: true }, inWindZone: false, dt: 1 });
  assert.deepEqual(edge.tracker.position, CONFIG.spawn);
  const blocked = safeFixture(); blocked.state.clearance = false;
  blocked.tracker.update({ state: 'PLAYING', ground: { normalY: 1, fixed: true }, inWindZone: false, dt: 1 });
  assert.deepEqual(blocked.tracker.position, CONFIG.spawn);
});

test('stuck hint needs movement input and clears after actual movement', () => {
  const detector = new StuckDetector(); const position = { x: 0, z: 0 };
  assert.equal(detector.update({ state: 'PLAYING', movingInput: false, position, horizontalSpeed: 0, dt: 2 }), false);
  assert.equal(detector.update({ state: 'PLAYING', movingInput: true, position, horizontalSpeed: 0, dt: 1 }), false);
  assert.equal(detector.update({ state: 'PLAYING', movingInput: true, position, horizontalSpeed: 0, dt: .8 }), true);
  assert.equal(detector.update({ state: 'PLAYING', movingInput: true, position: { x: 1, z: 0 }, horizontalSpeed: 1, dt: .1 }), false);
});

test('real Rapier queries accept fixed floors, exclude the ball, and reject edges and walls', async () => {
  const { default: RAPIER } = await import('@dimforge/rapier3d-compat');
  await RAPIER.init({});
  const world = new RAPIER.World({ x: 0, y: -18, z: 0 });
  const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, .5, 1), floorBody);
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, .65, 0));
  const ballCollider = world.createCollider(RAPIER.ColliderDesc.ball(CONFIG.ball.radius), body);
  world.step();
  const tracker = new SafePositionTracker({ RAPIER, world }, { body, collider: ballCollider });
  const ground = { normalY: 1, fixed: true };

  assert.equal(tracker.hasReliableGround(body.translation()), true, 'five rays find fixed support');
  assert.equal(tracker.hasSpawnClearance(body.translation()), true, 'floor and excluded player ball do not block clearance');

  body.setTranslation({ x: .7, y: .65, z: 0 }, true); world.step();
  assert.equal(tracker.hasReliableGround(body.translation()), false, 'perimeter rays identify an edge');
  tracker.update({ state: 'PLAYING', ground, inWindZone: false, dt: 1 });
  assert.deepEqual(tracker.position, CONFIG.spawn, 'an edge cannot overwrite the fallback');

  body.setTranslation({ x: 0, y: .65, z: 0 }, true);
  const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(.7, .65, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(.1, 1, 1), wallBody); world.step();
  assert.equal(tracker.hasSpawnClearance(body.translation()), false, 'fixed side obstacle blocks clearance');
  tracker.update({ state: 'PLAYING', ground, inWindZone: false, dt: 1 });
  assert.deepEqual(tracker.position, CONFIG.spawn, 'a slot cannot overwrite the fallback');
});
