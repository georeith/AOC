function inputToArr(input) {
  return Array.isArray(input) ? input : `${input}`.split("");
}

function phase(input, offset = 0, slice = true) {
  const pattern = [0, 1, 0, -1];
  const inputArr = inputToArr(input).map(n => parseInt(n));
  const arr = inputArr.slice(slice ? offset : 0);
  const originalLength = arr.length + offset;
  const midway = Math.max(originalLength / 2 - offset, 0);
  // for the first half of the input we need to use a comparitively inefficient
  // method that iterates every index > offset + rowIndex
  for (let i = 0; i < midway; i++) {
    let sum = 0;
    let repeat = i + offset + 1;
    for (let columnIndex = i; columnIndex < arr.length; columnIndex++) {
      const multiplier =
        pattern[
          Math.floor((columnIndex + offset + 1) / repeat) % pattern.length
        ];
      sum += arr[columnIndex] * multiplier;
    }
    arr[i] = Math.abs(sum) % 10;
  }
  // for the second half of the input we can calculate it by working backwards
  // and only looking at the adjacent value
  for (let i = arr.length - 1; i >= midway; i--) {
    arr[i] = Math.abs((arr[i + 1] || 0) + arr[i]) % 10;
  }
  return arr;
}

function nthPhase(input, n = 0, offset = 0) {
  return new Array(n)
    .fill(0)
    .reduce(acc => phase(acc, offset, false), input.slice(offset));
}
