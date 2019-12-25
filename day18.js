function inputToMap(input) {
  return input.split("\n").map(line => line.split(""));
}

function getKeyLocations(map) {
  const keyLocations = {};
  let startPoints = [];
  for (const [y, row] of map.entries()) {
    for (const [x, cell] of row.entries()) {
      if (/@|[a-z]/.test(cell)) {
        let name = cell;
        if (cell === "@") {
          name = `${cell}${startPoints.length}`;
          startPoints.push(name);
        }
        keyLocations[name] = [x, y];
      }
    }
  }
  return { keyLocations, startPoints };
}

function distanceToCollectAllKeys(input) {
  const map = inputToMap(input);
  const { keyLocations, startPoints } = getKeyLocations(map);
  const remainingKeys = new Set(Object.keys(keyLocations).sort());
  for (const startPoint of startPoints) {
    remainingKeys.delete(startPoint);
  }
  return distanceToCollectKeys(
    map,
    keyLocations,
    startPoints,
    remainingKeys,
    {}
  );
}

function distanceToCollectKeys(
  map,
  keyLocations,
  currentKeys,
  remainingKeys,
  cache
) {
  if (remainingKeys.size === 0) return 0;
  // important not just for performance but to prevent infinite recursion
  const cacheKey = `${Array.from(currentKeys.sort()).join(",")} - ${Array.from(
    remainingKeys
  ).join(",")}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const reachableKeys = currentKeys.map(currentKey => 
    getReachableKeys(map, keyLocations[currentKey], remainingKeys).map(key => ({
        currentKey,
        key,
    }))
  ).flat(1);

  let result = Infinity;
  for (const { key, currentKey } of reachableKeys) {
    const remainingKeysAfter = new Set(remainingKeys);
    remainingKeysAfter.delete(key);
    const currentKeysAfter = [
      key,
      ...currentKeys.filter(v => v !== currentKey)
    ];
    const distance =
      distanceBetween(map, keyLocations[currentKey], keyLocations[key]) +
      distanceToCollectKeys(
        map,
        keyLocations,
        currentKeysAfter,
        remainingKeysAfter,
        cache
      );
    result = Math.min(result, distance);
  }
  cache[cacheKey] = result;
  return result;
}

function getReachableKeys(map, [sx, sy], remainingKeys) {
  const visited = {};
  const queue = [[sx, sy]];
  const found = [];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (visited[`${cx}, ${cy}`]) {
      continue;
    }
    visited[`${cx}, ${cy}`] = true;
    const value = map[cy][cx];
    // door we don't have a key for yet
    if (/[A-Z]/.test(value) && remainingKeys.has(value.toLowerCase())) {
      continue;
    }
    if (value === "#") {
      continue;
    }
    if (/[a-z]/.test(value) && remainingKeys.has(value)) {
      found.push(value);
      // technically keys beyond this are still reachable but due to the way we recurse
      // results it would be much more inefficient to go any further now
      continue;
    }
    queue.push([cx, cy - 1], [cx, cy + 1], [cx - 1, cy], [cx + 1, cy]);
  }
  return found;
}

function distanceBetween(map, [sx, sy], [ex, ey]) {
  const visited = {};
  const queue = [{ point: [sx, sy], depth: 0 }];
  while (queue.length > 0) {
    const {
      point: [cx, cy],
      depth
    } = queue.shift();
    if (visited[`${cx}, ${cy}`]) {
      continue;
    }
    visited[`${cx}, ${cy}`] = true;
    if (cx === ex && cy === ey) {
      return depth;
    }
    if (map[cy][cx] === "#") {
      continue;
    }
    queue.push(
      { point: [cx, cy - 1], depth: depth + 1 },
      { point: [cx, cy + 1], depth: depth + 1 },
      { point: [cx - 1, cy], depth: depth + 1 },
      { point: [cx + 1, cy], depth: depth + 1 }
    );
  }
  throw new Error("No path found");
}
