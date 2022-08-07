import k2Body, { k2BodyType } from "../Body/Body";
import Circle from "../Body/Circle";
import Polygon from "../Body/Polygon";
import { k2RayContact } from "../Contacts";
import Ray from "../Ray";
import {
  create as vec2create,
  copy as vec2copy,
  dot as vec2dot,
  scale as vec2scale,
  subtract as vec2subtract,
} from "../vector2";

const k2SweptSolver: {
  [key: number]: (
    result: k2RayContact,
    dt: number,
    a: k2Body,
    b: k2Body
  ) => boolean;
} = {};

//https://stackoverflow.com/a/1084899/7204561
const RVC_TMP_VEC2 = vec2create();
export function rayVsCircle(
  ray: Ray,
  circle: Circle,
  contact_normal: k2RayContact
): boolean {
  const E = ray.orig;
  const d = ray.dir;
  const C = circle.position;
  const f = vec2subtract(RVC_TMP_VEC2, E, C);
  const r = circle.radius;
  const a = vec2dot(d, d);
  const b = 2 * vec2dot(f, d);
  const c = vec2dot(f, f) - r * r;

  var discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    // no intersection
    return false;
  } else {
    // ray didn't totally miss sphere,
    // so there is a solution to
    // the equation.

    discriminant = Math.sqrt(discriminant);

    // either solution may be on or off the ray so need to test both
    // t1 is always the smaller value, because BOTH discriminant and
    // a are nonnegative.
    var t1 = (-b - discriminant) / (2 * a);
    var t2 = (-b + discriminant) / (2 * a);

    // 3x HIT cases:
    //          -o->             --|-->  |            |  --|->
    // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit),

    // 3x MISS cases:
    //       ->  o                     o ->              | -> |
    // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

    if (t1 >= 0 && t1 <= 1) {
      // t1 is the intersection, and it's closer than t2
      // (since t1 uses -b - discriminant)
      // Impale, Poke

      if (contact_normal) {
        let time = t1;
        let point_x = E[0] + d[0] * time;
        let point_y = E[1] + d[1] * time;
        let normal_x = point_x - C[0];
        let normal_y = point_y - C[1];
        let inv_mag =
          normal_x || normal_y
            ? 1 / Math.sqrt(normal_x * normal_x + normal_y * normal_y)
            : 1.0;
        normal_x *= inv_mag;
        normal_y *= inv_mag;
        contact_normal.normal[0] = normal_x;
        contact_normal.normal[1] = normal_y;
        contact_normal.time = time;
      }

      return true;
    }

    return false;
  }
}

const TMP_RAY = new Ray();
const CCD_TMP_VEC2 = vec2create();
k2SweptSolver[k2BodyType.CIRCLE] = function (
  result: k2RayContact,
  dt: number,
  a: Circle,
  b: Circle
) {
  const B_OLD_RADIUS = b.radius;
  b.radius = B_OLD_RADIUS + a.radius; //extend B's radius by A's radius

  const velocity = vec2copy(CCD_TMP_VEC2, a.velocity);
  vec2scale(velocity, velocity, dt);
  const ray = TMP_RAY.updateFrom(a.position, velocity);

  let willCollide = rayVsCircle(ray, b, result);
  b.radius = B_OLD_RADIUS; // return B's radius to previous value

  return willCollide;
};

k2SweptSolver[k2BodyType.POLYGON] = function (
  result: k2RayContact,
  dt: number,
  a: k2Body,
  b: k2Body
) {
  // TODO, implement this sucker...
  return false;
};

/**
 * lineToLine helper function (to avoid circular dependencies)
 * from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
 * @param {number} x1 first point in line 1
 * @param {number} y1 first point in line 1
 * @param {number} x2 second point in line 1
 * @param {number} y2 second point in line 1
 * @param {number} x3 first point in line 2
 * @param {number} y3 first point in line 2
 * @param {number} x4 second point in line 2
 * @param {number} y4 second point in line 2
 * @return {boolean}
 */
function rayVsPolygon(ray: Ray, poly: Polygon, result: k2RayContact) {
  let minT = Infinity;
  const edges = poly.getEdges();
  const vertices = poly.getWorldVerts();
  const normals = poly.getNormals();
  let found = false;
  let normalIndex = -1;

  let x1 = ray.orig[0];
  let x2 = x1 + ray.dir[0];

  let y1 = ray.orig[1];
  let y2 = y1 + ray.dir[1];

  for (let i = 0; i < edges.length; i++) {

    let x3 = vertices[i][0];
    let x4 = x3 + edges[i][0];

    let y3 = vertices[i][1];
    let y4 = y3 + edges[i][1];

    var s1_x = x2 - x1;
    var s1_y = y2 - y1;
    var s2_x = x4 - x3;
    var s2_y = y4 - y3;
    var s =
      (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
    var t =
      (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);
    
    if(s >= 0 && s <= 1 && t >= 0 && t <= 1){
      if(t < minT) {
        minT = t;
        normalIndex = i;
      }
      found = true;
    }
  }

  if(found){
    result.time = minT;
    const normal = normals[normalIndex];
    result.normal[0] = normal[0];
    result.normal[1] = normal[1];
    return true;
  }

  return false;
}

let thePoly: Polygon = null;
let theCircle: Circle = null;
k2SweptSolver[k2BodyType.POLYGON | k2BodyType.CIRCLE] = function (
  result: k2RayContact,
  dt: number,
  a: k2Body,
  b: k2Body
) {
  // TODO, implement this sucker...

  const velocity = vec2copy(CCD_TMP_VEC2, a.velocity);
  vec2scale(velocity, velocity, dt);

  const ray = TMP_RAY.updateFrom(a.position, velocity);

  if(a.type === k2BodyType.CIRCLE){
    theCircle = a as Circle;
    thePoly = b as Polygon;

    const angle = Math.atan2(ray.dir[1], ray.dir[0]);
    ray.dir[0] += Math.cos(angle) * theCircle.radius;
    ray.dir[1] += Math.sin(angle) * theCircle.radius;
    return rayVsPolygon(ray, thePoly, result);

  } else {
    theCircle = b as Circle;
    thePoly = a as Polygon;
  }


  return false;
};

export default k2SweptSolver;
