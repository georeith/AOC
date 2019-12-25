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

// todays code starts here, no additions to intcode made

function getImage(input) {
  let output = [];
  runIntcode(input, {
    outputFn: value => {
      output.push(value);
    }
  }).next();
  return output.map(charCode => String.fromCharCode(charCode)).join("");
}

function getAlignmentParameters(input) {
  const arr = getImage(input).split("\n");
  const width = arr[0].length;
  const height = arr.length;
  let total = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (arr[y][x] === ".") continue;
      const tiles = [
        arr[y][x - 1], // left
        arr[y][x + 1], // right
        arr[y - 1] && arr[y - 1][x], // up
        arr[y + 1] && arr[y + 1][x]
      ].filter(tile => tile && tile !== ".");
      if (tiles.length > 2) {
        total += x * y;
      }
    }
  }
  return total;
}

const move = [
  (x, y) => [x, y - 1], // up
  (x, y) => [x + 1, y], // right
  (x, y) => [x, y + 1], // down
  (x, y) => [x - 1, y] // left
];

const arrows = ["^", ">", "v", "<"];

function incrementDir(dir, increment) {
  return (((dir - increment) % 4) + 4) % 4;
}

function getTile(arr, [x, y]) {
  return arr[y] && arr[y][x];
}

function getPath(image) {
  // assumptions being made
  // - there is a single continuous path
  // - corners are never ambiguous (never adjacent to other tiles, a corner
  //   is a path segment with path segments in exactly two other directions)
  // - there is an end with a tile that only has one adjacent tile
  const arr = image.split("\n");
  const width = arr[0].length;
  const height = arr.length;
  const start = image.split("").findIndex(tile => arrows.indexOf(tile) !== -1);
  let y = Math.floor(start / (width + 1));
  let x = start % (width + 1);
  let dir = arrows.indexOf(arr[y][x]);
  let i = 0;
  const path = [];
  while (true) {
    let [x2, y2] = move[dir](x, y);
    let steps = 0;
    while (getTile(arr, [x2, y2]) === "#") {
      steps += 1;
      x = x2;
      y = y2;
      [x2, y2] = move[dir](x, y);
    }
    if (steps) {
      path.push(`${steps}`);
    }
    const rightDir = incrementDir(dir, -1);
    const leftDir = incrementDir(dir, 1);
    if (getTile(arr, move[rightDir](x, y)) === "#") {
      path.push("R");
      dir = rightDir;
    } else if (getTile(arr, move[leftDir](x, y)) === "#") {
      path.push("L");
      dir = leftDir;
    } else {
      return path;
    }
  }
}

function guideRobot(intcode) {
  // I did this manually by taking the path and looking for patterns
  const a = "L,12,L,8,R,10,R,10";
  const b = "L,6,L,4,L,12";
  const c = "R,10,L,8,L,4,R,10";
  const routine = "A,B,A,B,C,B,A,C,B,C";
  let output = [];
  let input = [
    ...routine.split(""),
    "\n",
    ...a.split(""),
    "\n",
    ...b.split(""),
    "\n",
    ...c.split(""),
    "\n",
    "n",
    "\n"
  ].map(char => char.charCodeAt(0));
  runIntcode(intcode, {
    inputFn: () => {
      const message = output
        .map(charCode => String.fromCharCode(charCode))
        .join("");
      console.log(message);
      output = [];
      return input.shift();
    },
    outputFn: value => {
      output.push(value);
    }
  }).next();
  return output.pop();
}

function getPatterns(inputPath) {
  // assumptions being made
  // - pattern always starts with a turn
  // - pattern never ends on a turn
  let pathString = inputPath.join(",");
}
