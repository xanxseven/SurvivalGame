import {
  create as vec2create,
  copy as vec2copy,
  scale as vec2scale,
} from "./vector2";
import k2HashMap from "./hashMap";
import k2Body from "./Body/Body";
import k2SweptSolver from "./Detection.ts/RayIntersection";
import k2OverlapDetection from "./Detection.ts/Overlap";
import { k2Contact, k2RayContact } from "./Contacts";
import k2AABB, { k2AABBOverlap } from "./AABB";
import k2Solver from "./Solver/Solver";

export interface IK2World {
  tree: k2HashMap;
  bodies: k2Body[];
  pairs: k2Contact[];
  numContacts: number;
  maxContacts: number;
  contacts: k2Contact[];
  dt: number;
  invDt: number;
  allowedPenetration: number;
  biasFactor: number;
  iterations: number;
  elapsed: number;
  lastCall: number;
  accum: number;
  leave_collision_callback: (a: k2Body, b: k2Body) => void;
  enter_collision_callback: (a: k2Body, b: k2Body) => void;
}

export function k2CreateWorld(): IK2World {
  let dt = 1 / 10;
  const world: IK2World = {
    tree: new k2HashMap(),
    bodies: [],
    pairs: [],
    numContacts: 0,
    maxContacts: 0,
    contacts: [],
    leave_collision_callback: null,
    enter_collision_callback: null,
    dt: dt,
    invDt: 1 / dt,
    accum: 0,
    lastCall: Date.now(),
    elapsed: 0,
    allowedPenetration: 0.05,
    biasFactor: 0.3,
    iterations: 10,
  };

  return world;
}

export function k2AddBody(world: IK2World, body: k2Body) {
  const len = world.bodies.length;
  world.bodies.push(body);
  body._index = len;
  world.tree.insert(body);
}

export function k2RemoveBody(world: IK2World, body: k2Body) {
  const bodies = world.bodies;
  const len = bodies.length - 1;
  const index = body._index;

  if (len !== index) {
    const tmp = world.bodies[len];
    bodies[len] = bodies[index];
    bodies[index] = tmp;
    tmp._index = index;
  }

  bodies.pop();
  world.tree.remove(body);
}

export function k2GetContact(world: IK2World): k2Contact {
  if (world.numContacts < world.maxContacts) {
    const contact = world.contacts[world.numContacts];
    world.numContacts++;
    return contact;
  }

  const contact = new k2Contact(world);
  world.contacts.push(contact);
  world.numContacts++;
  world.maxContacts++;

  return contact;
}

const TMP_SWEPT_RESULT = new k2RayContact();

let collisions: { [key: string]: k2Body[] } = {};
let oldCollisions: { [key: string]: k2Body[] } = {};

const TMP_AABB = new k2AABB();
const TMP_VEC2 = vec2create();

const TMP_VEC2_1 = vec2create();

const maxSubSteps = 10;

export function k2StepWorld(world: IK2World) {
  _k2StepWorld(world);
  //let now = Date.now();
  //var delta = (now - world.lastCall) / 1000;

  ////Cache the current timestep so we can figure out the next delta
  //world.lastCall = now;

  //// Add the delta to the "accumulator"
  //world.accum += delta;
  //world.elapsed += delta;

  //// As long as the accumulated time passed is greater than your "timestep"
  //var substeps = 0;
  //while (world.accum >= world.dt && substeps < maxSubSteps) {
    //// Update the game's internal state (i.e. physics, logic, etc)
    //_k2StepWorld(world);

    //// Subtract one "timestep" from the accumulator
    //world.accum -= world.dt;
    //world.elapsed = 0;

    //substeps++;
  //}

  //const lerpBodiesEnabled = true;
  //if (lerpBodiesEnabled) {
  //const dt = this.dt;
  //const bodies = this.bodies;
  //var t = (this.accum % dt) / dt;
  //var Nbodies = bodies.length;
  //for (let i = 0; i < Nbodies; i++) {
  //const body = bodies[i];
  //vec2lerp(body.lerpPosition, body.oldPosition, body.position, t);
  //body.lerpRotation = angleLerp(body.oldRotation, body.rotation, t);
  //}
  //}
}

function _k2StepWorld(world: IK2World) {
  const dt = world.dt;
  const bodies = world.bodies;
  const len = bodies.length;

  // RESET THE NUMBER OF CONTACTS
  world.numContacts = 0;

  // PERFORM COLLISION LOGIC
  let a: k2Body = null;
  let b: k2Body = null;
  for (let i = 0; i < len; i++) {
    a = bodies[i];

    if (!a.performsCollisionSearch || a._static) continue;

    const query = world.tree.search(a.getAABB()) as k2Body[];
    const queryLen = query.length;

    for (let u = 0; u < queryLen; u++) {
      b = query[u];

      if (
        a !== b &&
        !b.isSensor &&
        (a.maskBits & b.categoryBits) != 0 &&
        (a.categoryBits & b.maskBits) != 0 &&
        (true && k2AABBOverlap(a.getAABB(), b.getAABB())) &&
        k2OverlapDetection[a.type | b.type](world, a, b)
      ) {
        // SENSORS ONLY EMIT A COLLISION EVENT, THEY DO NOT RESOLVE
        if (a.isSensor) {
          if (
            world.leave_collision_callback ||
            world.enter_collision_callback
          ) {
            let hash = a.id > b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
            const data = [a, b];
            if (world.enter_collision_callback && !oldCollisions[hash]) {
              world.enter_collision_callback.apply(this, data);
            }
            collisions[hash] = data;
          }
          continue;
        }
      }
    }
  }

  // EMIT A 'LEAVE" COLLISION EVENT FOR SENSORS
  if (world.leave_collision_callback) {
    for (let hash in oldCollisions)
      if (!collisions[hash]) {
        world.leave_collision_callback.apply(this, oldCollisions[hash]); //some sort of event that its left collision
        delete oldCollisions[hash];
      }

    oldCollisions = collisions;
    collisions = {};
  }

  // SOLVE WORLD CONTACTS
  if (world.numContacts > 0) k2Solver(world);

  // INTEGRATE VELOCITIES AND PERFORM CCD
  for (let i = 0; i < len; i++) {
    const body = bodies[i];
    if (body._static || !body.performsCollisionSearch) continue;

    // integrate the velocity
    let integratedVelocity = vec2scale(TMP_VEC2, body.velocity, dt);

    if (body.bullet) {
      // perform CCD on bullets
      const aabb = body.getAABB();
      let minX = aabb.minX;
      let minY = aabb.minY;
      let maxX = aabb.maxX;
      let maxY = aabb.maxY;

      if (body.velocity[0] > 0) maxX += body.velocity[0];
      else minX += body.velocity[0];

      if (body.velocity[1] > 0) maxY += body.velocity[1];
      else minY += body.velocity[1];

      TMP_AABB.minX = minX;
      TMP_AABB.minY = minY;
      TMP_AABB.maxX = maxX;
      TMP_AABB.maxY = maxY;

      const query = world.tree.search(TMP_AABB) as k2Body[];
      const query_len = query.length;
      let nearestBody: k2Body = null;
      let nearestTime = 1.0;
      const normal = TMP_VEC2_1;

      for (let u = 0; u < query_len; u++) {
        const otherBody = query[u];
        if (
          body !== otherBody &&
          otherBody._static &&
          (body.maskBits & otherBody.categoryBits) != 0 &&
          (body.categoryBits & otherBody.maskBits) != 0 &&
          k2SweptSolver[body.type | otherBody.type](
            TMP_SWEPT_RESULT,
            dt,
            body,
            otherBody
          )
        ) {
          if (TMP_SWEPT_RESULT.time < nearestTime) {
            nearestTime = TMP_SWEPT_RESULT.time;
            nearestBody = otherBody;
            vec2copy(normal, TMP_SWEPT_RESULT.normal);
          }
        }
      }

      if (nearestBody && nearestTime > 0.0001) {
        vec2scale(integratedVelocity, integratedVelocity, nearestTime);
        body.position[0] += -normal[0] * 1;
        body.position[1] += -normal[1] * 1;
      }
    }

    body.translate(integratedVelocity[0], integratedVelocity[1]);

    const drag = 1 - body.drag;
    body.velocity[0] *= drag;
    body.velocity[1] *= drag;
  }

  // UPDATE THE WORLD SPATIAL PARTITION
  world.tree.update_system();
}
