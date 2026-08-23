# Skybound Roller — Phase One

An original browser-based 3D rolling-ball physics prototype. It uses Three.js for rendering, Rapier for deterministic rigid-body simulation, and Vite for local development. All geometry and level design are purpose-built primitives; no assets from *Ballance* are included.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, then use **WASD** to roll toward the gold finish pad. Production output can be checked with `npm run build`.

## Physics tuning

The main tuning values live together in [`src/config.js`](src/config.js): gravity, fixed timestep, ball mass, movement force, air-control multiplier, friction, damping, maximum speed, respawn height, and respawn delay. Seesaw density, damping, friction, and angular limits are kept alongside its joint setup in [`src/objects/Seesaw.js`](src/objects/Seesaw.js).

## Prototype scope

The route includes a spawn island, straight, gentle ramp, narrow bridge, one-time checkpoint, constrained physics seesaw, and finish island. Falling consumes one of three lives and respawns at the latest checkpoint; completing the route freezes player input and records the elapsed time.
