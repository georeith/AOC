function getReactions(input) {
  return input
    .split("\n")
    .map(line => {
      const [reagents, [result]] = line.split(" => ").map(side =>
        side.split(", ").map(ingredient => {
          [output, name] = ingredient.split(" ");
          return {
            output: parseInt(output, 10),
            name
          };
        })
      );
      return {
        reagents,
        result
      };
    })
    .reduce(
      (acc, { reagents, result: { name, output } }) => ({
        ...acc,
        [name]: {
          reagents,
          output
        }
      }),
      {}
    );
}

function getOreRequired(recipe, name, amount, storage = {}) {
    if (name === 'ORE') return amount;
    const reaction = recipe[name];
    const { reagents, output } = reaction;
    const storedAmount = storage[name] || 0;
    const amountToMake = amount - storedAmount;
    if (amountToMake <= 0) {
        storage[name] = storedAmount - amount;
        return 0;
    }
    const times = Math.ceil(amountToMake / output);
    const excess = (times * output) - amountToMake;
    storage[name] = excess;
    return reagents.reduce((acc, reagent) => {
        return acc + getOreRequired(recipe, reagent.name, reagent.output * times, storage)
    } , 0);
}

function calculateOreRequired(input) {
    const recipe = getReactions(input);
    return getOreRequired(recipe, 'FUEL', 1);
}

function calculatePotentialFuel(input, ore) {
    const recipe = getReactions(input);
    return binarySearch(i => getOreRequired(recipe, "FUEL", i) > ore);
}

function binarySearch(predicate) {
  let low = -1;
  let high = 1e16;
  while (1 + low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (predicate(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return high - 1;
}