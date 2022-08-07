const max = Math.PI * 2;
export function lerpAngle(a1: number, a2: number, t: number) {
  const diff = (a2 - a1) % max;
  return a1 + (2 * diff % max - diff) * t;
}