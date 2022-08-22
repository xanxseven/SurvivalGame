import { WebSocketServer } from 'ws';
import GameServer from './server/GameServer';

const wss = new WebSocketServer({ port: 8080 });
const server = new GameServer();

// Added comment to test pull requests.
/*
// you code goes here

function hash1(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function hash2(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

function hash3(str, seed = 0) {
  var i, l,
    hval = (seed === undefined) ? 0x811c9dc5 : seed;

  for (i = 0, l = str.length; i < l; i++) {
    let c = hval ^ str.charCodeAt(i);
    hval = c;
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return hval >>> 0;
}

window["clientIntegrity"] = function(str1, str2, str3){
  return JSON.stringify([
    hash1(str1),
    hash2(str2),
    hash3(str3)
  ])
}
*/

const code = "Aa8EAABVU79rU3EQv7vv3fe9VEtbgpL2RU1CnqQBCW3BTaEIFQV1cHCWGmugTaFNKU6uTi7aRR0c3IuDXdwEB93FRf8CB3/h4CD6uRfT2oTkfe++d5/73N3n1eNqt78yuFMfW75zc+PC+q3u4qCuV27Co721rdX62NZmt7Y52OgtD+pxu9e/tb5dn1he7XX7g0v9QXdloze4W9fL169drZc8rL/Su313nmiemeYFv4CfMs0yPyOiGhHPspxiPzKOIQt+FBbWBptInA16Q4nOBpYwc47miClQDUbxCEhgFqGmBKmxSiaOwTohEjpyHMDwCAWbggMXkgyfKMCZcsi1xYGNKYpwVRyK6YRfLzBxaL8GywymEZ8Zls8AVxTEk3kSacbS4RsoRUJLIlkQIuWmBp0W0eJ2zYkgAZ15YnvTo5lMuAbiJF9+7/0cR0CoiLsUrg9PnzzQA5fBRTWJ6FAi3CxKTS0a1Y7MizfqTucXc27haEpVxXVDpJiKaIaJVkKwHNN78ePTt1IeWkUDVPXUBqJ9OmL/B+68ff/LPFCdRFXwvwAysf0cTfzDVmADn2yyjKyKKgZL+vnR7m6KCQ9LeKiO0I3ieNksjoq8/Phu52jBxmlXmLVgxFi9f74ukvz5c68RUD1kERAJINLJcpKklRiTPFIcVostCWZGHhoDwjRLQaw0Xk7TUgXheULJsFqC0GiRKuBRBSU7BvRUXUTeCpVhRphGOtq9BmyQmgwJK0+Cnil39HootrkESUGXZNwE2jSzFbc9uDwRavHE9rpHA5+1FoAzzINYjgCuww8LrDevvt9P24+HmVqEmodWOYgHuyCbplY1zC+zIBlehQkz7thFjAweg6eQA/SVS6ug6p0CKXoGOsacAAVl85S6bnAUnYLY476ZHDbTw2ZlZJ4EjC4oBWnvDTmbz0/VDmY3xzInoaFYXJoV76VyLqfZpZEDENOFwg55sAgIad9zPrALW329+J6Z+Qs=";

function hash1(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function hash2(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

function hash3(str: string, seed = 0) {
  /*jshint bitwise:false */
  var i, l,
    hval = (seed === undefined) ? 0x811c9dc5 : seed;

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return hval >>> 0;
}

wss.on('connection', function connection(ws) {
  ws.binaryType = "arraybuffer";

  const string1 = "" + Math.random();
  const string2 = "" + Math.random();
  const string3 = "" + Math.random();

  ws.send(JSON.stringify([code, [string1, string2, string3]]));

  ws.on("message", (e) => {
    try {
      let ret = JSON.parse(e as any) as any[];
      if (!ret || !Array.isArray(ret) || ret.length !== 3) return ws.close();

      if (
        ret[0] === hash1(string1) &&
        ret[1] === hash2(string2) &&
        ret[2] === hash3(string3)
      ) {
        ws.removeAllListeners();
        server.addClient(ws);
        ws.send("ready");
      } else {
        return ws.close();
      }

    } catch (e) {
      ws.close();
      return;
    }
  });

});
