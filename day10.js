function getGcd(a, b) {
  return !b ? a : getGcd(b, a % b);
}

function inputToMatrix(input) {
  return input.split("\n").map(row => row.split(""));
}

function getAngle(x1, y1, x2, y2) {
  // get the angle clockwise from the y-axis to the vector x1,y1 -> x2,y2
  let angle = Math.atan2(-1, 0) - Math.atan2(y2 - y1, -(x2 - x1));
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  return angle * (180 / Math.PI);
}

function getAsteroids(matrix) {
  return matrix.reduce(
    (acc1, row, y) =>
      acc1.concat(
        row
          .map((cell, x) => (cell === "#" ? { x, y } : null))
          .filter(cell => cell !== null)
      ),
    []
  );
}

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function isVisible(matrix, x1, y1, x2, y2) {
  if (x1 === x2 && y1 === y2) return false;
  // distance between the two points in x and y
  const dx = x2 - x1;
  const dy = y2 - y1;
  // if gcd is 1 there is no cell between in this angle
  // if its 2 there is 1 cell between and so on
  const gcd = getGcd(Math.abs(dx), Math.abs(dy));
  // distance between each cell in x and y on this angle
  const dx2 = dx / gcd;
  const dy2 = dy / gcd;
  // iterate through the cells between the origin point
  // and this point along the same angle and see if there
  // are any asteroids
  let x3 = x1 + dx2;
  let y3 = y1 + dy2;
  while (x3 !== x2 || y3 !== y2) {
    if (matrix[y3][x3] !== ".") return false;
    x3 += dx2;
    y3 += dy2;
  }
  return true;
}

function getOptimalAsteroid(matrix) {
  const asteroids = getAsteroids(matrix);
  return asteroids.reduce(
    (acc, { x: x1, y: y1 }) => {
      const count = asteroids.filter(({ x: x2, y: y2 }) => {
        if (x1 === x2 && y1 === y2) return false;
        return isVisible(matrix, x1, y1, x2, y2);
      }).length;
      return count > acc.count
        ? {
            count,
            x: x1,
            y: y1
          }
        : acc;
    },
    {
      count: -Infinity,
      x: undefined,
      y: undefined
    }
  );
}

function getMaxVisibleCount(input) {
  const matrix = inputToMatrix(input);
  return getOptimalAsteroid(matrix);
}

function getDestructionOrder(input) {
  const matrix = inputToMatrix(input);
  const { x, y } = getOptimalAsteroid(matrix);
  const asteroidsByAngle = getAsteroids(matrix)
    .map(asteroid => ({
      ...asteroid,
      angle: getAngle(x, y, asteroid.x, asteroid.y),
      distance: getDistance(x, y, asteroid.x, asteroid.y)
    }))
    // sort first by angle then farthest
    .sort((a, b) => a.angle - b.angle || b.distance - a.distance);
  const destroyed = [];
  let remaining = asteroidsByAngle;
  while (remaining.length > 1) {
    for (let i = 0; i < remaining.length; i++) {
      const asteroid = remaining[i];
      const { x: x2, y: y2 } = asteroid;
      if (isVisible(matrix, x, y, x2, y2)) {
        matrix[y2][x2] = ".";
        destroyed.push(remaining.splice(i, 1));
        i--;
      }
    }
  }
  return destroyed;
}
