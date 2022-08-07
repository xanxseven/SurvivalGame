import k2Body, { k2BodyType } from "./Body";
import { set as vec2set } from "../vector2";
import k2AABB from "../AABB";

export default class Circle extends k2Body {
  type: number = k2BodyType.CIRCLE;
  radius: number;

  constructor(x: number, y: number, radius: number) {
    super();
    vec2set(this.position, x, y);
    this.radius = radius;
    this.updateMassProperties();
  }

  getInertia() {
    return 0.5 * this.radius * this.radius;
  }

  getAABB(): k2AABB {
    const aabb = this.AABB;
    if (this.dirty) {
      const x = this.position[0];
      const y = this.position[1];
      const radius = this.radius;
      aabb.minX = x - radius;
      aabb.minY = y - radius;
      aabb.maxX = x + radius;
      aabb.maxY = y + radius;
      this.dirty = false;
      this._hash_need_update = true;
    }
    return aabb;
  }
}
