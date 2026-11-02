#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { calculate, type Inputs, type Metric, type Result } from './calculate.js';

const help = `Usage: o-ring-groove-calc --cs MM --id MM --depth MM --width MM [options]

Check O-ring gland dimensions. All dimensions are in millimetres.

Required:
  --cs MM          O-ring cross-section diameter
  --id MM          O-ring inner diameter
  --depth MM       Radial gland depth including clearance (must be < cs)
  --width MM       Groove width

Options:
  --groove-dia MM  Groove bottom diameter the ring is stretched onto
  --type TYPE      static (default) or dynamic
  --json           Output JSON (percent values are unrounded)
  --help           Show this help

Recommendations: static squeeze 15–30 %, dynamic squeeze 10–20 %,
gland fill <= 85 %, stretch 0–5 %. Negative stretch means compression.
WARN flags do not change the exit code; invalid input exits with code 1.
`;

function parse(args: string[]): Inputs & { json: boolean } {
  const values = new Map<string, string>();
  let json = false;
  const numeric = ['cs', 'id', 'depth', 'width', 'groove-dia'];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      if (json) throw new Error('duplicate option --json');
      json = true;
      continue;
    }
    const key = arg.startsWith('--') ? arg.slice(2) : '';
    if (![...numeric, 'type'].includes(key)) throw new Error(`unknown argument: ${arg}`);
    if (values.has(key)) throw new Error(`duplicate option --${key}`);
    const value = args[++i];
    if (value === undefined || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    values.set(key, value);
  }
  for (const key of ['cs', 'id', 'depth', 'width']) {
    if (!values.has(key)) throw new Error(`missing required option --${key}`);
  }
  function number(key: string): number {
    const value = values.get(key)!;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`${key} must be a positive finite number`);
    }
    return Number(value);
  }
  const type = values.get('type') ?? 'static';
  if (type !== 'static' && type !== 'dynamic') throw new Error('type must be static or dynamic');
  return {
    cs: number('cs'), id: number('id'), depth: number('depth'), width: number('width'),
    ...(values.has('groove-dia') ? { grooveDia: number('groove-dia') } : {}), type, json,
  };
}

function table(result: Result): string {
  const rows: string[][] = [['Metric', 'Value', 'Recommended', 'Status']];
  function row(name: string, metric: Metric): void {
    rows.push([name, `${metric.percent.toFixed(2)} %`, metric.recommended, metric.status]);
  }
  row('Squeeze', result.squeeze);
  row('Gland fill', result.fill);
  if (result.stretch) row(result.stretch.condition === 'compression' ? 'Compression (negative stretch)' : 'Stretch', result.stretch);
  const widths = rows[0].map((_, i) => Math.max(...rows.map(row => row[i].length)));
  return `O-ring gland check (${result.type})\n` + rows.map(row => row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd()).join('\n');
}

export function run(args: string[], stdout: (text: string) => void, stderr: (text: string) => void): number {
try {
  if (args.includes('--help')) stdout(help);
  else {
    const inputs = parse(args);
    const result = calculate(inputs);
    stdout((inputs.json ? JSON.stringify(result, null, 2) : table(result)) + '\n');
  }
} catch (error) {
  stderr(`Error: ${error instanceof Error ? error.message : String(error)}\nUse --help for usage.\n`);
  return 1;
}

return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run(process.argv.slice(2), text => { process.stdout.write(text); }, text => { process.stderr.write(text); });
}
