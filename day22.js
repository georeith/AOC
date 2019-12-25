function createDeck(size) {
  return Array.from(Array(size).keys());
}
function newStack(arr) {
  return [...arr].reverse();
}

function cutN(arr, n) {
  return n > 0
    ? [...arr.slice(n), ...arr.slice(0, n)]
    : [...arr.slice(n), ...arr.slice(0, n)];
}

function incrementN(arr, n) {
  const newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr[(i * n) % arr.length] = arr[i];
  }
  return newArr;
}

const methods = {
  "deal into new stack": newStack,
  "deal with increment": incrementN,
  cut: cutN
};

function deal(input, size = 10) {
  return input.split("\n").reduce((arr, instruction) => {
    const methodName = Object.keys(methods).find(name =>
      instruction.startsWith(name)
    );
    const method = methods[methodName];
    const input = instruction
      .slice(methodName.length + 1)
      .split(" ")
      .map(n => parseInt(n, 10));
    return method(arr, ...input);
  }, createDeck(size));
}

// part 2

// % in js is remainder not proper modulo so this makes it work for negative values
function mod(n, m) {
  return ((n % m) + m) % m;
}

function newStack([offset, increment], size) {
  const newIncrement = mod(increment * -1n, size);
  return [mod(offset + newIncrement, size), newIncrement];
}

function cutN(n, [offset, increment], size) {
  return [mod(offset + increment * n, size), increment];
}

function incrementN(n, [offset, increment], size) {
  // fast modular inverse because all of our deck sizes are prime
  return [offset, mod(increment * modInv(n, size), size)];
}

// xgcd function stolen from https://stackoverflow.com/a/26986636 and modified to work with big int
function xgcd(a, b) {
  if (b === 0n) {
    return [1n, 0n, a];
  }

  let temp = xgcd(b, a % b);
  let x = temp[0];
  let y = temp[1];
  let d = temp[2];
  return [y, x - y * BigInt(Math.floor(Number(a) / Number(b))), d];
}

function modInv(a, b) {
  // we could use this instead because our b is prime but I wanted to test this against
  // the size 10 deck examples
  // modPow(a, b - 2n, b)
  return mod(xgcd(a, b)[0], b);
}

// modPow function stolen from https://gist.github.com/krzkaczor/0bdba0ee9555659ae5fe and adapted for big int
function modPow(a, b, n) {
  let result = 1n;
  let x = a % n;

  while (b > 0) {
    const leastSignificantBit = b % 2n;
    b = BigInt(Math.floor(Number(b) / 2));

    if (leastSignificantBit === 1n) {
      result = result * x;
      result = result % n;
    }

    x = x * x;
    x = x % n;
  }
  return result;
}

function repeatShuffle(n, [offset, increment], size) {
  const newIncrement = modPow(increment, n, size);
  const newOffset =
    offset * (1n - newIncrement) * modInv(mod(1n - increment, size), size);
  return [newOffset, newIncrement];
}

function deal(
  input,
  sizeNumber = 119315717514047,
  timesNumber = 101741582076661,
  offsetNumber = 2020
) {
  const size = BigInt(sizeNumber);
  const times = BigInt(timesNumber);
  const offset = BigInt(offsetNumber);
  const methods = {
    "deal into new stack": newStack,
    "deal with increment": incrementN,
    cut: cutN
  };
  // nth card = offset + (increment * n) % number of cards
  const result = input.split("\n").reduce(
    ([offset, increment], instruction) => {
      const methodName = Object.keys(methods).find(name =>
        instruction.startsWith(name)
      );
      const method = methods[methodName];
      const input = instruction
        .slice(methodName.length + 1)
        .split(" ")
        .filter(str => str)
        .map(n => BigInt(parseInt(n, 10)));
      return method(...input, [offset, increment], size);
    },
    [0n, 1n]
  );

  const [totalOffset, totalIncrement] = repeatShuffle(times, result, size);
  return Number(mod(totalOffset + totalIncrement * offset, size));
}
