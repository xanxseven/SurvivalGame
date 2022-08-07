import Polygon from "./Body/Polygon";
import { Vec2 } from "./vector2";

function insidePoly(x: number, y: number, vs: Vec2[]) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function randomPointOnPolygon(polygon: Polygon): [number, number] {
  const bounds = polygon.getAABB();

  let inside = false;
  let x: number = 0;
  let y: number = 0;
  while (!inside) {
    x = Math.random() * (bounds.maxX - bounds.minX) + bounds.minX;
    y = Math.random() * (bounds.maxY - bounds.minY) + bounds.minY;
    inside = insidePoly(x, y, polygon.getWorldVerts());
  }

  return [x, y];
}