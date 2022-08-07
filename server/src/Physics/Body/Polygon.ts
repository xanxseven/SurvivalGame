import k2AABB from "../AABB";
import k2Body, { k2BodyType } from "./Body";
import {
  set as vec2set,
  Vec2,
  create as vec2create,
  dot as vec2dot,
  cross2d as vec2cross2d,
} from "../vector2";

export default class Polygon extends k2Body {
  type = k2BodyType.POLYGON;
  private localVertices: Vec2[];
  private worldVertices: Vec2[];
  private normals: Vec2[];
  private edges: Vec2[];
  private dirtyVerts = true;
  private dirtyNormals = true;
  AABB: k2AABB = new k2AABB(this);
  size: number = 0;
  scaleX = 1;
  scaleY = 1;

  constructor(x: number, y: number, vertices: number[][]) {
    super();

    vec2set(this.position, x, y);

    const size = vertices.length;
    this.localVertices = new Array(size);
    this.worldVertices = new Array(size);
    this.normals = new Array(size);
    this.edges = new Array(size);

    for (let i = 0; i < size; i++) {
      this.localVertices[i] = vec2set(
        vec2create(),
        vertices[i][0],
        vertices[i][1]
      );
      this.worldVertices[i] = vec2create();
      this.normals[i] = vec2create();
      this.edges[i] = vec2create();
    }

    // ensure vertices are not provided in counter clockwise order
    this.checkClockwise();

    this.updateMassProperties();
  }

  getInertia(): number {
    let acc0 = 0;
    let acc1 = 0;

    const vertices = this.localVertices;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const cross = Math.abs(vec2cross2d(a, b));
      acc0 += cross * (vec2dot(a, a) + vec2dot(b, b) + vec2dot(a, b));
      acc1 += cross;
    }

    return acc0 / 6 / acc1;
  }

  checkClockwise() {
    let sum = 0.0;
    const vertices = this.localVertices;
    let v1 = vertices[vertices.length - 1];
    for (let i = 0; i < vertices.length; i++) {
      const v2 = vertices[i];
      sum += (v2[0] - v1[0]) * (v2[1] + v1[1]);
      v1 = v2;
    }
    let isClockWise = sum > 0.0;
    if (isClockWise) this.localVertices.reverse();
  }

  updateNormals() {
    const coords = this.worldVertices;
    const edges = this.edges;
    const normals = this.normals;
    const count = coords.length;

    for (let i = 0; i < count; i++) {
      const next = i + 1 < count ? i + 1 : 0;
      const x = coords[next][0] - coords[i][0];
      const y = coords[next][1] - coords[i][1];
      const length = x || y ? Math.sqrt(x * x + y * y) : 0;

      edges[i][0] = x;
      edges[i][1] = y;
      normals[i][0] = length ? y / length : 0;
      normals[i][1] = length ? -x / length : 0;
    }

    this.dirtyNormals = false;
  }

  getNormals() {
    if (this.dirtyNormals) this.updateNormals();
    return this.normals;
  }

  getEdges() {
    if (this.dirtyNormals) this.updateNormals();
    return this.edges;
  }

  getWorldVerts() {
    const verts = this.worldVertices;
    if (this.dirtyVerts) {
      const localVerts = this.localVertices;
      let cos = Math.cos(this.rotation);
      let sin = Math.sin(this.rotation);
      const x = this.position[0];
      const y = this.position[1];

      for (let i = 0; i < localVerts.length; i++) {
        verts[i][0] =
          x + (cos * localVerts[i][0] - sin * localVerts[i][1]) * this.scaleX;
        verts[i][1] =
          y + (sin * localVerts[i][0] + cos * localVerts[i][1]) * this.scaleY;
      }

      this.dirtyVerts = false;
    }
    return verts;
  }

  getAABB(): k2AABB {
    const aabb = this.AABB;
    if (this.dirty) {
      let minx = Infinity;
      let miny = Infinity;
      let maxx = -Infinity;
      let maxy = -Infinity;

      const worldVertices = this.getWorldVerts();
      let x = 0,
        y = 0;

      for (let i = 0; i < worldVertices.length; i++) {
        x = worldVertices[i][0];
        y = worldVertices[i][1];
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
      }

      aabb.minX = minx;
      aabb.minY = miny;
      aabb.maxX = maxx;
      aabb.maxY = maxy;

      this.dirty = false;
      this._hash_need_update = true;
    }
    return aabb;
  }

  setRotation(r: number) {
    this.dirtyNormals = true;
    this.dirtyVerts = true;
    this.dirty = true;
    this.rotation = r;
  }

  setX(x: number) {
    this.dirty = true;
    this.dirtyVerts = true;
    this.position[0] = x;
    super.setX(x);
  }

  setY(y: number) {
    this.dirty = true;
    this.dirtyVerts = true;
    this.position[1] = y;
  }

  setScale(x: number, y: number) {
    this.scaleX = x;
    this.scaleY = y;
    this.dirty = true;
    this.dirtyVerts = true;
  }

  setPosition(x: number, y: number) {
    this.position[0] = x;
    this.position[1] = y;
    this.dirty = true;
    this.dirtyVerts = true;
  }

  translate(x: number, y: number) {
    this.position[0] += x;
    this.position[1] += y;
    this.dirty = true;
    this.dirtyVerts = true;
  }
}
