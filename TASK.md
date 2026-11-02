# o-ring-groove-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) that checks O-ring gland (groove) design.

Features:
- Inputs (mm): --cs O-ring cross-section diameter, --id O-ring inner diameter, --depth groove depth (radial gland depth incl. clearance), --width groove width, optional --groove-dia (diameter the ring is stretched onto for a piston/rod groove, i.e. groove bottom diameter) and --type static|dynamic (default static).
- Compute: squeeze % = (cs - depth)/cs*100; gland fill % = (pi*cs^2/4)/(depth*width)*100; stretch % = (groove-dia - id)/id*100 when --groove-dia given (negative = compression, report it as such).
- Recommended ranges with OK/WARN flags: static squeeze 15–30 %, dynamic squeeze 10–20 %; gland fill <= 85 %; stretch 0–5 %.
- Table output by default, --json for machine output, --help.
- Input validation with clear errors (positive numbers; depth < cs required else error "no squeeze").
- README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log.
- npm test must build and pass. No secrets, no personal info.

Check values: cs=3.53 depth=2.7 width=4.8 → squeeze 23.51 %, fill 75.52 %; id=50 groove-dia=51 → stretch 2.00 %; dynamic with same inputs → squeeze WARN.
