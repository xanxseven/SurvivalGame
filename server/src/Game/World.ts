//#region imports
import {
  createWorld,
  Types,
  defineComponent,
  defineQuery,
  addEntity,
  addComponent,
  pipe,
  IWorld,
  removeEntity,
  hasComponent,
  Changed,
} from 'bitecs'

export const collisionLayer = {
  MOB: 0x01,
  ENVIRONMENT: 0x02,
  ALL: 0xffff,
}

import EntityIdManager from "../../../shared/lib/EntityIDManager";
import GameServer from "../server/GameServer";
import { C_AttackTimer, C_Base, C_Body, C_ClientHandle, C_Controls, C_Health, C_HitBouceEffect, C_Inventory, C_Leaderboard, C_Mob, C_Mouse, C_Position, C_Rotation, C_Weilds } from "./Components";
import { networkTypes, types } from "../../../shared/EntityTypes";
import { k2CreateWorld, k2AddBody, k2StepWorld, k2RemoveBody, k2AABB } from "../Physics/index";
import k2Body, { k2BodyType } from '../Physics/Body/Body';
import k2Circle from '../Physics/Body/Circle';
import { ITEM, Items } from '../../../shared/Item';
import { Inventory_addItem } from './Inventory';
import { tickMob } from './Mob/MobAI';
//#endregion

const TMP_AABB = new k2AABB();

//#region Queries
const controlQuery = defineQuery([C_Body, C_Controls])
const bodyQuery = defineQuery([C_Body, C_Position]);
const hitBouceQuery = defineQuery([C_HitBouceEffect]);
const attackTimerQuery = defineQuery([C_AttackTimer]);
const healthQuery = defineQuery([C_AttackTimer]);
const mouseQuery = defineQuery([C_Mouse]);
const leaderboardQuery = defineQuery([C_ClientHandle, C_Leaderboard]);
const mobQuery = defineQuery([C_Mob]);

//#endregion

//#region systems
const bodySystem = (gameWorld: World, world: IWorld) => {
  const ents = bodyQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    const body = gameWorld.bodyMap.get(eid) as k2Body;
    const pos = body.position;
    C_Position.x[eid] = pos[0];
    C_Position.y[eid] = pos[1];
  }
}

const mouseSystem = (gameWorld: World, world: IWorld) => {
  const ents = mouseQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    if (C_Mouse.mouseDown[eid]) {


      if (!gameWorld.isAttackTimerActive(eid)) {
        if (Math.random() > .5) {
          gameWorld.changeEntityItem(eid, C_Weilds.itemId[eid] === ITEM.SWORD ? ITEM.FIST : ITEM.SWORD);
          gameWorld.server.sendChangeItem(eid, C_Weilds.itemId[eid]);
        }
        gameWorld.server.sendAction(eid, Items[C_Weilds.itemId[eid]].anim.use);
        gameWorld.startAttackTimer(eid, 200, 200);
      }
    }
  }
}

const mobSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = mobQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    tickMob(gameWorld, eid, delta);
  }
}

const healthSystem = (gameWorld: World, world: IWorld) => {
  const ents = healthQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
  }
}

const resetHitBouceSystem = (world: IWorld) => {
  const ents = hitBouceQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    C_HitBouceEffect.hitInThisFrame[eid] = 0;
  }
}

const controlSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = controlQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.alive[eid]) continue;
    const vel = C_Controls.vel[eid];
    const body = gameWorld.bodyMap.get(eid) as k2Body;
    body.applyImpulse(
      C_Controls.x[eid] * vel * delta,
      C_Controls.y[eid] * vel * delta
    )
  }
}

const attackTimerSystem = (gameWorld: World, world: IWorld, delta: number) => {
  const ents = attackTimerQuery(world)
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    if (!C_Base.active[eid] || !C_Base.active[eid]) continue;

    if (!C_AttackTimer.active[eid]) continue;

    // if entity is building up to the attack
    if (C_AttackTimer.attackDelay[eid] > 0) {
      C_AttackTimer.attackDelay[eid] -= delta;
      if (C_AttackTimer.attackDelay[eid] <= 0) {
        C_AttackTimer.attackDelay[eid] = 0;
        gameWorld.beginAction(eid);
      }
    } else if (C_AttackTimer.attackCooldown[eid] > 0) {
      // entity is cooling down after the attack
      C_AttackTimer.attackCooldown[eid] -= delta;
      if (C_AttackTimer.attackCooldown[eid] <= 0) {
        C_AttackTimer.active[eid] = 0; // set the timer to be inactive again
        C_AttackTimer.attackCooldown[eid] = 0;
        C_AttackTimer.attackDelay[eid] = 0;
      }
    } else {
      // case where something else has changed the delay
      C_AttackTimer.active[eid] = 0;
      C_AttackTimer.attackCooldown[eid] = 0;
      C_AttackTimer.attackDelay[eid] = 0;
    }
  }
}

//#endregion

export default class World {
  bodyMap: Map<number, k2Body> = new Map();
  k2World = k2CreateWorld();
  world = createWorld();
  entities: EntityIdManager = new EntityIdManager();
  server: GameServer;
  isUpdating: boolean = false; // a flag that is set when the game is updating to mitigate against some certain side effects such as when removing an entity
  toRemoveQueue: number[] = [];

  constructor(server: GameServer) {
    this.server = server;

    this.generateMap();
  }

  //#region Adding & removing entities
  addEntity(id: number) {
    this.entities.insert(id);
    k2AddBody(this.k2World, this.bodyMap.get(id));
    C_Base.active[id] = +true;
    C_Base.alive[id] = +true;
  }

  removeEntity(id: number, deleted = false) {
    if (!C_Base.active[id]) return; // cant remove object that is already removed
    C_Base.alive[id] = +false;

    if (this.isUpdating) {
      this.toRemoveQueue.push(id);
    } else {
      this.entities.remove(id);
      C_Base.active[id] = +false;

      if (this.bodyMap.has(id)) {
        const body = this.bodyMap.get(id);

        k2RemoveBody(this.k2World, body);
      }

      this.server.sendRemoveEntity(id);

      // if client leaves, entity cid is no longer pointer to a valid client
      if (!deleted) {
        if (hasComponent(this.world, C_ClientHandle, id)) {
          const cid = C_ClientHandle.cid[id];
          if (this.server.clients.has(cid)) {
            const client = this.server.clients.find(cid);
            this.server.sendClientOwnPlayerRemoved(client);
          }
        }
      }
    }
  }

  /**
   * @description Permadently removes entity from ECS world and game world, any thing with a reference to this eid needs to release , if you mean to just remove entity from world, maybe try just doing 'world.removeEntity'
   * @param eid 
   * @returns 
   */
  __deleteEID(eid: number) {
    if (eid === -1) return;
    if (this.isEntityActive(eid)) this.removeEntity(eid, true);
    removeEntity(this.world, eid);
    this.bodyMap.delete(eid);
  }
  //#endregion

  beginAction(eid: number) {
    const itemId = C_Weilds.itemId[eid];
    const item = Items[itemId];
    this.server.world.sweepAttack(eid, C_Position.x[eid], C_Position.y[eid], item.meeleDamage, item.meeleRange, C_Rotation.rotation[eid], Math.PI * .5);
  }

  changeEntityItem(eid: number, itemId: number) {
    C_Weilds.itemId[eid] = itemId;
    this.server.sendChangeItem(eid, itemId);
  }

  startAttackTimer(eid: number, attackDelay: number, attackCooldown: number) {
    C_AttackTimer.active[eid] = 1;
    C_AttackTimer.attackDelay[eid] = attackDelay;
    C_AttackTimer.attackCooldown[eid] = attackCooldown;
  }

  isAttackTimerActive(eid: number) {
    return !!C_AttackTimer.active[eid];
  }

  //#region Useful getters and setters
  setBodyPosition(eid: number, x: number, y: number) {
    const pos = this.bodyMap.get(eid);
    pos.setX(x);
    pos.setY(y);
  }

  setBodyRotation(eid: number, rotation: number) {
    const body = this.bodyMap.get(eid);
    body.setRotation(rotation);
  }

  isEntityActive(eid: number) {
    return eid !== -1 && !!C_Base.active[eid];
  }
  //#endregion

  get_angle_difference(a0: number, a1: number) {
    var max = Math.PI*2;
    var da = (a1 - a0) % max;
    return Math.abs(2*da % max - da);
  }

  queryRect(minx: number, miny: number, maxx: number, maxy: number, mask = 0xffff) {
    TMP_AABB.minX = minx;
    TMP_AABB.maxX = maxx;
    TMP_AABB.minY = miny;
    TMP_AABB.maxY = maxy;

    return this.server.world.k2World.tree.search(TMP_AABB, mask);
  }

  onEntityDie(eid: number) {
    C_Base.alive[eid] = 0;
    this.removeEntity(eid);
  }

  damage(dealer: number, target: number, damage: number) {
    if (target === -1) throw Error("Invalid eid");

    if (!C_Base.active[target] || !C_Base.alive[target]) return;

    const health = C_Health.health[target];
    const newHealth = Math.floor(health - damage);

    if (newHealth <= 0) {
      C_Health.health[target] = 0;
      this.onEntityDie(target);
    } else {
      C_Health.health[target] = newHealth;
      this.server.sendHealth(target, newHealth);
    }

  }

  sweepAttack(dealer: number, x: number, y: number, damage: number, range: number, startAngle: number, sweepAngle: number) {
    // construct a box around the origin, and look for all entities that are inside of it

    const maxx = x + range;
    const maxy = y + range;
    const minx = x - range;
    const miny = y - range;

    const AABB = new k2AABB();
    AABB.minX = minx;
    AABB.minY = miny;
    AABB.maxX = maxx;
    AABB.maxY = maxy;

    const dealerBody = this.bodyMap.get(dealer);

    const bodies = this.k2World.tree.search(AABB);
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];

      if (body.eid === -1) continue;

      const position = body.position;
      const distSqrd = (position[0] - x) ** 2 + (position[1] - y) ** 2;

      // because we are measuring the distance from center of circle, we need to subtract the radius to make it more accurate
      const sepperationOffset = (dealerBody && dealerBody.type === k2BodyType.CIRCLE ? (<k2Circle>dealerBody).radius : 0) + (body.type === k2BodyType.CIRCLE ? (<k2Circle>body).radius : 0)

      if (distSqrd - (sepperationOffset * sepperationOffset) > range * range) continue;
      if (dealer === body.eid) continue;

      const dx = body.position[0] - x;
      const dy = body.position[1] - y;
      const angle = Math.atan2(dy, dx);
      const angleDif = this.get_angle_difference(startAngle, angle);

      if (angleDif > sweepAngle) continue;

      const targetEid = body.eid;

      const force = 500;
      const forceX = Math.cos(angle) * force;
      const forceY = Math.sin(angle) * force;
      //body.applyImpulse(forceX, forceY)


      if (hasComponent(this.world, C_HitBouceEffect, targetEid)) {
        if (!C_HitBouceEffect.hitInThisFrame[targetEid]) {
          C_HitBouceEffect.hitInThisFrame[targetEid] = 1;
          this.server.sendHitBouceEffect(targetEid, angle);
        }
      }

      if (hasComponent(this.world, C_Health, targetEid)) {
        this.damage(dealer, targetEid, 40);
      }

      if (hasComponent(this.world, C_Leaderboard, dealer)) {
        C_Leaderboard.score[dealer] += 1;
      }
    }
  }

  buildLeaderboard(): [number, number][] {
    const eids = leaderboardQuery(this.world);
    let MAX = 10;
    let leaderboard: [number, number][] = []; //number, score

    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];
      const score = C_Leaderboard.score[eid];
      const cid = C_ClientHandle.cid[eid];

      var low = 0,
        high = leaderboard.length;

      while (low < high) {
        var mid = (low + high) >>> 1;
        if (leaderboard[mid][1] > score) low = mid + 1;
        else high = mid;
      }

      const index = low;
      if (index < MAX) {
        leaderboard.splice(index, 0, [cid, score]);
      }
    }

    return leaderboard;
  }

  //#region Updating the world
  update(delta: number) {

    const debug = false;
    debug && console.log("===================");
    const start = Date.now();
    this.isUpdating = true;

    const startMob = Date.now();
    mobSystem(this, this.world, delta);
    const endMob = Date.now();

    debug && console.log("Mob tick took: " + (endMob - startMob) + "ms")

    const ecs1 = Date.now();
    controlSystem(this, this.world, delta); // update entity controls
    mouseSystem(this, this.world);
    attackTimerSystem(this, this.world, delta);
    const ecs2 = Date.now();

    const physStart = Date.now();
    k2StepWorld(this.k2World); // update the physics world
    const physEnd = Date.now();
    debug && console.log("Phys tick took: " + (physEnd - physStart) + "ms");

    const ecs3 = Date.now();
    bodySystem(this, this.world); // do some post updates
    resetHitBouceSystem(this.world);
    const ecs4 = Date.now();

    debug && console.log("Ecs tick took: " + ((ecs2 - ecs1) + (ecs4 - ecs3)) + "ms");

    this.isUpdating = false;
    const end = Date.now();

    if (this.toRemoveQueue.length > 0) {
      for (let i = 0; i < this.toRemoveQueue.length; i++) {
        const eid = this.toRemoveQueue[i];
        this.removeEntity(eid);
      }
      this.toRemoveQueue.length = 0;
    }

    debug && console.log(`Update took ${end - start}ms`);
  }
  //#endregion

  //#region Creating entities
  createEID(type: number) {
    const eid = addEntity(this.world);
    addComponent(this.world, C_Base, eid, true);
    C_Base.active[eid] = +(false);
    C_Base.type[eid] = type;
    C_Base.networkTypes[eid] = networkTypes.ALL;
    return eid;
  }


  createWolf() {
    const eid = this.createEID(types.WOLF);
    addComponent(this.world, C_Position, eid, true);
    addComponent(this.world, C_Controls, eid, true);
    addComponent(this.world, C_Rotation, eid, true);
    addComponent(this.world, C_Body, eid, true);
    addComponent(this.world, C_AttackTimer, eid, true);
    addComponent(this.world, C_Health, eid, true);
    addComponent(this.world, C_Mob, eid, true);

    C_Mob.stateTimer[eid] = Math.random() * 5000; // start with some initial random spread to try decrease cluster size of mob querying the world
    const body = new k2Circle(0, 0, 110);

    body.drag = .6;

    body.eid = eid;
    body.categoryBits = collisionLayer.MOB;
    body.maskBits = collisionLayer.ENVIRONMENT;

    C_Rotation.rotation[eid] = 0;
    this.bodyMap.set(eid, body);

    return eid;
  }

  /**
   * @description Creates a player entity. Pass -1 as clientId for no associated client handle
   * @param {number} clientId associated client
   * @returns {number} eid
   */
  createPlayer(clientId: number) {
    const eid = this.createEID(types.PLAYER);
    addComponent(this.world, C_Position, eid, true);
    addComponent(this.world, C_Controls, eid, true);
    addComponent(this.world, C_Rotation, eid, true);
    addComponent(this.world, C_Body, eid, true);
    addComponent(this.world, C_AttackTimer, eid, true);
    addComponent(this.world, C_Inventory, eid, true);
    addComponent(this.world, C_Health, eid, true);
    addComponent(this.world, C_Mouse, eid, true);
    addComponent(this.world, C_Leaderboard, eid, true);

    if (clientId !== -1) {
      addComponent(this.world, C_ClientHandle, eid, true);
      C_ClientHandle.cid[eid] = clientId;
    }

    const body = new k2Circle(0, 0, 50);
    body.categoryBits = collisionLayer.MOB;
    body.maskBits = collisionLayer.ENVIRONMENT;

    body.drag = .6;
    body.eid = eid;

    this.bodyMap.set(eid, body);

    C_Health.health[eid] = C_Health.maxHealth[eid] = 100;
    C_Controls.vel[eid] = .950;

    Inventory_addItem(eid, ITEM.SWORD, 10);
    Inventory_addItem(eid, ITEM.SPEAR, 15);
    return eid;
  }

  createTree() {
    const eid = this.createEID(types.TREE);
    addComponent(this.world, C_Position, eid, true);
    addComponent(this.world, C_Body, eid, true);
    addComponent(this.world, C_Rotation, eid, true);
    addComponent(this.world, C_HitBouceEffect, eid, true);

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED;

    const body = new k2Circle(0, 0, 110);
    body.categoryBits = collisionLayer.ENVIRONMENT;
    body.setStatic();
    body.eid = eid;

    C_Rotation.rotation[eid] = 0;
    this.bodyMap.set(eid, body);

    return eid;
  }

  createRock() {
    const eid = this.createEID(types.ROCK);
    addComponent(this.world, C_Position, eid, true);
    addComponent(this.world, C_Body, eid, true);
    addComponent(this.world, C_Rotation, eid, true);
    addComponent(this.world, C_HitBouceEffect, eid, true);

    C_Base.networkTypes[eid] = networkTypes.ADDED | networkTypes.REMOVED;

    const body = new k2Circle(0, 0, 110);
    body.categoryBits = collisionLayer.ENVIRONMENT;
    body.setStatic();
    body.eid = eid;

    C_Rotation.rotation[eid] = 0;
    this.bodyMap.set(eid, body);

    return eid;
  }

  //#endregion

  //#region Generation of the map
  generateMap() {
    const spread = 5000;
    for (let i = 0; i < 50; i++) {
      const tree = this.createTree();
      this.setBodyPosition(tree, Math.random() * spread, Math.random() * spread);
      this.addEntity(tree);
    }

    for (let i = 0; i < 50; i++) {
      const tree = this.createRock();
      this.setBodyPosition(tree, Math.random() * spread, Math.random() * spread);
      this.addEntity(tree);
    }

    for (let i = 0; i < 0; i++) {
      const tree = this.createPlayer(-1);
      this.setBodyPosition(tree, Math.random() * 100000, Math.random() * 100000);
      this.addEntity(tree);
    }

    for (let i = 0; i < 1; i++) {
      const wolf = this.createWolf();
      this.setBodyPosition(wolf, Math.random() * 500, Math.random() * 500);
      this.addEntity(wolf);
    }
  }
  //#endregion
}