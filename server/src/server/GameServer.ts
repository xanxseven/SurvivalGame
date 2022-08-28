import World from "../Game/World";
import ObjectManager from "../../../shared/lib/ObjectManager";
import { WebSocket } from "ws";
import { Client } from "./Client";
import { SERVER_HEADER } from "../../../shared/headers";
import { C_Inventory } from "../Game/Components";

export default class GameServer {
  clients: ObjectManager<Client> = new ObjectManager();
  world: World = new World(this);
  tickRate: number = 15;

  constructor() {
    setInterval(() => {
      this.tick();
    }, 1000 / this.tickRate);
  }

  tick() {
    const delta = (1000 / this.tickRate);
    this.world.update(delta);

    this.sendLeaderboard(this.world.buildLeaderboard());

    const clients = this.clients.array;
    for (let u = 0; u < clients.length; u++) {
      const client = clients[u];
      if (!client.ready) continue;

      client.buildSnapshot();
      client.flushStream();
    }
  }

  // adding and removing clients from the server 
  isServerFull() {
    return false;
  }

  addClient(socket: WebSocket) {
    if (this.isServerFull()) return void socket.close();

    // add the client to the game
    const client = new Client(this, socket);
    this.clients.insert(client);
    client.onceReady();

    console.log(`[Server] Client (${client.id}) connected!`);
  }

  removeClient(client: Client) {
    console.log(`[Server] Client (${client.id}) disconnected!`);
    this.clients.remove(client);
  }

  // sending notifications to clients
  broadcast() { }
  broadcastExceptTo(exceptionClient: Client) { }

  // sending events
  sendPlayerSpawned(player: number, ownerClient: Client) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;

      if (!client.ready) continue;

      stream.writeU8(SERVER_HEADER.ADD_CLIENT);
      stream.writeLEB128(ownerClient.id);
      stream.writeString(ownerClient.nickname);
      client.flushStream();
    }

    ownerClient.stream.writeU8(SERVER_HEADER.SET_OUR_ENTITY);
    ownerClient.stream.writeLEB128(ownerClient.eid);
    ownerClient.flushStream();
  }

  sendLeaderboard(lbData: [number, number][]) {
    const clients = this.clients.array;
    const leaderboardSize = lbData.length;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;
      if (!client.ready) continue;

      stream.writeU8(SERVER_HEADER.LEADERBOARD);
      stream.writeU8(leaderboardSize)

      for (let u = 0; u < lbData.length; u++) {
        const cid = lbData[u][0];
        const score = lbData[u][1];
        stream.writeU16(cid);
        stream.writeI32(score);
      }
    }
  }

  sendClanData() { }

  sendRemoveEntity(eid: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const stream = client.stream;

      if (!client.ready) continue;
      if (client.visibleEntities.has(eid)) {
        client.visibleEntities.remove(eid);
        stream.writeU8(SERVER_HEADER.REMOVE_ENTITY);
        stream.writeLEB128(eid);
      }
    }
  }

  // send all player's that are spawned to the client
  sendClientInitilise(initClient: Client) {
    const clients = this.clients.array;
    const initStream = initClient.stream;

    initStream.writeU8(SERVER_HEADER.CONFIG);
    initStream.writeU8(this.tickRate);

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      if (client === initClient) continue;
      if (!client.ready) continue;
      if (!this.world.isEntityActive(client.eid)) continue;

      initStream.writeU8(SERVER_HEADER.ADD_CLIENT);
      initStream.writeLEB128(client.id);
      initStream.writeString(client.nickname);
    }

    // write the inventory into the stream
    this.sendInventory(initClient.eid, initClient);

    initClient.flushStream();
  }

  sendChangeItem(eid: number, newItemId: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.SWAP_ITEM);
      stream.writeLEB128(eid);
      stream.writeU16(newItemId);
    }
  }

  sendHealthFoodHunger(client: Client, health: number, food: number, hunger: number){
    const stream = client.stream;
    stream.writeU8(SERVER_HEADER.HEALTH);
    stream.writeU8(health);
    stream.writeU8(food);
    stream.writeU8(hunger);
  }

  sendAction(eid: number, actionId: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.ACTION);
      stream.writeLEB128(eid);
      stream.writeU8(actionId);
    }
  }

  sendHitBouceEffect(eid: number, direction: number) {
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.HIT_BOUNCE_EFFECT);
      stream.writeLEB128(eid);
      stream.writeF32(direction);
    }
  }

  sendClientOwnPlayerRemoved(client: Client) {
    const stream = client.stream;
    stream.writeU8(SERVER_HEADER.DIED);
    client.flushStream(); // need to flush the current buffer to the client
  }

  sendInventory(eid: number, client: Client) {
    const stream = client.stream;
    const inventory = C_Inventory.items[eid];


    const size = inventory.length / 2;
    stream.writeU8(SERVER_HEADER.INVENTORY);
    stream.writeU8(size);
    for (let i = 0; i < size; i += 2) {
      stream.writeU16(inventory[i + 0]);
      stream.writeU16(inventory[i + 1]);
    }
  }

  sendChat(eid: number, message: string){
    const clients = this.clients.array;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.ready) continue;
      if (!client.visibleEntities.has(eid)) continue;

      const stream = client.stream;
      stream.writeU8(SERVER_HEADER.CHAT);
      stream.writeLEB128(eid);
      stream.writeString(message);
    }
  }
}