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
  console.log("add", valueA, valueB, index);
  arr[index] = valueA + valueB;
}
function multiply(arr, [valueA, valueB, index]) {
  console.log("multiply", valueA, valueB, index);
  arr[index] = valueA * valueB;
}
function input(arr, [index], { inputFn }) {
  const value = parseInt(inputFn("input:"), 10);
  if (Number.isNaN(value)) {
    throw new Error("Invalid input!");
  }
  console.log("input", index, value);
  arr[index] = value;
}
function output(arr, [valueA]) {
  console.log("output", valueA);
  return { output: valueA };
}
function jumpIfTrue(arr, [valueA, valueB]) {
  console.log("jumpIfTrue", valueA, valueB);
  if (valueA !== 0) return { pointer: valueB };
}
function jumpIfFalse(arr, [valueA, valueB]) {
  console.log("jumpIfFalse", valueA, valueB);
  if (valueA === 0) return { pointer: valueB };
}
function lessThan(arr, [valueA, valueB, index]) {
  console.log("lessThan", valueA, valueB, index);
  arr[index] = valueA < valueB ? 1 : 0;
}
function equals(arr, [valueA, valueB, index]) {
  console.log("equals", valueA, valueB, index);
  arr[index] = valueA === valueB ? 1 : 0;
}
function offsetBase(arr, [valueA], { base }) {
  console.log("offsetBase", valueA);
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
