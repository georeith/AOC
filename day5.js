const operations = [
  [add, 3, true],
  [multiply, 3, true],
  [input, 1, true],
  [output, 1, false],
  [jumpIfTrue, 2, false],
  [jumpIfFalse, 2, false],
  [lessThan, 3, true],
  [equals, 3, true],
];

function getArgValues(arr, args, op, writes) {
  const modes = `0000${op}`
    .slice(0, -2)
    .slice(-3)
    .split("")
    .reverse();
  return args.map((arg, i) => {
    if (writes && i === args.length - 1) return arg;
    return parseInt(modes[i], 10) ? arg : arr[arg];
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
function input(arr, [index]) {
  console.log("input", index);
  const value = parseInt(window.prompt("input:"), 10);
  arr[index] = value;
}
function output(arr, [valueA]) {
  console.log('output', valueA);
}
function jumpIfTrue(arr, [valueA, valueB]) {
  console.log("jumpIfTrue", valueA, valueB);
  if (valueA !== 0) return valueB; 
}
function jumpIfFalse(arr, [valueA, valueB]) {
  console.log("jumpIfFalse", valueA, valueB);
  if (valueA === 0) return valueB;
}
function lessThan(arr, [valueA, valueB, index]) {
  console.log("lessThan", valueA, valueB, index);
  arr[index] = valueA < valueB ? 1 : 0;
}
function equals(arr, [valueA, valueB, index]) {
  console.log("equals", valueA, valueB, index);
  arr[index] = valueA === valueB ? 1 : 0;
}

function doOperation(arr, opIndex) {
  const opCode = arr[opIndex] % 100;
  if (Number.isNaN(opCode) || opCode === 99) return;
  const [operation, arity, writes] = operations[opCode - 1];
  const argStartIndex = opIndex + 1;
  const argEndIndex = argStartIndex + arity;
  const args = getArgValues(
    arr,
    arr.slice(argStartIndex, argEndIndex),
    arr[opIndex],
    writes
  );
  const pointer = operation(arr, args);
  doOperation(arr, pointer === undefined ? argEndIndex : pointer);
}

function runIntcode(intcode) {
  const arr = intcode.split(",").map(str => parseInt(str, 10));
  doOperation(arr, 0);
  return arr;
}
