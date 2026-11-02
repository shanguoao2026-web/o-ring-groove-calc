export interface Inputs {
  cs: number;
  id: number;
  depth: number;
  width: number;
  grooveDia?: number;
  type?: 'static' | 'dynamic';
}

export interface Metric {
  percent: number;
  status: 'OK' | 'WARN';
  recommended: string;
}

export interface Result {
  type: 'static' | 'dynamic';
  squeeze: Metric;
  fill: Metric;
  stretch?: Metric & { condition: 'stretch' | 'compression' };
}

export function calculate(inputs: Inputs): Result {
  for (const key of ['cs', 'id', 'depth', 'width', 'grooveDia'] as const) {
    if (key === 'grooveDia' && inputs[key] === undefined) continue;
    const value = inputs[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`${key === 'grooveDia' ? 'groove-dia' : key} must be a positive finite number`);
    }
  }
  const type = inputs.type ?? 'static';
  if (type !== 'static' && type !== 'dynamic') throw new Error('type must be static or dynamic');
  if (inputs.depth >= inputs.cs) throw new Error('no squeeze: depth must be less than cs');
  const squeeze = (inputs.cs - inputs.depth) / inputs.cs * 100;
  const fill = (Math.PI * inputs.cs ** 2 / 4) / (inputs.depth * inputs.width) * 100;
  const [min, max] = type === 'static' ? [15, 30] : [10, 20];
  const result: Result = {
    type,
    squeeze: { percent: squeeze, status: squeeze >= min && squeeze <= max ? 'OK' : 'WARN', recommended: `${min}–${max} %` },
    fill: { percent: fill, status: fill <= 85 ? 'OK' : 'WARN', recommended: '<= 85 %' },
  };
  if (inputs.grooveDia !== undefined) {
    const stretch = (inputs.grooveDia - inputs.id) / inputs.id * 100;
    result.stretch = {
      percent: stretch,
      status: stretch >= 0 && stretch <= 5 ? 'OK' : 'WARN',
      recommended: '0–5 %',
      condition: stretch < 0 ? 'compression' : 'stretch',
    };
  }
  if ([squeeze, fill, result.stretch?.percent ?? 0].some(value => !Number.isFinite(value))) {
    throw new Error('dimensions produce a non-finite result; use less extreme values');
  }
  return result;
}
