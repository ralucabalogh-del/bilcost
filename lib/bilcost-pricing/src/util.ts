export function r(n: number): number {
  return Math.round(n);
}

export function repeat(value: number, n: number): number[] {
  return Array.from({ length: n }, () => r(value));
}

export function sumArray(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

export function carAgeAtStart(year: number, today = new Date()): number {
  return Math.max(0, today.getUTCFullYear() - year);
}
