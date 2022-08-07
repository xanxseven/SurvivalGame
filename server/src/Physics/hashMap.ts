import k2AABB from "./AABB";
import k2Body, { k2BodyType } from "./Body/Body";
import Circle from "./Body/Circle";
import Polygon from "./Body/Polygon";

let shift = 500; // how big each grid is (bigger = fastery query but less accurate)

export default class k2HashMap {
  objects: k2Body[] = [];
  grid: { [key: string]: k2Body[] } = {};
  duplicates: Map<number, boolean> = new Map();

  remove(obj: k2Body, remove_from_objects: boolean = true) {
    if (remove_from_objects) {
      if (obj._hash_index === -1)
        throw new Error("[Spatial Grid] Object was already removed!");
      const index = obj._hash_index;
      const len = this.objects.length - 1;

      if (index !== len) {
        const tmp = this.objects[len];
        this.objects[len] = this.objects[index];
        this.objects[index] = tmp;
        tmp._hash_index = index;
      }

      this.objects.pop();
      obj._hash_index = -1;
    }

    for (let hash in obj._hash_grids) {
      const index = obj._hash_grids[hash];
      const bucket = this.grid[hash];
      const len = bucket.length - 1;

      if (index !== len) {
        const tmp = bucket[len];
        bucket[len] = bucket[index];
        bucket[index] = tmp;
        tmp._hash_grids[hash] = index;
      }

      bucket.pop();

      if (bucket.length === 0) delete this.grid[hash];
      delete obj._hash_grids[hash];
    }
  }

  insert(obj: k2Body, insert_into_objects: boolean = true) {
    const aabb = obj.getAABB();

    let minX = Math.floor(aabb.minX / shift);
    let minY = Math.floor(aabb.minY / shift);
    let maxX = Math.ceil(aabb.maxX / shift);
    let maxY = Math.ceil(aabb.maxY / shift);

    if (insert_into_objects) {
      const len = this.objects.length;
      this.objects.push(obj);
      obj._hash_index = len;
    }

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        let hash = x + ":" + y;
        if (!this.grid[hash]) this.grid[hash] = [];
        let bucket = this.grid[hash];
        let len = bucket.length;
        bucket[len] = obj;
        obj._hash_grids[hash] = len;
      }
    }
  }

  search(aabb: k2AABB, mask: number = 0xFFFF): k2Body[] {
    let minX = Math.floor(aabb.minX / shift);
    let minY = Math.floor(aabb.minY / shift);
    let maxX = Math.ceil(aabb.maxX / shift);
    let maxY = Math.ceil(aabb.maxY / shift);

    const data = [];
    const duplicates = this.duplicates;
    duplicates.clear();

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        let hash = x + ":" + y;
        if (this.grid[hash]) {
          const bucket = this.grid[hash];
          for (let i = 0; i < bucket.length; i++) {
            let v = bucket[i]._hash_index;
            if ((bucket[i].categoryBits & mask) !== 0) {
              if (!duplicates.has(v)) {
                data.push(bucket[i]);
                duplicates.set(v, true);
              }
            }
          }
        }
      }
    }

    return data;
  }

  update_system() {
    const objects = this.objects;
    const len = objects.length;
    let obj: k2Body = null;
    for (let i = 0; i < len; i++) {
      obj = objects[i];
      if (obj._hash_need_update) {
        this.remove(obj, false);
        this.insert(obj, false);
        obj._hash_need_update = false;
      }
    }
  }

  debug(ctx: CanvasRenderingContext2D) {

    //firstly draw grid;
    ctx.strokeStyle = "black";
    for (let hash in this.grid) {
      const [x, y] = hash.split(":").map((a) => parseInt(a));
      ctx.beginPath();
      ctx.rect(x * shift, y * shift, shift, shift);
      ctx.stroke();
    }

    for (let i = 0; i < this.objects.length; i++) {
      ctx.strokeStyle = "red";
      const object = this.objects[i];
      if (object.type === k2BodyType.POLYGON) {
        ctx.beginPath();
        const vertices = (object as any as Polygon).getWorldVerts();
        const edges = (object as any as Polygon).getEdges();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        for (let i = 0; i < vertices.length; i++) {
          ctx.lineTo(vertices[i][0], vertices[i][1]);
        }
        ctx.closePath();
        ctx.stroke();

        for (let u = 0; u < vertices.length; u++) {
          ctx.strokeStyle = "grey";
          ctx.beginPath();
          ctx.moveTo(vertices[u][0], vertices[u][1]);
          let v = 1;
          ctx.lineTo(
            vertices[u][0] + edges[u][0] * v,
            vertices[u][1] + edges[u][1] * v
          );
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(
          object.position[0],
          object.position[1],
          (object as any as Circle).radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.globalAlpha = .3;
      ctx.strokeStyle = "pink";
      ctx.beginPath();
      let aabb = object.getAABB();
      ctx.moveTo(aabb.minX, aabb.minY);
      ctx.lineTo(aabb.maxX, aabb.minY);
      ctx.lineTo(aabb.maxX, aabb.maxY);
      ctx.lineTo(aabb.minX, aabb.maxY);
      ctx.lineTo(aabb.minX, aabb.minY);
      ctx.stroke();

      let minX = aabb.minX;
      let minY = aabb.minY;
      let maxX = aabb.maxX;
      let maxY = aabb.maxY;

      const body = object;
      let velX = body.velocity[0];
      let velY = body.velocity[1];
      if (velX > 0) maxX += velX;
      else minX += velX;

      if (velY > 0) maxY += velY;
      else minY += velY;

      //TMP_AABB.minX = minX;
      //TMP_AABB.minY = minY;
      //TMP_AABB.maxX = maxX;
      //TMP_AABB.maxY = maxY;
      //aabb = TMP_AABB;

      ctx.strokeStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(aabb.minX, aabb.minY);
      ctx.lineTo(aabb.maxX, aabb.minY);
      ctx.lineTo(aabb.maxX, aabb.maxY);
      ctx.lineTo(aabb.minX, aabb.maxY);
      ctx.lineTo(aabb.minX, aabb.minY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(object.position[0], object.position[1]);
      ctx.lineTo(
        object.position[0] + object.velocity[0],
        object.position[1] + object.velocity[1]
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
