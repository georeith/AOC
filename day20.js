function inputToMap(input) {
  return input.split("\n").map(line => line.split(""));
}

function isLetter(str) {
  return /[A-Z]/.test(str);
}

const move = {
  up: ([x, y]) => [x, y - 1], // up
  right: ([x, y]) => [x + 1, y], // right
  down: ([x, y]) => [x, y + 1], // down
  left: ([x, y]) => [x - 1, y] // left
};

// I'm not proud of this
function getPortalLocations(map) {
  const portalLocations = {};
  const height = map.length;
  const width = map[0].length;
  for (const [y, row] of map.entries()) {
    for (const [x, cell] of row.entries()) {
      if (isLetter(cell)) {
        const up = map[y - 1] && map[y - 1][x];
        const down = map[y + 1] && map[y + 1][x];
        const left = map[y][x - 1];
        const right = map[y][x + 1];
        let name;
        let location;
        if (isLetter(up) && down === ".") {
          name = `${up}${cell}`;
          location = { dir: "up", point: [x, y + 1], inside: y > 1 };
        } else if (isLetter(down) && up === ".") {
          name = `${cell}${down}`;
          location = { dir: "down", point: [x, y - 1], inside: y < height - 2 };
        } else if (isLetter(left) && right === ".") {
          name = `${left}${cell}`;
          location = { dir: "left", point: [x + 1, y], inside: x > 1 };
        } else if (isLetter(right) && left === ".") {
          name = `${cell}${right}`;
          location = {
            dir: "right",
            point: [x - 1, y],
            inside: x < width - 2
          };
        } else {
          continue;
        }
        location.name = name;
        if (portalLocations[name]) {
          portalLocations[name].push(location);
        } else {
          portalLocations[name] = [location];
        }
      }
    }
  }
  const portalCount = Object.keys(portalLocations).length - 2;
  for (const [name, locations] of Object.entries(portalLocations)) {
    const [location1, location2] = locations;
    if (name === "AA" || name === "ZZ") {
      portalLocations[name] = location1.point;
    } else {
      portalLocations[
        move[location1.dir](location1.point).toString()
      ] = location2;
      portalLocations[
        move[location2.dir](location2.point).toString()
      ] = location1;
    }
  }
  portalLocations.count = portalCount - 2;
  return portalLocations;
}

// for part 2 just pass requiredLevel = 0
function distance(input, requiredLevel = null) {
  const map = inputToMap(input);
  const portalLocations = getPortalLocations(map);
  console.log(portalLocations);
  const startPoint = portalLocations["AA"];
  const endPoint = portalLocations["ZZ"];
  return distanceBetween(
    map,
    portalLocations,
    startPoint,
    endPoint,
    requiredLevel
  );
}

function distanceBetween(
  map,
  portalLocations,
  [sx, sy],
  [ex, ey],
  requiredLevel = null
) {
  const visited = {};
  const queue = [{ point: [sx, sy], depth: 0, level: 0, path: [] }];
  while (queue.length > 0) {
    const {
      path,
      point: [cx, cy],
      depth,
      level
    } = queue.shift();
    const cacheKey =
      requiredLevel === null ? `${cx}, ${cy}` : `${level},${cx}, ${cy}`;
    if (visited[cacheKey]) {
      continue;
    }
    visited[cacheKey] = true;
    const isAtRequiredLevel = requiredLevel === null || level === requiredLevel;
    if (cx === ex && cy === ey && isAtRequiredLevel) {
      // console.log(path);
      return depth;
    }
    if (map[cy][cx] !== ".") {
      continue;
    }
    queue.push(
      ...[
        [cx, cy - 1],
        [cx, cy + 1],
        [cx - 1, cy],
        [cx + 1, cy]
      ].map(point => {
        const isPortal = portalLocations[point.toString()];
        // inside means we are teleporting to an inside portal so it is actually an outside portal
        const { inside, point: newPoint, name } = portalLocations[
          point.toString()
        ] || {
          point,
          inside: true
        };
        // don't teleport on level 0 outside portals
        const shouldTeleport =
          requiredLevel === null ||
          (inside && level !== 0) ||
          (!inside && level < portalLocations.count); // limiting the level to the number of portals greatly increases speed
        let newLevel = level;
        if (isPortal && shouldTeleport) {
          newLevel = inside ? level - 1 : level + 1;
        }
        return {
          // path is just for debugging
          // path: isPortal && shouldTeleport ? [...path, `${name} ${level} -> ${newLevel}`] : path,
          point: shouldTeleport ? newPoint : point,
          depth: depth + 1,
          level: newLevel
        };
      })
    );
  }
  throw new Error("No path found");
}
