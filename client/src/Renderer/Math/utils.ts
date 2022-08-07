export const PI_2 = Math.PI * 2;
export const PI = Math.PI;
export const halfPI = Math.PI * .5;

export const lerp = (start: number, end: number, amt: number): number =>
  (1 - amt) * start + amt * end;

export const clamp = (num: number, min: number, max: number): number =>
  Math.min(Math.max(num, min), max);

export const repeat = (t: number, m: number): number =>
  clamp(t - Math.floor(t / m) * m, 0, m);

export function lerpTheta(a: number, b: number, t: number): number {
  const dt = repeat(b - a, PI_2);
  return lerp(a, a + (dt > PI ? dt - PI_2 : dt), t);
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
