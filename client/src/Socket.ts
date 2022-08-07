import { CLIENT_HEADER, SERVER_HEADER } from "../../shared/headers";
import { StreamReader, StreamWriter } from "../../shared/lib/StreamWriter";
import { GameClient_unpackAction, GameClient_unpackAddClient, GameClient_unpackAddEntity, GameClient_unpackConfig, GameClient_unpackDied, GameClient_unpackHealth, GameClient_unpackHitBouceEffect, GameClient_unpackInventory, GameClient_unpackLeaderboard, GameClient_unpackRemoveEntity, GameClient_unpackSetOurEntity, GameClient_unpackSwapItem, GameClient_unpackUpdateEntity } from "./GameClient";

export const outStream = new StreamWriter();
export const inStream = new StreamReader();
const ws = new WebSocket("ws://localhost:8080");

ws.binaryType = "arraybuffer";

ws.onopen = function () {
  console.log("Websocket connection opened!");

  setTimeout(() => {
    requestRespawn();
  });
}

export function requestRespawn() {
  outStream.writeU8(CLIENT_HEADER.REQUEST_RESPAWN);
  flushStream();
}

ws.onclose = function () {
  console.log("Websocket disconencted!");
}

export function flushStream() {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(outStream.bytes());
  outStream.reset();
}

ws.onmessage = function (data) {
  const now = Date.now();
  inStream.readFrom(data.data);

  while (inStream.hasMoreData()) {
    const header = inStream.readU8();
    switch (header) {
      case SERVER_HEADER.ADD_CLIENT:
        GameClient_unpackAddClient();
        break;
      case SERVER_HEADER.REMOVE_ENTITY:
        GameClient_unpackRemoveEntity();
        break;
      case SERVER_HEADER.SET_OUR_ENTITY:
        GameClient_unpackSetOurEntity();
        break;
      case SERVER_HEADER.CONFIG:
        GameClient_unpackConfig();
        break;
      case SERVER_HEADER.ADD_ENTITY:
        GameClient_unpackAddEntity(now);
        break;
      case SERVER_HEADER.SWAP_ITEM:
        GameClient_unpackSwapItem();
        break;
      case SERVER_HEADER.UPDATE_ENTITY:
        GameClient_unpackUpdateEntity(now);
        break;
      case SERVER_HEADER.ACTION:
        GameClient_unpackAction();
        break;
      case SERVER_HEADER.HIT_BOUNCE_EFFECT:
        GameClient_unpackHitBouceEffect();
        break;
      case SERVER_HEADER.INVENTORY:
        GameClient_unpackInventory();
        break;
      case SERVER_HEADER.UPDATE_HEALTH:
        GameClient_unpackHealth();
        break;
      case SERVER_HEADER.DIED:
        GameClient_unpackDied();
        break;
      case SERVER_HEADER.LEADERBOARD:
        GameClient_unpackLeaderboard();
        break;
      default:
        throw "u " + header;
    }
  }
}