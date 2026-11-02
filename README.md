# O-ring groove calculator

A TypeScript CLI for Node.js 18+ that checks O-ring gland dimensions in mm. It has no runtime dependencies.

## Install and run

```sh
npm install
npm run build
node dist/cli.js --cs 3.53 --id 50 --depth 2.7 --width 4.8 --groove-dia 51
```

Or run `npm link` to make `o-ring-groove-calc` available as a command.

Example output:

```text
O-ring gland check (static)
Metric      Value    Recommended  Status
Squeeze     23.51 %  15–30 %      OK
Gland fill  75.52 %  <= 85 %      OK
Stretch     2.00 %   0–5 %        OK
```

Use `--type dynamic` for the dynamic squeeze range. The same dimensions give a squeeze WARN in dynamic mode.

```sh
node dist/cli.js --cs 3.53 --id 50 --depth 2.7 --width 4.8 --type dynamic --json
node dist/cli.js --help
npm test
```

## Inputs and calculations

Required options: `--cs` (cross-section diameter), `--id` (inner diameter), `--depth` (radial gland depth including clearance), and `--width` (groove width). All must be positive finite decimal numbers; scientific notation is supported. Depth must be less than cross-section diameter or the command fails with `no squeeze`.

Optional `--groove-dia` is the groove bottom diameter the ring is stretched onto. `--type` accepts `static` (default) or `dynamic`.

- Squeeze: `(cs - depth) / cs * 100`. Recommended: 15–30% static, 10–20% dynamic.
- Gland fill: `(π * cs² / 4) / (depth * width) * 100`. Recommended: at most 85%.
- Stretch: `(groove-dia - id) / id * 100`. Recommended: 0–5%. Negative values are explicitly labeled compression.

Limits are inclusive. Each metric receives an OK or WARN flag using the unrounded result. Table values display two decimal places. Stretch is omitted when groove diameter is absent.

`--json` returns an object containing `type`, `squeeze`, `fill`, and optional `stretch`. Metrics contain an unrounded numeric `percent`, `status`, and `recommended`; stretch also has `condition` (`stretch` or `compression`). Errors go to stderr with exit code 1. Successful calculations (including WARN results) and help exit 0.

These checks implement the simple formulas and recommended ranges above; they do not model material, pressure, temperature, tolerances, or service-specific requirements.

## Development

`npm test` builds with TypeScript and runs the calculation and CLI tests using Node's built-in test runner.

MIT license. Copyright (c) 2026 shanguoao2026-web.
