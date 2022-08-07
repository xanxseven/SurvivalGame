import k2Body from "./Body/Body";

export default class k2AABB {
  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  ref: k2Body;
  constructor(ref: k2Body = null) {
    this.ref = ref;
  }
}

export function k2AABBOverlap(a: k2AABB, b: k2AABB) {
  return (
    a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
  );
}
