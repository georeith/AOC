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
    yieldOnOutput = false,
    initialBase = 0,
    intitialPointer = 0
  } = {}
) {
  let base = initialBase;
  let pointer = intitialPointer;
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
      if (outputFn) outputFn(result.output);
      if (yieldOnOutput)
        yield { output: result.output, memory: arr, pointer, base };
    }
  }

  return arr;
}

function parseInput(input) {
  if (Array.isArray(input)) return input;
  return input.split(",").map(str => parseInt(str, 10));
}

// todays code starts here, small additions to intcode made (allowed to set base and pointer)

function findOxygenSystem(input) {
  let x = 0;
  let y = 0;
  let i = 0;
  const floodFill = bfsFloodFill([x, y], {
    memory: parseInput(input),
    base: 0,
    pointer: 0
  });
  let lastOutput;
  let lastState;
  while (i < 10000) {
    i++;
    const { value, done } = floodFill.next({
        value: lastOutput,
        state: lastState,
    });
    if (done) {
        return value;
    }
    const {
      cmd,
      state: { memory: [...initialMemory], base: initialBase, pointer: initialPointer }
    } = value;
    const { value: { output, memory, pointer, base } } = runIntcode(initialMemory, {
        outputFn: null,
        inputFn: () => cmd,
        yieldOnOutput: true,
        initialBase,
        initialPointer,
    }).next();
    if (output === 2) {
        return value;
    }
    lastOutput = output;
    lastState = { memory, pointer, base };
  }
}

// breadth first flood fill
// by definition as soon as we find the item using this that is the shortest path
function* bfsFloodFill([x, y], initialState) {
  const visited = {};
  const queue = [
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y]
  ].map((point, i) => ({ point, depth: 1, state: {
      ...initialState,
      memory: [...initialState.memory],
  }, cmd: i + 1 }));
  let item;
  while (queue.length > 0) {
    item = queue.shift();
    const [cx, cy] = item.point;
    if (visited[`${cx}, ${cy}`] !== undefined) {
      continue;
    }
    const { value, state } = yield item;
    visited[`${cx}, ${cy}`] = value;
    if (value === 0) {
      continue;
    }
    queue.push(
      ...[
        [cx, cy - 1],
        [cx, cy + 1],
        [cx - 1, cy],
        [cx + 1, cy]
      ].map((point, i) => ({ point, state, cmd: i + 1, depth: item.depth + 1 }))
    );
  }
  return { item, visited };
}

// utility for drawing the tileset
function tilesToBitmap(tiles, tileSet = ["█", " ", "O", "N"]) {
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
    const [x, y] = key.split(",");
    bitmap[y - minY][x - minX] = tileSet[value];
  }
  return bitmap.map(row => row.join("")).join("\n");
}