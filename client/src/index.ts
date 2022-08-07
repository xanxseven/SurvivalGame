import { GameClient_render, GameClient_resize, GameClient_update } from "./GameClient";
import "./Socket";

function init() {
  GameClient_resize(); // automatically resize the canvas for the first time
  window.addEventListener("resize", GameClient_resize); // attach a resize listener
}

let then = Date.now()
function tick() {
  const now = Date.now();
  const delta = (now - then) / 1000;
  then = now;
  GameClient_update(now, delta);
  GameClient_render(); // render the game world
  window.requestAnimationFrame(tick);
}

init();
tick();