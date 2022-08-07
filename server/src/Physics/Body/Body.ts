import k2AABB from "../AABB";
import { k2Contact } from "../Contacts";
import { Vec2, create as vec2create } from "../vector2";

let idCursor = 0;

export enum k2BodyType {
  CIRCLE = 1,
  POLYGON = 2,
}

export default class k2Body {
  _index: number = -1;
  type: number = -1;
  bullet: boolean = false;
  ref: any = null;
  mass: number = 1;
  invMass: number = 1;
  inertia: number = 1;
  invInertia = 1;
  friction: number = 0.1;
  position: Vec2 = vec2create();
  velocity: Vec2 = vec2create();
  impulse: Vec2 = vec2create();
  drag: number = 0;
  rotation: number = 0;
  dirty: boolean = true;
  eid: number = -1;
  needRTreeUpdate: boolean = false;
  AABB: k2AABB = new k2AABB(this);
  _static = false;
  maskBits: number = 0xffff;
  categoryBits: number = 0xffff;
  performsCollisionSearch: boolean = true;
  isSensor: boolean = false;
  collisioncallback: (result: k2Contact, a: k2Body, b: k2Body) => void = null;
  _hash_index: number = -1;
  _hash_grids: { [key: string]: number } = {};
  _hash_need_update: boolean = true;
  id = idCursor++;

  // dont support angular velocity yet
  get angularVelocity() {
    return 0;
  }

  // dont support angular velocity yet
  set angularVelocity(b: number) {}

  setStatic() {
    this._static = true;
    this.velocity[0] = 0;
    this.velocity[1] = 0;
    this.updateMassProperties();
  }

  updateMassProperties() {
    if (this._static) {
      this.invMass = 0;
      this.invInertia = 0;
      this.mass = Infinity;
      this.inertia = Infinity;
    } else {
      this.invMass = 1 / this.mass;
      this.inertia = this.mass * this.getInertia();
      this.invInertia = 1 / this.inertia;
    }
  }

  updateMass(m: number) {
    if (m > Number.MAX_VALUE) {
      this.setStatic();
    } else {
      this.mass = m;
      this._static = false;
    }
    
    this.updateMassProperties();
  }

  // @override
  getInertia() {
    return 1.0;
  }

  applyImpulse(x: number, y: number) {
    if(this._static) return;
    this.velocity[0] += x;
    this.velocity[1] += y;
  }

  translate(x: number, y: number) {
    this.position[0] += x;
    this.position[1] += y;
    this.dirty = true;
  }

  setX(x: number) {
    this.position[0] = x;
    this.dirty = true;
  }

  setY(y: number) {
    this.position[1] = y;
    this.dirty = true;
  }

  getX(): number {
    return this.position[0];
  }

  getY(): number {
    return this.position[1];
  }

  setRotation(r: number) {
    this.rotation = r;
  }

  getRotation(): number {
    return this.rotation;
  }

  // @override
  getAABB(): k2AABB {
    return this.AABB;
  }
}
