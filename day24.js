function parseInput(input) {
  // if each cell is a power of 2 value of the previous this just a bitmask
  // in binary the least significant bit is to the right so we need to reverse it
  // JS uses twos complement binary so whilst I imagined I'd have to left pad the
  // binary string with a 0 to make it positive it seems parseInt() doesn't
  // parse twos complement and assumes a leftmost 0 bit. Strange!
  const lines = input.split("\n");
  return {
    layout: lines
      .join("")
      .split("")
      .reverse()
      .map(c => (c === "#" ? 1 : 0)),
    width: lines[0].length,
    height: lines.length
  };
}

// this is your part 1 function, rating returned is the answer
function findFirstCycle(input) {
  const seen = new Set();
  const parsed = parseInput(input);
  const { width, height } = parsed;
  let { layout } = parsed;
  let rating = getRating(layout);
  while (!seen.has(rating)) {
    seen.add(rating);
    layout = tick(layout, width, height);
    rating = getRating(layout);
  }
  return { layout: layout.reverse(), rating };
}

function getRating(layout) {
  return parseInt(layout.join(""), 2);
}

function tick(layout, width, height) {
  return layout.map((cell, i) => {
    const x = i % width;
    const above = layout[i - width] || 0;
    const below = layout[i + width] || 0;
    const left = x !== 0 ? layout[i - 1] : 0;
    const right = x !== width - 1 ? layout[i + 1] : 0;
    const total = above + below + left + right;
    // bug dies unless there is exactly one adjacent bug
    if (cell === 1 && total !== 1) {
      return 0;
    }
    // empty space becomes bug if it has 1 or 2 adjacent bugs
    if (cell === 0 && (total === 1 || total === 2)) {
      return 1;
    }
    return cell;
  });
}

// part 2

function newLayout(width, height) {
  return new Array(width * height).fill(0);
}

// this is hardcoded for a 5 x 5 grid
function getNeighbours(x, y, z) {
  const center = 2;
  const neighbours = [];

  if (x === 0) {
    neighbours.push([center - 1, center, z + 1]);
  } else if (x === center + 1 && y === center) {
    // east center
    neighbours.push(
      [4, 0, z - 1],
      [4, 1, z - 1],
      [4, 2, z - 1],
      [4, 3, z - 1],
      [4, 4, z - 1]
    );
  } else {
    neighbours.push([x - 1, y, z]);
  }
  if (x === 4) {
    neighbours.push([center + 1, center, z + 1]);
  } else if (x === center - 1 && y === center) {
    // west center
    neighbours.push(
      [0, 0, z - 1],
      [0, 1, z - 1],
      [0, 2, z - 1],
      [0, 3, z - 1],
      [0, 4, z - 1]
    );
  } else {
    neighbours.push([x + 1, y, z]);
  }

  if (y === 0) {
    neighbours.push([center, center - 1, z + 1]);
  } else if (x === center && y === center + 1) {
    // south center
    neighbours.push(
      [0, 4, z - 1],
      [1, 4, z - 1],
      [2, 4, z - 1],
      [3, 4, z - 1],
      [4, 4, z - 1]
    );
  } else {
    neighbours.push([x, y - 1, z]);
  }

  if (y === 4) {
    neighbours.push([center, center + 1, z + 1]);
  } else if (x === center && y === center - 1) {
    // north center
    neighbours.push(
      [0, 0, z - 1],
      [1, 0, z - 1],
      [2, 0, z - 1],
      [3, 0, z - 1],
      [4, 0, z - 1]
    );
  } else {
    neighbours.push([x, y + 1, z]);
  }

  return neighbours;
}

function tickInfinite(layouts, width, height) {
  const newLayouts = [...layouts];
  // layouts start out empty so we add depth in each
  // direction if the top or bottom layout isn't empty
  if (getRating(layouts[0]) !== 0) {
    newLayouts.unshift(newLayout(width, height));
  }
  if (getRating(layouts[layouts.length - 1]) !== 0) {
    newLayouts.push(newLayout(width, height));
  }
  return newLayouts.map((layout, z) =>
    layout.map((cell, i) => {
      const x = i % width;
      const y = Math.floor(i / height);
      // center cell do nothing
      if (x === 2 && y === 2) return 0;
      const total = getNeighbours(x, y, z)
        .map(([x2, y2, z2]) =>
          newLayouts[z2] ? newLayouts[z2][y2 * width + x2] || 0 : 0
        )
        .reduce((a, b) => a + b);
      // bug dies unless there is exactly one adjacent bug
      if (cell === 1 && total !== 1) {
        return 0;
      }
      // empty space becomes bug if it has 1 or 2 adjacent bugs
      if (cell === 0 && (total === 1 || total === 2)) {
        return 1;
      }
      return cell;
    })
  );
}

// this is your part 2 function, rating returned is the answer
function generate(input, minutes = 10) {
  const { layout, width, height } = parseInput(input);
  let layouts = [layout.reverse()];
  let i = 0;
  while (i < minutes) {
    i++;
    layouts = tickInfinite(layouts, width, height);
  }
  return layouts.map(layout => layout.reduce((a, b) => a + b)).reduce((a, b) => a + b);
}

// THIS IS ALL TEST CODE BELOW HERE AS THE EXAMPLE GAVE VERY LITTLE IN TERMS OF TEST CASES
// used to test outputs
function layoutToAscii(layout) {
  const cells = layout.map(c => (c === 1 ? "#" : ".")).reverse();
  return new Array(5)
    .fill(0)
    .map((c, n) => cells.slice(n * 5, n * 5 + 5).join(""))
    .join("\n");
}

// used to test my getNeighbours function is correct against the test cases
function testNeighbours(x, y, z) {
  const layouts = [
    "ABCDEFGHIJKLMNOPQRSTUVWXY".split(""),
    Array(25)
      .fill(0)
      .map((n, i) => i + 1)
  ];
  return getNeighbours(x, y, z)
    .map(([x2, y2, z2]) => (layouts[z2] ? layouts[z2][y2 * 5 + x2] : "?"))
    .sort();
}

// 19 = testNeighbours(3, 3, 1) = [14, 18, 20, 24]
// G  = testNeighbours(1, 1, 0) = ["B", "F", "H", "L"]
// D  = testNeighbours(3, 0, 0) = [8, "C", "E", "I"]
// E  = testNeighbours(4, 0, 0) = [14, 8, "D", "J"]
// N  = testNeighbours(3, 2, 0) = ["?", "?", "?", "?", "?", "I", "O", "S"]
// 8  = testNeighbours(2, 1, 1) = [3, 7, 9, "A", "B", "C", "D", "E"]
// 14 = testNeighbours(3, 2, 1) = [15, 19, 9, "E", "J", "O", "T", "Y"]
// 18 = testNeighbours(2, 3, 1) = [17, 19, 23, "U", "V", "W", "X", "Y"]
// 12 = testNeighbours(1, 2, 1) = [11, 17, 7, "A", "F", "K", "P", "U"]
