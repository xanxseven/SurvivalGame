import { IK2World } from "../world";

export default function k2Solver(world: IK2World) {

  const Ncontacts = world.numContacts;
  const contacts = world.contacts;
  const iterations = world.iterations;

  for (let j = 0; j < iterations; j++) {
    for (let i = 0; i < Ncontacts; i++) contacts[i].applyImpulse();
  }
}
