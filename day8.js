function getLayers(input, width, height) {
  return splitByLength(input, width * height);
}

function getAnswer(input, width = 25, height = 6) {
  let zeroCount = Infinity;
  let answer = null;
  const layers = getLayers(input, width, height);
  for (const layer of layers) {
    const layerZeroCount = countOccurences(layer, "0");
    if (layerZeroCount < zeroCount) {
      zeroCount = layerZeroCount;
      answer = countOccurences(layer, "1") * countOccurences(layer, "2");
      console.log("zero", layerZeroCount, layer, answer);
    }
  }
  return answer;
}

function countOccurences(str, substr) {
  return (str.match(new RegExp(substr, "g")) || []).length;
}

function splitByLength(strOrArr, length) {
  const pieces = [];
  for (let i = 0; i < strOrArr.length; i += length) {
    const piece = strOrArr.slice(i, i + length);
    pieces.push(piece);
  }
  return pieces;
}

function getImage(input, width = 25, height = 6) {
  console.log(getLayers(input, width, height));
  const pixels = getLayers(input, width, height).reduce((acc, layer) =>
    acc
      .split("")
      .map((pixel, i) => (pixel === "2" ? layer[i] : pixel))
      .join("")
  );
  const image = splitByLength(pixels, width).join("\n").replace(/0/g, ' ');
  return image;
}