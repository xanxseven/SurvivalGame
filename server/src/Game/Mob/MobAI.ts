// lets use a statemachine design for the mob ai

import { types } from "../../../../shared/EntityTypes";
import { C_Base, C_Controls, C_Mob, C_Position, C_Rotation } from "../Components";
import World, { collisionLayer } from "../World";

const MOB_STATE = {
  IDLE: 0,
  IDLE_WALK: 1,
  SEARCH_ENTITY: 2,
  CHASE_ENTITY: 3,
}

function stateToString(state: number) {
  for (let x in MOB_STATE) {
    if (MOB_STATE[x] === state) {
      return x;
    }
  }

  return "undefined";
}

export function tickHostile(world: World, eid: number, delta: number) {
  const state = C_Mob.state[eid];
  console.log(state);

  switch (state) {
    case MOB_STATE.IDLE:
      C_Controls.x[eid] = 1;
      C_Controls.vel[eid] = 10;
      break;
  }
}

export function tickPassive(world: World, eid: number, delta: number) {
  const state = C_Mob.state[eid];

  //console.log(stateToString(state));

  switch (state) {
    case MOB_STATE.CHASE_ENTITY:
      const target = C_Mob.targetEid[eid]

      if (!C_Base.active[target] || !C_Base.alive[target]) {
        C_Mob.stateTimer[eid] = 0; // we will request to go into next state
        break;
      }

      const theirX = C_Position.x[target];
      const thierY = C_Position.y[target];
      const ourX = C_Position.x[eid];
      const ourY = C_Position.y[eid];
      let dx = theirX - ourX;
      let dy = thierY - ourY;

      const distSqrd = dx ** 2 + dy ** 2;

      if (distSqrd >= (500 ** 2)) {
        C_Mob.stateTimer[eid] = 0; // we will request to go into next state
        break;
      }

      const invDist = distSqrd ? 1 / Math.sqrt(distSqrd) : 0;
      dx *= invDist;
      dy *= invDist;

      C_Controls.x[eid] = dx;
      C_Controls.y[eid] = dy;
      C_Rotation.rotation[eid] = Math.atan2(dy, dx);
      break;
  }

  switch (state) {
    case MOB_STATE.IDLE_WALK:
      C_Mob.stateTimer[eid] -= delta;
      if (C_Mob.stateTimer[eid] <= 0) {
        C_Mob.stateTimer[eid] = 500;
        C_Mob.state[eid] = MOB_STATE.IDLE;
        C_Controls.x[eid] = 0;
        C_Controls.y[eid] = 0;
      }
      break;
    case MOB_STATE.CHASE_ENTITY:
      // dont decrease timer while chasing, since once entity leave activation range, it will set state timer to 0
      if (C_Mob.stateTimer[eid] <= 0) {
        C_Mob.state[eid] = MOB_STATE.IDLE;
        C_Mob.stateTimer[eid] = 300;
        C_Controls.x[eid] = 0;
        C_Controls.y[eid] = 0;
      }
      break;
    case MOB_STATE.SEARCH_ENTITY:
      const x = C_Position.x[eid];
      const y = C_Position.y[eid];
      const query = world.queryRect(x - 500, y - 500, x + 500, y + 500, collisionLayer.MOB);
      const playersFound: number[] = [];

      for (let i = 0; i < query.length; i++) {
        const body = query[i];
        const queryEid = body.eid;
        if (queryEid === eid || queryEid == -1 || !C_Base.active[queryEid] || !C_Base.active[queryEid] || C_Base.type[queryEid] !== types.PLAYER) continue;
        playersFound.push(queryEid);
      }

      if (playersFound.length) {
        let nearestPlayer = playersFound[0];
        let nearestDist = Infinity;
        for (let i = 0; i < playersFound.length; i++) {
          const theirEid = playersFound[i];
          const theirX = C_Position.x[theirEid];
          const theirY = C_Position.x[theirEid];
          const distSqrd = (x - theirX) ** 2 + (y - theirY) ** 2;
          if (distSqrd < nearestDist) {
            nearestDist = distSqrd;
            nearestPlayer = theirEid;
          }
        }

        C_Mob.stateTimer[eid] = 300;
        C_Mob.state[eid] = MOB_STATE.CHASE_ENTITY;
        C_Mob.targetEid[eid] = nearestPlayer;
      } else {
        C_Mob.stateTimer[eid] = 300;
        C_Mob.state[eid] = MOB_STATE.IDLE_WALK;
      }
      break;
    case MOB_STATE.IDLE:
      C_Mob.stateTimer[eid] -= delta;
      if (C_Mob.stateTimer[eid] <= 0) {
        C_Mob.stateTimer[eid] = 4000;
        C_Mob.state[eid] = MOB_STATE.SEARCH_ENTITY;

        const angle = Math.random() * Math.PI * 2;
        C_Rotation.rotation[eid] = angle;
        C_Controls.x[eid] = Math.cos(angle);
        C_Controls.y[eid] = Math.sin(angle);
        C_Controls.vel[eid] = 0.7;
        C_Mob.timer[eid] = 3000;
      }
      break;
  }
}

export function tickMob(world: World, eid: number, delta: number) {
  const isHostile = C_Mob.isHostile[eid];

  if (isHostile) tickHostile(world, eid, delta);
  else tickPassive(world, eid, delta);
}