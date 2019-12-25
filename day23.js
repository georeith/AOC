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

// Todays code starts here, slight modifications to make intcode yield on every operation above
//
// NOTES:
// I tried wrapping doOperation in a setTimeout of 0 and letting the computers pick their own order of operations
// but this turned out much slower (8s vs 40ms) than yielding on each output and allowing each computer to do one operation in turn

function createNetwork(intcode, size = 50) {
  const inputQueues = [];
  const computers = [];
  let requestedEmptyInput = [];
  for (let i = 0; i < size; i++) {
    const inputQueue = [];
    inputQueues[i] = inputQueue;
    let outputCount = 0;
    let inputCount = 0;
    let address = null;
    let x = null;
    let firstInput = false;
    requestedEmptyInput[i] = 0;
    const computer = runIntcode(intcode, {
      inputFn: () => {
        if (!firstInput) {
          firstInput = true;
          return i;
        }
        if (!inputQueue.length) {
          requestedEmptyInput[i] = requestedEmptyInput[i] + 1;
          return -1;
        }
        requestedEmptyInput[i] = 0;
        const inputType = inputCount % 2;
        inputCount++;
        switch (inputType) {
          case 0:
            return inputQueue[0].x;
          case 1:
            // console.log(i, "input", inputQueue[0]);
            const { y } = inputQueue.shift();
            return y;
        }
      },
      outputFn: value => {
        const outputType = outputCount % 3;
        outputCount++;
        requestedEmptyInput[i] = 0;
        switch (outputType) {
          case 0:
            address = value;
            break;
          case 1:
            x = value;
            break;
          case 2:
            if (inputQueues[address] === undefined) inputQueues[address] = [];
            // console.log(i, "output", { x, y: value, address });
            inputQueues[address].push({
              x,
              y: value
            });
            address = null;
            x = null;
            break;
        }
      },
      yieldOnOperation: true
    });
    computers[i] = computer;
  }
  let i = 0;
  // instructions are poorly worded, they don't mean in a row they mean ever!!!
  const seen = {};
  while (i < 1000000) {
    const j = i % size;
    // pause only on input or output instructions as it doesn't seem to matter to this program
    // this is just a minor optimisation and isn't strictly necessary when removing it you should
    // up the idle cycles tolerance though
    let opCode = null;
    while (opCode !== 3 && opCode !== 4) {
      ({
        value: { opCode }
      } = computers[j].next());
    }
    // const {
    //   value: { opCode }
    // } = computers[j].next();
    if (j === size - 1) {
      // after each computer has made atleast 50 packet requests and recieved nothing we consider it idle
      const idle = requestedEmptyInput.every(n => n > 50);
      if (idle) {
        const natPacket = inputQueues[255].pop();
        inputQueues[0].push(natPacket);
        inputQueues[255].splice(0, inputQueues[255].length);
        if (seen[natPacket.y]) {
          return natPacket;
        }
        seen[natPacket.y] = true;
      }
    }
    i++;
  }
  return null;
}
