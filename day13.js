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
        throw new Error(`Invalid mode ${mode} specified`);
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

async function arcade(input, inputFn = () => 1, draw = drawArcade) {
  const tiles = {};
  const output = [];
  let score = 0;
  let done = false;
  let i = 0;
  let frame = false;
  const game = runIntcode(input, {
    inputFn: () => {
      frame = true;
      if (draw) draw(tiles, score);
      return inputFn(tiles, score);
    },
    outputFn: value => {
      output.push(value);
      if (output.length === 3) {
        const [x, y, tile] = output.splice(0, 3);
        if (x === -1 && y === 0) {
          score = value;
        } else {
          tiles[`${x},${y}`] = value;
        }
      }
    },
    yieldOnOutput: true
  });
  while (!done) {
    if (frame) {
      frame = false;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    i++;
    const result = game.next();
    const { value } = result;
    done = result.done;
  }
  if (draw) draw(tiles, score);
  return tiles;
}

function drawArcade(...args) {
  const image = tilesToBitmap(...args);
  if (image) {
    console.clear();
    console.log(image);
  }
}

function tilesToBitmap(tiles, score = 0, tileSet = [" ", "#", "█", "-", "O"]) {
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
    bitmap[y - minY][x - minX] = tileSet[value];
  }
  return [`SCORE: ${score}`, ...bitmap.map(row => row.join(""))].join("\n");
}

// for day 1 answer
// const tiles = await arcade(input);
// Object.values(tiles).filter(n => n === 2).length

function findTile(tiles, tile) {
  const [pos] = Object.entries(tiles).find(([key, value]) => value === tile);
  return pos.split(",").map(n => parseInt(n, 10));
}

function breakOutAi(tiles) {
  const [px] = findTile(tiles, 3);
  const [bx] = findTile(tiles, 4);
  if (bx < px) {
    return -1;
  }
  if (bx > px) {
    return 1;
  }
  return 0;
}
