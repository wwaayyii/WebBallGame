import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'], { stdio: ['ignore', 'pipe', 'inherit'] });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite did not start')), 10000);
    server.stdout.on('data', chunk => { if (chunk.toString().includes('4173')) { clearTimeout(timer); resolve(); } });
  });
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  const consoleErrors = [], pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.game?.ball?.body && window.game?.state === 'PLAYING');

  assert.ok(await page.locator('canvas').isVisible(), 'WebGL canvas loads');
  assert.match(await page.locator('.hint').innerText(), /T\s+Unstuck/, 'HUD advertises T Unstuck');
  const initialSafe = await page.evaluate(() => window.game.lastSafePosition);
  assert.ok(Math.hypot(initialSafe.x, initialSafe.z - 8) < .01 && Math.abs(initialSafe.y - 1.21) < .08, 'default safe position is the spawn basin centre');

  const safe = await page.evaluate(() => {
    const g = window.game; g.ball.teleport({ x: 0, y: 2.205, z: -16 }); g.ball.body.sleep(); g.ball.sync();
    const ground = g.groundContact();
    for (let i = 0; i < 30; i++) g.safePositions.update({ state: g.state, ground, inWindZone: false, dt: 1 / 60 });
    return g.lastSafePosition;
  });
  assert.ok(Math.hypot(safe.x, safe.z + 16) < .05, 'fixed platform updates lastSafePosition');

  for (const location of [{ x: 11, y: 1.15, z: 7 }, { x: 0, y: 2.3, z: -28.875 }, { x: 0, y: 5, z: -10 }, { x: 2.1, y: 1.05, z: 0 }]) {
    const unchanged = await page.evaluate(async ({ location, safe }) => {
      const g = window.game; g.safePositions.lastSafePosition = safe; g.ball.teleport(location); g.ball.sync();
      await new Promise(resolve => setTimeout(resolve, 650)); return g.lastSafePosition;
    }, { location, safe });
    assert.deepEqual(unchanged, safe, 'wind, seesaw, air, and edge positions remain unsafe');
  }

  // Query the repaired flush seam with every material and several approach lanes.
  for (const [type, z] of [['paper', 4.2], ['wood', 7], ['stone', 9.8]]) {
    const seam = await page.evaluate(({ type, z }) => {
      const g = window.game, R = g.physics.RAPIER; g.setBallType(type);
      return [3.95, 4, 4.05].map(x => {
        const hit = g.physics.world.castRay(new R.Ray({ x, y: 2, z }, { x: 0, y: -1, z: 0 }), 3, true,
          undefined, undefined, g.ball.collider, g.ball.body);
        return hit ? 2 - hit.timeOfImpact : null;
      });
    }, { type, z });
    assert.ok(seam.every(y => y !== null && Math.abs(y - .5) < .02), `${type} lane has continuous, level support across the seam`);
  }

  await page.evaluate(() => {
    const g = window.game; g.ball.teleport({ x: 0, y: 1.05, z: 0 });
    g.ball.body.lockTranslations(true, true); g.stuckDetector.reset();
  });
  assert.equal(await page.locator('.stuck-hint').isVisible(), false, 'normal idle never shows stuck hint');
  await page.keyboard.down('w'); await page.waitForFunction(() => window.game.stuckDetector.stuck, null, { timeout: 10000 });
  assert.equal(await page.locator('.stuck-hint').isVisible(), true, 'sustained blocked input shows hint');
  await page.keyboard.up('w'); await page.locator('.stuck-hint').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.stuck-hint').isVisible(), false, 'releasing input hides hint');
  await page.evaluate(() => window.game.ball.body.lockTranslations(false, true));

  const beforeRecovery = await page.evaluate(() => {
    const g = window.game; g.safePositions.lastSafePosition = { x: 0, y: 1.05, z: 0 };
    g.setBallType('paper'); g.level.checkpoint.active = true; g.lives = 3;
    g.ball.teleport({ x: 5, y: -2, z: 7 }); g.ball.body.setLinvel({ x: 4, y: 3, z: 2 }, true);
    g.ball.body.setAngvel({ x: 2, y: 3, z: 4 }, true);
    return { type: g.ball.currentType, lives: g.lives, checkpoint: g.level.checkpoint.active };
  });
  await page.keyboard.down('t'); await sleep(100);
  const recovered = await page.evaluate(() => {
    const g = window.game, p = g.ball.body.translation(), v = g.ball.body.linvel(), a = g.ball.body.angvel();
    return { p, speed: Math.hypot(v.x, v.y, v.z), spin: Math.hypot(a.x, a.y, a.z), type: g.ball.currentType,
      lives: g.lives, checkpoint: g.level.checkpoint.active, cameraError: g.cameraRig.target.distanceTo(g.ball.mesh.position.clone().add({ x: 0, y: .65, z: 0 })) };
  });
  assert.ok(Math.hypot(recovered.p.x, recovered.p.z) < .1, 'T returns to latest safe position');
  const cleared = await page.evaluate(() => {
    const g=window.game; g.unstuckCooldown=0; g.ball.teleport({x:5,y:-2,z:7});
    g.ball.body.setLinvel({x:4,y:3,z:2},true); g.ball.body.setAngvel({x:2,y:3,z:4},true); g.unstuck();
    const v=g.ball.body.linvel(),a=g.ball.body.angvel(); return {speed:Math.hypot(v.x,v.y,v.z),spin:Math.hypot(a.x,a.y,a.z),cameraError:g.cameraRig.target.distanceTo(g.ball.mesh.position.clone().add({x:0,y:.65,z:0}))};
  });
  assert.ok(cleared.speed < .001 && cleared.spin < .001, 'T clears linear and angular velocity immediately');
  assert.deepEqual({ type: recovered.type, lives: recovered.lives, checkpoint: recovered.checkpoint }, beforeRecovery, 'T preserves type, lives, and checkpoint');
  assert.ok(cleared.cameraError < .001, 'camera snaps to recovered ball');

  await page.evaluate(() => { window.game.safePositions.lastSafePosition = { x: -2, y: 1.05, z: 0 }; });
  await page.dispatchEvent('body', 'keydown', { code: 'KeyT', key: 't', repeat: true }); await sleep(100);
  assert.ok(Math.abs((await page.evaluate(() => window.game.ball.body.translation().x))) < .05, 'repeat keydown does not teleport');
  await page.keyboard.up('t'); await page.keyboard.press('t'); await sleep(100);
  assert.ok(Math.abs((await page.evaluate(() => window.game.ball.body.translation().x))) < .05, 'cooldown blocks another initial keydown');
  await page.waitForFunction(() => window.game.unstuckCooldown <= 0, null, { timeout: 5000 });
  const afterCooldown = await page.evaluate(() => { const g=window.game; g.safePositions.lastSafePosition={x:-2,y:1.05,z:0}; g.unstuck(); return g.ball.body.translation().x; });
  assert.ok(afterCooldown < -1.9, 'T works after cooldown');

  for (const state of ['LEVEL_COMPLETE', 'GAME_OVER', 'RESPAWNING']) {
    const stayed = await page.evaluate(async state => {
      const g = window.game; g.setState(state); g.unstuckCooldown = 0; g.ball.teleport({ x: 3, y: 3, z: 3 }); g.unstuck();
      await new Promise(resolve => setTimeout(resolve, 30)); return g.ball.body.translation().x;
    }, state);
    assert.ok(stayed > 2.9, `T is disabled in ${state}`);
  }
  const livesAfterFall = await page.evaluate(async () => {
    const g = window.game; g.setState('PLAYING'); g.lives = 3; g.ball.teleport({ x: 0, y: -11, z: 0 });
    await new Promise(resolve => setTimeout(resolve, 150)); return g.lives;
  });
  assert.equal(livesAfterFall, 2, 'ordinary falling still costs a life');
  assert.deepEqual(consoleErrors, [], 'no console errors'); assert.deepEqual(pageErrors, [], 'no page errors');
  await page.screenshot({ path: 'artifacts/stage7-recovery.png' });
  console.log('Playwright: 21 recovery, safety, state, seam, WebGL, and error checks passed');
  await browser.close();
} finally { server.kill('SIGTERM'); }
