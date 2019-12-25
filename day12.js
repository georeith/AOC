function getMoons(input) {
  return input
    .split("\n")
    .map(str => str.match(/(-?\d+)/g).map(n => parseInt(n, 10)))
    .map(point => ({
      point,
      velocity: [0, 0, 0]
    }));
}

function step(moons) {
  return moons.map((moon1, i) => {
    const { point: point1, velocity: velocity1 } = moon1;
    let dv = [0, 0, 0];
    for (const [j, moon2] of moons.entries()) {
      if (i === j) continue;
      const { point: point2, velocity: velocity2 } = moon2;
      dv = dv.map((n, k) => {
        if (point2[k] > point1[k]) {
          return n + 1;
        }
        if (point2[k] < point1[k]) {
          return n - 1;
        }
        return n;
      });
    }
    const newVelocity = velocity1.map((n, j) => n + dv[j]);
    return {
      point: point1.map((n, j) => n + newVelocity[j]),
      velocity: newVelocity
    };
  });
}

function runSteps(input, steps = 1) {
  let moons = getMoons(input);
  for (i = 0; i < steps; i++) {
    moons = step(moons);
  }
  return moons;
}

function getEnergy(moons) {
  return moons.reduce((acc1, { point, velocity }) => {
    const potentialEnergy = point.reduce((acc2, n) => acc2 + Math.abs(n), 0);
    const kineticEnergy = velocity.reduce((acc2, n) => acc2 + Math.abs(n), 0);
    return acc1 + potentialEnergy * kineticEnergy;
  }, 0);
}

function stepsToRepeat(input) {
  const startMoons = getMoons(input);
  let i = 0;
  let repeatCountPerDimension = startMoons[0].point.map(() => null);
  let moons = startMoons;
  // find the repeat phase of each dimension as velocity is dimension independent
  // the lcm of these is the phase where it first totally repeats
  while (repeatCountPerDimension.some(n => n === null)) {
    i++;
    moons = step(moons);
    repeatCountPerDimension = repeatCountPerDimension.map((n, j) => {
      if (n !== null) return n;
      return moons.every((moon, k) => {
        return (
          moon.point[j] === startMoons[k].point[j] &&
          moon.velocity[j] === startMoons[k].velocity[j]
        );
      })
        ? i
        : null;
    });
  }
  return repeatCountPerDimension.reduce(lcm);
}

function gcd(a, b) {
  return !b ? a : gcd(b, a % b);
}

function lcm(x, y) {
  return x === 0 || y === 0 ? 0 : Math.abs(Math.floor(x / gcd(x, y)) * y);
}
