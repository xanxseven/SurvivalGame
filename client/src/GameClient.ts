import { types } from "../../shared/EntityTypes";
import { CLIENT_HEADER } from "../../shared/headers";
import { ITEM, Items } from "../../shared/Item";
import ObjectManagerAssigned from "../../shared/lib/ObjectManagerAssignedIds";
import { SPRITE } from "../../shared/Sprite";
import { getKeyState, getMouseState, isControlsDirty, mouse, mouseX, mouseY } from "./Controls";
import { Entity, getSnapShot, storeSnapShot } from "./Entity/Entity";
import { k2Renderer, k2Scene, k2Sprite, mAtlas, mNode, mPoint, mRenderer, mSprite, mText, mTexture } from "./Renderer";
import { flushStream, inStream, outStream, requestRespawn } from "./Socket";
import { Sprites } from "./Sprites";
import { lerpAngle } from "../../shared/Utilts";
import { HumanEntity } from "./Entity/Human";
import { HitAnimatedEntity, TreeEntity } from "./Entity/Tree";
import { Leaderboard_maxSize, Leaderboard_reposition, Leaderboard_showValue, Leaderboard_sprite, Leaderboard_updateValue } from "./UI/Leaderboard";
import { Hotbar_reposition, Hotbar_root, Hotbar_updateSlot } from "./UI/Hotbar";
import { RockEntity } from "./Entity/Rock";
import { activeVisibleDecorations, deactiveVisibleDecorations, initDecoration } from "./Decoration.ts/Decoration";
import { MobEntity } from "./Entity/MobEntity";


const canvas = document.getElementById("canvas") as HTMLCanvasElement;
//const renderer = new k2Renderer(canvas);
export const renderer = new mRenderer(canvas);
export const clientNames: Map<number, string> = new Map();

const game = new mNode();
const scene = new mNode();
game.add(scene);

export const root = new mNode();
export const gameWorldScene = new mNode();


export const worldLayer1 = new mNode();
export const worldLayer2 = new mNode();

gameWorldScene.add(worldLayer1);
gameWorldScene.add(worldLayer2);

export const gameTopScene = new mNode();
export const uiScene = new mNode();
export const GameClient_entities: ObjectManagerAssigned<Entity> = new ObjectManagerAssigned();
export let ourEid = -1;
export let tickRate = 0;

root.add(gameWorldScene);
root.add(gameTopScene);
root.add(uiScene);

export function GameClient_resize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  repositionUI();
}

export function repositionUI() {
  Leaderboard_reposition();
  Hotbar_reposition();
}

export function GameClient_init() {
  const text = new mText("Hello world!", {
    align: 'left',
    baseLine: 'top',
    fill: "red",
    fontFamily: 'Ariel',
    fontSize: 100,
  });

  uiScene.add(Leaderboard_sprite);
  uiScene.add(Hotbar_root)

  worldLayer2.add(text);
  repositionUI();

  initDecoration();
}

GameClient_init();

export function GameClient_render() {
  renderer.clearScreen("#e8e4e3");
  renderer.render(root);

  deactiveVisibleDecorations();
}

function pointInSprite(x: number, y: number, sprite: mSprite) {
  const position = sprite.position;
  const frame = sprite.frame;
  return (
    x >= position.x - frame.anchor.x * frame.scale.x &&
    x <= position.x + (frame.size.x - frame.anchor.x) * frame.scale.x &&
    y >= position.y - frame.anchor.y * frame.scale.y &&
    y <= position.y + (frame.size.y - frame.anchor.y) * frame.scale.y
  );
}

// @ts-ignore

export function mouseVsSprite(x: number, y: number, node: mNode, maxDepth = 1, accumX: number = 0, accumY = 0, currentDepth = 0): boolean {
  accumX += node.position.x;
  accumY += node.position.y

  if (currentDepth > maxDepth) return false;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child.visible) continue;
    if (child.isSprite) {
      if ((child as mSprite).onclick && pointInSprite(x - accumX, y - accumY, child as mSprite)) {
        ((child as mSprite).onclick as any)();
        return true;
      } else {
        if (mouseVsSprite(x, y, child, maxDepth, accumX, accumY, currentDepth + 1)) return true;;
      }
    } else {
      if (mouseVsSprite(x, y, child, maxDepth, accumX, accumY, currentDepth + 1)) return true;
    }
  }

  return false;
}

export function GameClient_update(now: number, delta: number) {


  if (isControlsDirty()) {
    const keyState = getKeyState();
    const mouseState = getMouseState();
    outStream.writeU8(CLIENT_HEADER.INPUT);
    outStream.writeU8(keyState);
    outStream.writeF32(mouseState);
    flushStream();
  }

  const entityArr = GameClient_entities.array;
  var render_timestamp = now - (1000.0 / tickRate);


  for (let i = 0; i < entityArr.length; i++) {
    const entity = entityArr[i];

    // Find the two authoritative positions surrounding the rendering timestamp.
    if (entity.doInterpolation) {
      var buffer = entity.buffer;

      // Drop older positions.
      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        storeSnapShot(buffer.shift() as any); // assume its not undefined
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];
        let factor = (render_timestamp - t0) / (t1 - t0);

        const root = entity.root;

        const newX = buffer[0][1] + (buffer[1][1] - buffer[0][1]) * factor;
        const newY = buffer[0][2] + (buffer[1][2] - buffer[0][2]) * factor;
        const newRotation = lerpAngle(buffer[0][3], buffer[1][3], factor);

        if (entity.type === types.PLAYER) {
          const distanceDelta = (root.position.x - newX) ** 2 + (root.position.y - newY) ** 2;
          const humanEntity = entity as HumanEntity;
          const item = Items[humanEntity.itemId];
          if (distanceDelta > 1) {
            if (entity.animationState !== item.anim.use && item.anim.move !== entity.animationState) entity.changeAnimState(item.anim.move);
          } else {
            if (entity.animationState !== item.anim.use && item.anim.idle !== entity.animationState) entity.changeAnimState(item.anim.idle);
          }
        }

        entity.setTransform(newX, newY, newRotation)
      }
    }

    if (entity.doUpdate) entity.update(delta);
  }

  if (ourEid !== -1 && GameClient_entities.has(ourEid)) {
    let ourEntity = GameClient_entities.find(ourEid) as HumanEntity;
    const sprite = ourEntity.root;
    gameWorldScene.position.x = renderer.scaledWidth * .5 - sprite.position.x;
    gameWorldScene.position.y = renderer.scaledHeight * .5 - sprite.position.y;
    ourEntity.setRotation(mouse - Math.PI * .5);
    activeVisibleDecorations(sprite.position.x, sprite.position.y, 1920, 1080);
  }
}

export function gameClient_addEntity(now: number, eid: number, type: number, x: number, y: number, rotation: number) {
  let entity: Entity;
  switch (type) {
    case types.PLAYER:
      entity = new HumanEntity(type);
      break;
    case types.TREE:
      entity = new TreeEntity(type);
      break;
    case types.ROCK:
      entity = new RockEntity(type);
      break;
    case types.WOLF:
      entity = new MobEntity(type);
      break;
    default:
      console.warn("Warning, defaulting entity: " + type);
      entity = new Entity(type);
      break;
  }
  entity.type = type;
  entity.id = eid;
  entity.buffer.push(getSnapShot(now, x, y, rotation));

  entity.root.setDepth(type);
  entity.setTransform(x, y, rotation);

  entity.addToScene();
  GameClient_entities.insert(entity);
  return entity;
}

export function GameClient_tryHit() {
}
export function GameClient_mouseDown() {
  if (mouseVsSprite(mouseX, mouseY, uiScene, 10)) {

  } else {
    outStream.writeU8(CLIENT_HEADER.MOUSE_DOWN);
    outStream.writeF32(getMouseState());
    flushStream();
  }
}

export function GameClient_mouseUp() {
  outStream.writeU8(CLIENT_HEADER.MOUSE_UP);
  flushStream();
}

export function GameClient_removeEntity(eid: number) {
  const entity = GameClient_entities.find(eid);
  GameClient_entities.deleteId(eid);
  entity.removeFromScene();
}

export function GameClient_unpackAddEntity(packetArrivalTime: number) {
  const type = inStream.readU8();
  const eid = inStream.readULEB128();
  const rotation = inStream.readF32() - Math.PI * .5;
  const x = inStream.readF32();
  const y = inStream.readF32();

  let entity = gameClient_addEntity(packetArrivalTime, eid, type, x, y, rotation);

  console.log("+", eid);
  // read additional data depending on the entity
  switch (entity.type) {
    case types.PLAYER:
      const cid = inStream.readU16();
      (<HumanEntity>entity).updateName(clientNames.get(cid) as string);
      const itemId = inStream.readU16();
      if (itemId !== (<HumanEntity>entity).itemId) {
        (<HumanEntity>entity).itemId = itemId; // do something to the skeleton
        (<HumanEntity>entity).changeItem(itemId);
      }
      break;
  }
}

export function GameClient_unpackUpdateEntity(packetArrivalTime: number) {
  const eid = inStream.readULEB128();
  const rotation = inStream.readF32() - Math.PI * .5;
  const x = inStream.readF32();
  const y = inStream.readF32();
  let entity = GameClient_entities.find(eid);
  entity.buffer.push(getSnapShot(packetArrivalTime, x, y, rotation));
}

export function GameClient_unpackRemoveEntity() {
  const eid = inStream.readULEB128();
  console.log("-", eid);
  GameClient_removeEntity(eid);
}

export function GameClient_unpackConfig() {
  const _tickRate = inStream.readU8();
  tickRate = _tickRate;
  console.log("tickRate, ", _tickRate);
}

export function GameClient_unpackSetOurEntity() {
  const eid = inStream.readULEB128();
  ourEid = eid;
  console.log('[Client] got our eid: ' + eid);
}

export function GameClient_unpackAddClient() {
  const id = inStream.readULEB128();
  const nickname = inStream.readString();
  clientNames.set(id, nickname);
  console.log(`[Client] new client joined! ${id} ${nickname}`);
}

export function GameClient_unpackSwapItem() {
  const eid = inStream.readULEB128();
  const itemId = inStream.readU16();

  let entity = GameClient_entities.find(eid);

  if (itemId !== (<HumanEntity>entity).itemId) {
    (<HumanEntity>entity).itemId = itemId; // do something to the skeleton
    (<HumanEntity>entity).changeItem(itemId);
  }
}

export function GameClient_unpackAction() {
  const eid = inStream.readULEB128();
  const action = inStream.readU8();
  let entity = GameClient_entities.find(eid);

  entity.changeAnimState(action);
}

export function GameClient_unpackHitBouceEffect() {
  const eid = inStream.readULEB128();
  const angle = inStream.readF32();
  let entity = GameClient_entities.find(eid) as HitAnimatedEntity;
  const range = 40;
  const x = Math.cos(angle) * range;
  const y = Math.sin(angle) * range;

  entity.setHit(x, y);
}

export function GameClient_unpackInventory() {
  const size = inStream.readU8();
  for (let i = 0; i < size; i++) {
    const itemId = inStream.readU16();
    const quantity = inStream.readU16();
    Hotbar_updateSlot(i, itemId, quantity);
  }
}

export function GameClient_unpackHealth() {
  const health = inStream.readU16();
}

export function GameClient_unpackDied() {
  requestRespawn();
}

export function GameClient_unpackLeaderboard() {
  const lbSize = inStream.readU8();
  for (let i = 0; i < lbSize; i++) {
    const cid = inStream.readU16();
    const score = inStream.readI32();
    Leaderboard_updateValue(i, clientNames.get(cid) as string, score);
  }

  for (let i = lbSize; i < Leaderboard_maxSize; i++) {
    Leaderboard_showValue(i, false);
  }
}