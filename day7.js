const operations = [
  [add, 3, true],
  [multiply, 3, true],
  [input, 1, true],
  [output, 1, false],
  [jumpIfTrue, 2, false],
  [jumpIfFalse, 2, false],
  [lessThan, 3, true],
  [equals, 3, true]
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
function input(arr, [index], { inputFn }) {
  const value = parseInt(inputFn("input:"), 10);
  if (Number.isNaN(value)) {
      throw new Error('Invalid input!');
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
    writes
  );
  const { pointer = argEndIndex, output } = operation(arr, args, options) || {};
  return { pointer, output };
}

function* runIntcode(
  inputArr,
  {
    inputFn = window.prompt,
    outputFn = console.log,
    yieldOnOutput = false
  } = {}
) {
  let pointer = 0;
  const arr = parseInput(inputArr);
  while (pointer !== undefined) {
    const result = doOperation(arr, pointer, {
      inputFn,
      outputFn
    });
    pointer = result.pointer;
    const { output } = result;
    if (output !== undefined) {
      outputFn(output);
      if (yieldOnOutput) yield output;
    }
  }

  return arr;
}

function parseInput(input) {
  if (Array.isArray(input)) return input;
  return input.split(",").map(str => parseInt(str, 10));
}

function runAmplifiers(intcodeInput, sequenceInput) {
  const intcode = parseInput(intcodeInput);
  const sequence = parseInput(sequenceInput);
  const signal = sequence.reduce((acc, phase, i) => {
    const inputs = [phase, acc];
    const outputs = [];
    runIntcode(intcode, {
      inputFn: () => inputs.shift(),
      outputFn: val => outputs.push(val)
    }).next();
    return outputs.pop();
  }, 0);
  return signal;
}

function runAmplifiersSeries(intcodeInput, sequenceInput) {
  const sequence = parseInput(sequenceInput);
  const inputs = sequence.map((phase, i) => (i === 0 ? [phase, 0] : [phase]));
  const outputs = sequence.map(() => []);
  const amplifiers = sequence.map((phase, i) =>
    runIntcode(parseInput(intcodeInput), {
      inputFn: () => inputs[i].shift(),
      outputFn: val => {
        const inputIndex = (i + 1) % sequence.length;
        inputs[inputIndex].push(val);
        outputs[i].push(val);
      },
      yieldOnOutput: true
    })
  );
  let halted = false;
  while (!halted) {
    for (const [i, amplifier] of amplifiers.entries()) {
      const { done } = amplifier.next();
      if (i === amplifiers.length - 1) {
        halted = done;
      }
    }
  }
  return outputs.pop().pop();
}

function getMaxThrusterSignal(intcodeInput, phases = [0, 1, 2, 3, 4]) {
  const sequences = permutations(phases);
  const maxSignal = sequences.reduce((acc, sequence) => {
    const signal = runAmplifiers(intcodeInput, sequence);
    return Math.max(acc, signal);
  }, -Infinity);
  return maxSignal;
}

function getMaxThrusterSignalSeries(intcodeInput, phases = [5, 6, 7, 8, 9]) {
  const sequences = permutations(phases);
  const maxSignal = sequences.reduce((acc, sequence) => {
    const signal = runAmplifiersSeries(intcodeInput, sequence);
    return Math.max(acc, signal);
  }, -Infinity);
  return maxSignal;
}

function permutations(inputArr) {
  const result = [];
  const permute = (arr, m = []) => {
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  permute(inputArr);

  return result;
}