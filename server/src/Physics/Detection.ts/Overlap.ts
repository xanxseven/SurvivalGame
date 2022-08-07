import k2Body, { k2BodyType } from "../Body/Body";
import Circle from "../Body/Circle";
import Polygon from "../Body/Polygon";
import { k2Contact } from "../Contacts";
import {
  create as vec2create,
  add as vec2add,
  dot as vec2dot,
  subtract as vec2subtract,
  length as vec2length,
  clone as vec2clone,
  normalize as vec2normalize,
  cross2d as vec2cross2d,
  negate as vec2negate,
  zero as vec2zero,
  copy as vec2copy,
  Vec2,
} from "../vector2";
import { IK2World, k2GetContact } from "../world";

///////////////////////////////////
//      Utility functions
//////////////////////////////////

const fMSTmp1 = vec2create();
const fMSTmp2 = vec2create();
function findMinSeparation(
  polyA: Polygon,
  polyB: Polygon,
  indexRefEdge: Vec2,
  supportPoint: Vec2
) {
  const aNormals = polyA.getNormals();
  const aVerts = polyA.getWorldVerts();
  const bVerts = polyB.getWorldVerts();

  let separation = -Infinity;

  for (let i = 0; i < aVerts.length; i++) {
    const normal = aNormals[i];
    let minSep = Infinity;
    for (let j = 0; j < bVerts.length; j++) {
      let proj = vec2dot(vec2subtract(fMSTmp1, bVerts[j], aVerts[i]), normal);
      if (proj < minSep) {
        minSep = proj;
        fMSTmp2[0] = bVerts[j][0];
        fMSTmp2[1] = bVerts[j][1];
      }
    }

    if (minSep > separation) {
      separation = minSep;
      indexRefEdge[0] = i;
      supportPoint[0] = fMSTmp1[0];
      supportPoint[1] = fMSTmp1[1];
    }
  }
  return separation;
}

function findIncidentEdge(shape: Polygon, n: Vec2) {
  let indexIncEdge;
  let minProj = Infinity;

  const vertices = shape.getWorldVerts();
  const normals = shape.getNormals();

  for (let i = 0; i < vertices.length; i++) {
    const edgeNormal = normals[i];
    const proj = vec2dot(edgeNormal, n);
    if (proj < minProj) {
      minProj = proj;
      indexIncEdge = i;
    }
  }

  return indexIncEdge;
}

const cTLsTmp1 = vec2create();
const cTLsTmp2 = vec2create();
const cTLsTmp3 = vec2create();
const cTLsTmp4 = vec2create();
function clipToLineSegment(
  contactsIn: Vec2[],
  contactsOut: Vec2[],
  c0: Vec2,
  c1: Vec2
) {
  let numOut = 0;
  const normal = vec2subtract(cTLsTmp1, c1, c0);
  vec2normalize(normal, normal);

  const dp1 = vec2subtract(cTLsTmp2, contactsIn[0], c0);
  const dp2 = vec2subtract(cTLsTmp3, contactsIn[1], c0);
  const dist0 = vec2cross2d(dp1, normal);
  const dist1 = vec2cross2d(dp2, normal);

  if (dist0 <= 0) contactsOut[numOut++] = contactsIn[0];
  if (dist1 <= 0) contactsOut[numOut++] = contactsIn[1];

  if (dist0 * dist1 < 0) {
    const totalDist = dist0 - dist1;
    const t = dist0 / totalDist;
    const contact = cTLsTmp4;
    contact[0] = contactsIn[0][0] + (contactsIn[1][0] - contactsIn[0][0]) * t;
    contact[1] = contactsIn[0][1] + (contactsIn[1][1] - contactsIn[0][1]) * t;
    contactsOut[numOut] = contact;
    numOut++;
  }

  return numOut;
}

const k2OverlapDetection: {
  [key: number]: (world: IK2World, a: k2Body, b: k2Body) => boolean;
} = {};

// CIRCLE VS CIRCLE
const cCCTmp1 = vec2create();
const cCCTmp2 = vec2create();
const cCCTmp3 = vec2create();
const cCCTmp4 = vec2create();
const cCCTmp5 = vec2create();
k2OverlapDetection[k2BodyType.CIRCLE | k2BodyType.CIRCLE] = function (
  world: IK2World,
  a: Circle,
  b: Circle
) {
  const ab = vec2subtract(cCCTmp1, b.position, a.position);
  const lenSqd = vec2dot(ab, ab);
  const radiusSum = a.radius + b.radius;

  const hasCollision = lenSqd < radiusSum * radiusSum;
  if (!hasCollision) return false;

  const cp = k2GetContact(world);

  //calculate the normal between the two shapes
  const n = cCCTmp2;
  const invLength = lenSqd > 0 ? 1 / Math.sqrt(lenSqd) : 0;
  n[0] = invLength ? ab[0] * invLength : 0;
  n[1] = invLength ? ab[1] * invLength : 1;

  const start = cCCTmp3;
  start[0] = b.position[0] - n[0] * b.radius;
  start[1] = b.position[1] - n[1] * b.radius;

  const end = cCCTmp4;
  end[0] = a.position[0] + n[0] * a.radius;
  end[1] = a.position[1] + n[1] * a.radius;

  const depth = vec2length(vec2subtract(cCCTmp5, end, start));

  cp.update(a, b, -depth, n[0], n[1], end[0], end[1]);

  return true;
};

//Polygon vs Polygon
let theCircle: Circle = null;
let thePolygon: Polygon = null;

const iSCPTmp1 = vec2create();
const iSCPTmp2 = vec2create();
const iSCPTmp3 = vec2create();
const iSCPTmp4 = vec2create();
const iSCPTmp5 = vec2create();
const iSCPTmp6 = vec2create();
const iSCPTmp7 = vec2create();
const iSCPTmp8 = vec2create();

k2OverlapDetection[k2BodyType.CIRCLE | k2BodyType.POLYGON] = function (
  world: IK2World,
  a,
  b
) {
  //firstly, lets make A always the circle, and B always the polygon...
  let reverse = false;
  if (a.type === k2BodyType.POLYGON) {
    theCircle = b as Circle;
    thePolygon = a as Polygon;
    reverse = true;
  } else {
    theCircle = a as Circle;
    thePolygon = b as Polygon;
  }

  const vertices = thePolygon.getWorldVerts();
  let isOutside = false;
  let minCurrVertex;
  let minNextVertex;
  let distanceEdge = -Infinity;
  let distanceEdge2 = -Infinity;

  for (let i = 0; i < vertices.length; i++) {
    let currVertex = i;
    let nextVertex = (i + 1) % vertices.length;
    const normal = thePolygon.getNormals()[currVertex];

    const circleCenter = vec2subtract(
      iSCPTmp1,
      theCircle.position,
      vertices[currVertex]
    );
    const projection = vec2dot(circleCenter, normal);

    if (projection > 0 && projection > distanceEdge2) {
      distanceEdge2 = projection;
      distanceEdge = projection;
      minCurrVertex = vertices[currVertex];
      minNextVertex = vertices[nextVertex];
      isOutside = true;
      // break;
    } else {
      if (projection > distanceEdge) {
        distanceEdge = projection;
        minCurrVertex = vertices[currVertex];
        minNextVertex = vertices[nextVertex];
      }
    }
  }

  if (isOutside) {
    let v1 = vec2subtract(iSCPTmp2, theCircle.position, minCurrVertex);
    let v2 = vec2subtract(iSCPTmp3, minNextVertex, minCurrVertex);

    if (vec2dot(v1, v2) < 0) {
      const v1mag = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      if (v1mag > theCircle.radius) {
        return false;
      } else {
        //if (!resolveCollision) return true; //early exit if we dont want to create a contact point to solve
        const ct = k2GetContact(world); // world.getContact();
        const n = vec2normalize(iSCPTmp4, v1);

        const depth = theCircle.radius - v1mag;

        const start = iSCPTmp5;
        start[0] = theCircle.position[0] + n[0] * -theCircle.radius;
        start[1] = theCircle.position[1] + n[1] * -theCircle.radius;

        const end = iSCPTmp6;
        end[0] = start[0] + n[0] * depth;
        end[1] = start[1] + n[1] * depth;

        ct.update(thePolygon, theCircle, -depth, n[0], n[1], end[0], end[1]);
      } //tmps, 4, 5, 6 are now able to be reused
    } else {
      v1 = vec2subtract(iSCPTmp4, theCircle.position, minNextVertex);
      v2 = vec2subtract(iSCPTmp5, minCurrVertex, minNextVertex);

      if (vec2dot(v1, v2) < 0) {
        const v1mag = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        if (v1mag > theCircle.radius) {
          return false;
        } else {
          //if (!resolveCollision) return true; //early exit if we dont want to create a contact point to solve
          //this seems to be fine
          const ct = k2GetContact(world); // world.getContact();
          const n = vec2normalize(iSCPTmp6, v1);

          const depth = theCircle.radius - v1mag;

          const start = iSCPTmp7;
          start[0] = theCircle.position[0] + n[0] * -theCircle.radius;
          start[1] = theCircle.position[1] + n[1] * -theCircle.radius;

          const end = iSCPTmp8;
          end[0] = start[0] + n[0] * depth;
          end[1] = start[1] + n[1] * depth;

          ct.update(thePolygon, theCircle, depth, n[0], n[1], end[0], end[1]);
          //ct.update(bodyB, bodyA, start, end, n, depth);
        } //tmps 6, 7, 8 free again
      } else {
        if (distanceEdge > theCircle.radius) {
          return false;
        } else {
          //console.log("hello");
          //if (!resolveCollision) return true; //early exit if we dont want to create a contact point to solve
          const ct = k2GetContact(world); // world.getContact();
          const n = vec2subtract(iSCPTmp6, minNextVertex, minCurrVertex);
          vec2normalize(n, n);
          const tmp = n[0];
          n[0] = n[1];
          n[1] = -tmp;

          const depth = theCircle.radius - distanceEdge;

          const start = iSCPTmp7;
          start[0] = theCircle.position[0] - n[0] * theCircle.radius;
          start[1] = theCircle.position[1] - n[1] * theCircle.radius;

          const end = iSCPTmp8;
          end[0] = start[0] + n[0] * depth;
          end[1] = start[1] + n[1] * depth;

          ct.update(thePolygon, theCircle, -depth, n[0], n[1], end[0], end[1]);
        }
      }
    }
  } else {
    //if (!resolveCollision) return true; //early exit if we dont want to create a contact point to solve
    const ct = k2GetContact(world); // world.getContact();
    const n = vec2create();
    vec2subtract(n, minNextVertex, minCurrVertex);
    vec2normalize(n, n);
    const tmp = n[0];
    n[0] = n[1];
    n[1] = -tmp;

    const depth = theCircle.radius - distanceEdge;

    const start = vec2create();
    start[0] = theCircle.position[0] - n[0] * theCircle.radius;
    start[1] = theCircle.position[1] - n[1] * theCircle.radius;

    const end = vec2create();
    end[0] = start[0] + n[0] * depth;
    end[1] = start[1] + n[1] * depth;

    ct.update(thePolygon, theCircle, -depth, n[0], n[1], start[0], start[1]);
  }

  return true;
};

const iCPPTmp1 = vec2create();
const iCPPTmp2 = vec2create();
const iCPPTmp3 = vec2create();
const iCPPTmp4 = vec2create();
const iCPPTmp5 = vec2create();
const iCPPTmp6 = vec2create();
const iCPPTmp7 = vec2create();
const iCPPTmp8 = vec2create();

const contactPoints: Vec2[] = [vec2create(), vec2create()];
let contactPointSize = 0;
let contactPointMaxSize = contactPoints.length;
const clippedPoints: Vec2[] = [vec2create(), vec2create()];
let clippedPointSize = 0;
let clippedPointMaxSize = clippedPoints.length;

k2OverlapDetection[k2BodyType.POLYGON | k2BodyType.POLYGON] = function (
  world: IK2World,
  a: Polygon,
  b: Polygon
) {
  const aIndexRefEdge: Vec2 = iCPPTmp1;
  const bIndexRefEdge: Vec2 = iCPPTmp2;

  const aSupportPoint = iCPPTmp3;
  const bSupportPoint = iCPPTmp4;

  let abSeparation = findMinSeparation(a, b, aIndexRefEdge, aSupportPoint);
  if (abSeparation >= 0) return false;

  let baSeparation = findMinSeparation(b, a, bIndexRefEdge, bSupportPoint);
  if (baSeparation >= 0) return false;

  let refShape: Polygon;
  let incShape: Polygon;
  let indexRefEdge: number;
  let flip = false;

  if (abSeparation > baSeparation) {
    refShape = a;
    incShape = b;
    indexRefEdge = aIndexRefEdge[0];
  } else {
    refShape = b;
    incShape = a;
    indexRefEdge = bIndexRefEdge[0];
    flip = true;
  }

  const refShapeNormals = refShape.getNormals();
  const incShapeVerts = incShape.getWorldVerts();
  const refShapeVerts = refShape.getWorldVerts();
  const refEdgeNormal = refShapeNormals[indexRefEdge];

  //find incident edge
  const incidentIndex: number = findIncidentEdge(
    incShape,
    refShapeNormals[indexRefEdge]
  );
  const incidentIndexNext = (incidentIndex + 1) % incShapeVerts.length;

  const v0 = incShapeVerts[incidentIndex];
  const v1 = incShapeVerts[incidentIndexNext];

  //let contactPoints = [v0, v1];
  vec2copy(contactPoints[0], v0);
  vec2copy(contactPoints[1], v1);
  contactPointSize = 2;

  //const clippedPoints: Vec2[] = [];
  vec2copy(clippedPoints[0], v0);
  vec2copy(clippedPoints[1], v1);
  clippedPointSize = 2;
  //contactPoints.forEach((cp) => clippedPoints.push(vec2clone(cp)));

  for (let i = 0; i < refShape.getWorldVerts().length; i++) {
    if (i === indexRefEdge) continue;
    const c0 = refShapeVerts[i];
    const c1 = refShapeVerts[(i + 1) % refShapeVerts.length];

    //console.log(contactPoints, clippedPoints)
    let numClipped = clipToLineSegment(contactPoints, clippedPoints, c0, c1);
    if (numClipped > 2) break;

    //contactPoints = [];
    contactPointSize = 0;

    for (let u = 0; u < numClipped; u++) {
      if (contactPointSize > contactPointMaxSize) {
        contactPoints.push(vec2create());
        contactPointMaxSize++;
      }

      vec2copy(contactPoints[contactPointSize], clippedPoints[u]);
      contactPointSize++;
    }
    //clippedPoints.forEach((cp) => contactPoints.push(vec2clone(cp)));
  }

  const vref = refShapeVerts[indexRefEdge];
  for (let i = 0; i < clippedPointSize; i++) {
    const vclip = clippedPoints[i];
    const dif = vec2subtract(iCPPTmp5, vclip, vref);
    const separation = vec2dot(dif, refEdgeNormal);
    if (separation < 0) {
      //if (!resolveCollison) return true; //early exit if a collision is found

      const cp = k2GetContact(world);
      let end = iCPPTmp6;
      let start = vclip;
      const n = vec2copy(iCPPTmp7, refEdgeNormal);
      end[0] = vclip[0] + n[0] * -separation;
      end[1] = vclip[1] + n[1] * -separation;

      //TODO: remove the negative separation
      //cp.update(bodyA, bodyB, vclip, end, n, separation);
      if (flip) {
        const tmp = iCPPTmp8;
        //swap the start and the end
        vec2copy(tmp, start);
        vec2copy(start, end);
        vec2copy(end, tmp);

        //flip the normal;
        vec2negate(n, n);
      }

      cp.update(a, b, separation, n[0], n[1], end[0], end[1]);
    }
  }

  return true;
};

export default k2OverlapDetection;
