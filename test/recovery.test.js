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
