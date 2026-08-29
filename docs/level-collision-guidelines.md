# Level collision guidelines

The unstuck system is a last-resort safety net, not a substitute for correct collision design.

1. Keep seams between fixed platforms flush wherever possible.
2. Do not make grooves narrower than the ball diameter while still allowing the ball centre to enter.
3. Do not form V-shaped traps between platforms and guardrails.
4. Keep visual geometry and collision geometry consistent.
5. Fully seal any structure the ball must not enter.
6. Let fall areas continue below `respawnHeight`; never catch the ball in an invisible mid-air layer.
7. Join platforms of different heights with a gentle transition or an explicit step.
8. Ensure dynamic objects cannot form a pinch point with fixed geometry at any allowed angle.
9. Test every new obstacle as Wood, Stone, and Paper, approaching from several directions.
10. Never retain a known collision defect merely because the generic unstuck system can recover from it.
