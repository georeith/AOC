function stripRepeatingChars(str) {
    return str.replace(/(.)\1{2,}/g, '');
}
function isValid(password) {
  return (
    password
      .split("")
      .sort()
      .join("") === password && /(.)\1/.test(stripRepeatingChars(password))
  );
}

function countPasswordsInRange(start, end) {
  let validCount = 0;
  for (let i = start; i <= end; i++) {
    const password = `${i}`;
    if (isValid(password)) {
      validCount += 1;
    }
  }
  return validCount;
}
