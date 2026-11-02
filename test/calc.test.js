import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../dist/cli.js';
import { calculate } from '../dist/calculate.js';

const inputs = { cs: 3.53, id: 50, depth: 2.7, width: 4.8, grooveDia: 51 };
const args = ['--cs', '3.53', '--id', '50', '--depth', '2.7', '--width', '4.8'];
const cli = (...extra) => {
  let stdout = '', stderr = '';
  const status = run(extra, text => { stdout += text; }, text => { stderr += text; });
  return { status, stdout, stderr };
};

test('reference dimensions and dynamic recommendation', () => {
  const result = calculate(inputs);
  assert.equal(result.squeeze.percent.toFixed(2), '23.51');
  assert.equal(result.fill.percent.toFixed(2), '75.52');
  assert.equal(result.stretch.percent.toFixed(2), '2.00');
  assert.equal(result.squeeze.status, 'OK');
  assert.equal(result.fill.status, 'OK');
  assert.equal(result.stretch.status, 'OK');
  assert.equal(calculate({ ...inputs, type: 'dynamic' }).squeeze.status, 'WARN');
});

test('stretch is optional and compression is explicit', () => {
  const { grooveDia, ...base } = inputs;
  assert.equal(calculate(base).stretch, undefined);
  const result = calculate({ ...inputs, grooveDia: 49 });
  assert.equal(result.stretch.percent, -2);
  assert.equal(result.stretch.condition, 'compression');
  assert.equal(result.stretch.status, 'WARN');
  assert.equal(calculate({ ...inputs, grooveDia: 50 }).stretch.status, 'OK');
  assert.equal(calculate({ ...inputs, grooveDia: 52.5 }).stretch.status, 'OK');
  assert.equal(calculate({ ...inputs, grooveDia: 53 }).stretch.status, 'WARN');
});

test('squeeze and fill warning thresholds', () => {
  for (const [type, depth, status] of [['static', 17, 'OK'], ['static', 14, 'OK'], ['static', 18, 'WARN'], ['dynamic', 18, 'OK'], ['dynamic', 16, 'OK'], ['dynamic', 15, 'WARN']]) {
    assert.equal(calculate({ cs: 20, id: 50, depth, width: 30, type }).squeeze.status, status);
  }
  assert.equal(calculate({ ...inputs, width: 1 }).fill.status, 'WARN');
});

test('invalid dimensions, no squeeze, and invalid type fail', () => {
  for (const key of ['cs', 'id', 'depth', 'width', 'grooveDia']) {
    for (const value of [0, -1, NaN, Infinity]) assert.throws(() => calculate({ ...inputs, [key]: value }), /positive finite/);
  }
  for (const depth of [3.53, 4]) assert.throws(() => calculate({ ...inputs, depth }), /no squeeze/);
  assert.throws(() => calculate({ ...inputs, type: 'other' }), /static or dynamic/);
});

test('CLI table, JSON, compression, help and warnings', () => {
  const table = cli(...args);
  assert.equal(table.status, 0);
  assert.match(table.stdout, /23\.51 %/);
  assert.match(table.stdout, /75\.52 %/);
  const json = cli(...args, '--groove-dia', '51', '--type', 'dynamic', '--json');
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).squeeze.status, 'WARN');
  assert.equal(JSON.parse(json.stdout).stretch.percent, 2);
  assert.match(cli(...args, '--groove-dia', '49').stdout, /Compression.*-2\.00 %/);
  assert.equal(cli('--help').status, 0);
  assert.match(cli('--help').stdout, /Usage:/);
});

test('CLI errors are clear and exit nonzero', () => {
  for (const [options, message] of [
    [[], /missing required/], [['--bogus'], /unknown argument/],
    [[...args, '--type', 'invalid'], /static or dynamic/],
    [[...args, '--groove-dia'], /missing value/],
    [[...args, '--width', '4'], /duplicate/],
    [['--cs', '3', '--id', '50', '--depth', '3', '--width', '4'], /no squeeze/],
    [['--cs', 'NaN', ...args.slice(2)], /positive finite/],
    [['--cs', '0', ...args.slice(2)], /positive finite/],
  ]) {
    const result = cli(...options);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.equal(result.stdout, '');
  }
});
