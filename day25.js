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
  return { pointer, output, base, opCode };
}

function* runIntcode(
  inputArr,
  {
    inputFn = window.prompt,
    outputFn = console.log,
    yieldOnOutput = false,
    yieldOnOperation = false,
    initialBase = 0,
    intitialPointer = 0
  } = {}
) {
  let base = initialBase;
  let pointer = intitialPointer;
  let promise = null;
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
    if (yieldOnOperation)
      yield {
        output: result.output,
        memory: arr,
        pointer,
        base,
        opCode: result.opCode
      };
    if (result.output !== undefined) {
      if (outputFn) outputFn(result.output);
      if (yieldOnOutput && !yieldOnOperation)
        yield {
          output: result.output,
          memory: arr,
          pointer,
          base,
          opCode: result.opCode
        };
    }
  }

  return arr;
}

function parseInput(input) {
  if (Array.isArray(input)) return input;
  return input.split(",").map(str => parseInt(str, 10));
}

// todays code starts here, no additions to intcode made

const blacklist = [
    'molten lava',
    'infinite loop',
    'escape pod',
    'photons',
    'giant electromagnet',
]
function runProgram(intcode) {
  let input = [];
  let output = [];
  const messages = [];
  runIntcode(intcode, {
    inputFn: () => {
      let message = "input";
      if (output.length) {
        message = output
          .map(charCode => String.fromCharCode(charCode))
          .join("");
        output = [];
      }
      if (input.length === 0) input = strToInput(prompt(message) + '\n');
      return input.shift();
    },
    outputFn: value => {
      output.push(value);
    }
  }).next();
  alert(output.map(charCode => String.fromCharCode(charCode)).join(""));
}

function strToInput(program) {
  return program.split("").map(char => char.charCodeAt(0));
}

// I calculated this manually using pen and paper and navigating the maze using the above program
// There are 8 (non-lethal) items in my maze:
//   - festive hat
//   - space heater
//   - loom
//   - space law space brochure
//   - sand
//   - pointer
//   - wreath
//   - planetoid
//
// These items were too heavy and can be ruled out (found by dropping all items and trying with just these):
//   - loom
//   - space law space brochure
//
// There are 6 combinations (not permutations) of 5 of the remaining items - none of those work
// There are 15 combinations of 4 of the remaining items - the last one I tried of those worked
//    - sand
//    - pointer
//    - wreath
//    - planetoid