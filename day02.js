const operations = [
    [add, 3],
    [multiply, 3]
];

function add(arr, [indexA, indexB, indexC]) {
  console.log("add", indexA, indexB, indexC);
  arr[indexC] = arr[indexA] + arr[indexB];
}
function multiply(arr, [indexA, indexB, indexC]) {
  console.log("multiply", indexA, indexB, indexC);
  arr[indexC] = arr[indexA] * arr[indexB];
}

function doOperation(arr, opIndex) {
  const opCode = arr[opIndex];
  if (opCode === 99) return;
  const [operation, arity] = operations[opCode - 1];
  const argStartIndex = opIndex + 1;
  const argEndIndex = argStartIndex + arity;
  const args = arr.slice(argStartIndex, argEndIndex);
  operation(arr, args);
  doOperation(arr, argEndIndex);
}

function runIntcode(intcode) {
  const arr = intcode.split(",").map(str => parseInt(str, 10));
  doOperation(arr, 0);
  return arr;
}
