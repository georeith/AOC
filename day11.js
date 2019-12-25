const operations = [
  [add, 3, true],
  [multiply, 3, true],
  [input, 1, true],
  [output, 1, false],
  [jumpIfTrue, 2, false],
  [jumpIfFalse, 2, false],
  [lessThan, 3, true],
  [equals, 3, true],
  [offsetBase, 1, false]
];

function getArgValues(arr, args, op, writes, { base }) {
  const modes = `0000${op}`
    .slice(0, -2)
    .slice(-3)
    .split("")
    .reverse();
  return args.map((arg, i) => {
    const mode = parseInt(modes[i], 10);
    const isInWriteMode = writes && i === args.length - 1;
    switch (mode) {
      case 0:
        return isInWriteMode ? arg : arr[arg] || 0;
      case 1:
        return arg;
      case 2:
        return isInWriteMode ? base + arg : arr[base + arg] || 0;
      default:
        throw new Error(`Invalid mode ${mode} specified from ${op}`);
    }
  });
}

function add(arr, [valueA, valueB, index]) {
  arr[index] = valueA + valueB;
}
function multiply(arr, [valueA, valueB, index]) {
  arr[index] = valueA * valueB;
}
function input(arr, [index], { inputFn }) {
  const value = parseInt(inputFn("input:"), 10);
  if (Number.isNaN(value)) {
    throw new Error("Invalid input!");
  }
  arr[index] = value;
}
function output(arr, [valueA]) {
  return { output: valueA };
}
function jumpIfTrue(arr, [valueA, valueB]) {
  if (valueA !== 0) return { pointer: valueB };
}
function jumpIfFalse(arr, [valueA, valueB]) {
  if (valueA === 0) return { pointer: valueB };
}
function lessThan(arr, [valueA, valueB, index]) {
  arr[index] = valueA < valueB ? 1 : 0;
}
function equals(arr, [valueA, valueB, index]) {
  arr[index] = valueA === valueB ? 1 : 0;
}
function offsetBase(arr, [valueA], { base }) {
  return { base: base + valueA };
}

function doOperation(arr, opIndex, options) {
  const opCode = arr[opIndex] % 100;
  if (opCode === 99) return {};
  const [operation, arity, writes] = operations[opCode - 1];
  const argStartIndex = opIndex + 1;
  const argEndIndex = argStartIndex + arity;
  const args = getArgValues(
    arr,
    arr.slice(argStartIndex, argEndIndex),
    arr[opIndex],
    writes,
    options
  );
  const { pointer = argEndIndex, output, base } =
    operation(arr, args, options) || {};
  return { pointer, output, base };
}

function* runIntcode(
  inputArr,
  {
    inputFn = window.prompt,
    outputFn = console.log,
    yieldOnOutput = false
  } = {}
) {
  let base = 0;
  let pointer = 0;
  const arr = parseInput(inputArr);
  while (pointer !== undefined) {
    const result = doOperation(arr, pointer, {
      base,
      inputFn,
      outputFn
    });
    pointer = result.pointer;
    if (result.base !== undefined) {
      base = result.base;
    }
    if (result.output !== undefined) {
      outputFn(result.output);
      if (yieldOnOutput) yield result.output;
    }
  }

  return arr;
}

function parseInput(input) {
  if (Array.isArray(input)) return input;
  return input.split(",").map(str => parseInt(str, 10));
}

// todays code starts here, no modifications to intcode required :D

const moves = [
  (x, y) => [x, y - 1], // up
  (x, y) => [x + 1, y], // right
  (x, y) => [x, y + 1], // down
  (x, y) => [x - 1, y] // left
];
function turtle(input, tiles = {}) {
  let direction = 0;
  let x = 0;
  let y = 0;
  let outputCount = 0;
  runIntcode(input, {
    inputFn: () => {
      return tiles[`${x},${y}`] || 0;
    },
    outputFn: value => {
      const outputType = outputCount % 2;
      outputCount += 1;
      if (outputType === 0) {
        tiles[`${x},${y}`] = value;
      }
      if (outputType === 1) {
        const increment = value ? 1 : -1;
        direction += increment;
        [x, y] = moves[((direction % 4) + 4) % 4](x, y);
      }
    }
  }).next();
  return tiles;
}

function drawSign(input) {
  const tiles = turtle(input, { "0,0": 1 });
  const { minX, minY, maxX, maxY } = Object.keys(tiles).reduce(
    (acc, key) => {
      const [x, y] = key.split(",");
      return {
        minX: Math.min(acc.minX, x),
        minY: Math.min(acc.minY, y),
        maxX: Math.max(acc.maxX, x),
        maxY: Math.max(acc.maxY, y)
      };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    }
  );
  const bitmap = new Array(maxY - minY + 1)
    .fill([])
    .map(arr => new Array(maxX - minX + 1).fill(" "));
  for (const [key, value] of Object.entries(tiles)) {
    if (!value) continue;
    const [x, y] = key.split(",");
    bitmap[y - minY][x - minX] = "#";
  }
  return bitmap.map(row => row.join('')).join('\n');
}
