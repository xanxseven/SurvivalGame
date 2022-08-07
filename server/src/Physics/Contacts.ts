import k2Body from "./Body/Body";
import { Vec2, create as vec2create } from "./vector2";
import { IK2World } from "./world";

export class k2Contact {
  bodyA: k2Body;
  bodyB: k2Body;

  separation = 0.0;
  massNormal = 0.0;
  massTangent = 0.0;
  bias = 0.0;
  friction = 0.0;
  allowedPenetration: number;
  biasFactor: number;

  constructor(world: IK2World) {
    this.allowedPenetration = world.allowedPenetration;
    this.biasFactor = -world.biasFactor * world.invDt;
  }

  position: Vec2 = vec2create();
  normal: Vec2 = vec2create();
  r1: Vec2 = vec2create();
  r2: Vec2 = vec2create();
  rv: Vec2 = vec2create();

  Pn = 0.0; // accumulated normal impulse
  Pt = 0.0; // accumulated tangent impulse

  update(
    bodyA: k2Body,
    bodyB: k2Body,
    separation: number,
    nx: number,
    ny: number,
    px: number,
    py: number
  ) {
    const friction = Math.sqrt(bodyA.friction * bodyB.friction);
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.separation = separation;
    this.normal[0] = nx;
    this.normal[1] = ny;
    this.Pn = 0.0;
    this.Pt = 0.0;
    this.friction = friction;

    // slide contact point onto reference face (easy to cull)
    this.position[0] = px;
    this.position[1] = py;

    this.r1[0] = this.position[0] - bodyA.position[0];
    this.r1[1] = this.position[1] - bodyA.position[1];
    this.r2[0] = this.position[0] - bodyB.position[0];
    this.r2[1] = this.position[1] - bodyB.position[1];

    // Precompute normal mass, tangent mass, and bias.
    let rn1 = this.r1[0] * this.normal[0] + this.r1[1] * this.normal[1];
    let rn2 = this.r2[0] * this.normal[0] + this.r2[1] * this.normal[1];

    this.massNormal =
      1.0 /
      (bodyA.invMass +
        bodyB.invMass +
        bodyA.invInertia *
          (this.r1[0] * this.r1[0] + this.r1[1] * this.r1[1] - rn1 * rn1) +
        bodyB.invInertia *
          (this.r2[0] * this.r2[0] + this.r2[1] * this.r2[1] - rn2 * rn2));
    let rt1 = this.r1[0] * this.normal[1] - this.r1[1] * this.normal[0];
    let rt2 = this.r2[0] * this.normal[1] - this.r2[1] * this.normal[0];

    this.massTangent =
      1.0 /
      (bodyA.invMass +
        bodyB.invMass +
        bodyA.invInertia *
          (this.r1[0] * this.r1[0] + this.r1[1] * this.r1[1] - rt1 * rt1) +
        bodyB.invInertia *
          (this.r2[0] * this.r2[0] + this.r2[1] * this.r2[1] - rt2 * rt2));
    this.bias =
      this.biasFactor *
      Math.min(0.0, this.separation + this.allowedPenetration);
  }

  relativeVelocity() {
    this.rv[0] =
      this.bodyB.velocity[0] +
      -this.bodyB.angularVelocity * this.r2[1] -
      this.bodyA.velocity[0] -
      -this.bodyA.angularVelocity * this.r1[1];
    this.rv[1] =
      this.bodyB.velocity[1] +
      this.bodyB.angularVelocity * this.r2[0] -
      this.bodyA.velocity[1] -
      this.bodyA.angularVelocity * this.r1[0];
  }

  impulse(px: number, py: number) {
    this.bodyA.velocity[0] -= this.bodyA.invMass * px;
    this.bodyA.velocity[1] -= this.bodyA.invMass * py;
    this.bodyA.angularVelocity -=
      this.bodyA.invInertia * (this.r1[0] * py - this.r1[1] * px);
    this.bodyB.velocity[0] += this.bodyB.invMass * px;
    this.bodyB.velocity[1] += this.bodyB.invMass * py;
    this.bodyB.angularVelocity +=
      this.bodyB.invInertia * (this.r2[0] * py - this.r2[1] * px);
  }

  // solve the system of linear equations, some possible optimisations
  // is to increase speed of crammers rule
  applyImpulse() {
    let dPn, Pn0, maxPt;
    // Relative velocity at contact
    this.relativeVelocity();
    // Compute normal impulse
    dPn =
      this.massNormal *
      (-(this.rv[0] * this.normal[0] + this.rv[1] * this.normal[1]) +
        this.bias);

    // Clamp the accumulated impulse
    Pn0 = this.Pn;
    this.Pn = Math.max(Pn0 + dPn, 0.0);
    dPn = this.Pn - Pn0;
    // Apply contact impulse
    this.impulse(this.normal[0] * dPn, this.normal[1] * dPn);
    // Relative velocity at contact
    this.relativeVelocity();
    dPn =
      -this.massTangent *
      (this.rv[0] * this.normal[1] - this.rv[1] * this.normal[0]);
    // Compute friction impulse
    maxPt = this.friction * this.Pn;
    // Clamp friction
    Pn0 = this.Pt;
    this.Pt = Math.max(-maxPt, Math.min(Pn0 + dPn, maxPt));
    dPn = this.Pt - Pn0;
    // Apply contact impulse
    this.impulse(this.normal[1] * dPn, -this.normal[0] * dPn);
  }
}

export class k2RayContact {
  normal: Vec2 = vec2create();
  time: number = 0;
}
