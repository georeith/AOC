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

function check(intcode, [x, y]) {
  const input = [x, y];
  let output = 0;
  runIntcode(intcode, {
    inputFn: () => input.shift(),
    outputFn: value => {
      output = value;
    }
  }).next();
  return output;
}

function scanArea(intcode, width = 50, height = 50) {
  let output = 0;
  // assuming that beam gets wider as you go further
  // we can skip checking all the vacant spaces from
  // a previous iteration in the next iteration
  let offset = 0;
  for (let x = 0; x < width; x++) {
    let hit = false;
    for (let y = offset; y < height; y++) {
      const value = check(intcode, [x, y]);
      output += value;
      if (value) {
        if (!hit) {
          hit = true;
          offset = y;
        }
      } else if (hit) {
        // detected nothing after detecting beam so go to next line
        break;
      }
    }
  }
  return output;
}

function findArea(intcode, width = 100, height = 100) {
  let x = 1000;
  let offset = 0;
  // safety first
  while (x < 5000) {
    let y = 0;
    let hit = false;
    while (!hit) {
      y++;
      const topRightValue = check(intcode, [x, y]);
      if (topRightValue) {
          hit = true;
          offset = y;
          // if the bottom left and top right corners are in the beam then the
          // whole grid is and the closest point is the top left corner
          if (check(intcode, [x - width + 1, y + height - 1])) {
              return ((x - width + 1) * 10000) + y;
          }
      }
    }
    x++;
  }
  return null;
}
