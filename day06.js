// map of every node to its parent
function getOrbits(input) {
  return input
    .split("\n")
    .map(line => line.split(")"))
    .reduce((acc, [parent, child]) => {
      acc[child] = parent;
      return acc;
    }, {});
}

function getPath(orbits, node) {
  const path = [];
  let parent = orbits[node];
  while (parent) {
    path.push(parent);
    parent = orbits[parent];
  }
  return path;
}

function getTotalOrbits(input) {
  const orbits = getOrbits(input);
  // get the path to each node and count its length
  const paths = Object.keys(orbits).map(node => getPath(orbits, node));
  return paths.reduce((acc, path) => acc + path.length, 0);
}

function getMinTransfers(input, start = "YOU", end = "SAN") {
  const orbits = getOrbits(input);
  const path1 = getPath(orbits, start);
  const path2 = getPath(orbits, end);
  // find shortest intersection between two paths
  const minTransfers = path1.reduce((acc, node, index1) => {
    const index2 = path2.indexOf(node);
    return index2 !== -1 ? Math.min(acc, index1 + index2) : acc;
  }, Infinity);
  return minTransfers;
}
