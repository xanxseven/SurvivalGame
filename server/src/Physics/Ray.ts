import {
  create as vec2create,
  set as vec2set,
  Vec2,
  copy as vec2copy,
} from "./vector2";

// optimised version of a ray that uses caching to improve ray detection speed
export default class Ray {
  orig: Vec2 = vec2create();
  dir: Vec2 = vec2create();
  invdir: Vec2 = vec2create();
  sign: Vec2 = vec2create();

  updateFrom(orig: Vec2, dir: Vec2) {
    vec2copy(this.orig, orig);
    vec2copy(this.dir, dir);
    vec2set(
      this.invdir,
      dir[0] ? 1 / dir[0] : Infinity,
      dir[1] ? 1 / dir[1] : Infinity
    );
    vec2set(this.sign, +(this.invdir[0] < 0), +(this.invdir[1] < 0));
    return this;
  }
}
