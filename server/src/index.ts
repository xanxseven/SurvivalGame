import { WebSocketServer } from 'ws';
import GameServer from './server/GameServer';

const wss = new WebSocketServer({ port: 8080 });
const server = new GameServer();

wss.on('connection', function connection(ws) {
  ws.binaryType = "arraybuffer";
  server.addClient(ws);
});