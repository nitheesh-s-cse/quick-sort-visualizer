export function parseArrayInput(input) {
  if (!input || !input.trim()) return [];
  return input
    .split(',')
    .map(v => v.trim())
    .filter(v => v !== '')
    .map(Number);
}

export function validateInput(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { valid: false, message: 'Please enter a valid non-empty array.', type: 'error' };
  }

  if (arr.some(v => Number.isNaN(v) || !Number.isFinite(v))) {
    return { valid: false, message: 'Array must contain only valid numbers.', type: 'error' };
  }

  if (arr.length > 15) {
    return { valid: false, message: 'Maximum array size is 15.', type: 'warning' };
  }

  return { valid: true };
}

export function randomInt(low, high) {
  return low + Math.floor(Math.random() * (high - low + 1));
}

export function randomizedQuickSort(arr) {
  const a = [...arr];

  function partition(array, low, high) {
    const pivot = array[high];
    let i = low - 1;
    for (let j = low; j <= high - 1; j++) {
      if (array[j] < pivot) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    return i + 1;
  }

  function randomPartition(array, low, high) {
    const randomIndex = randomInt(low, high);
    [array[randomIndex], array[high]] = [array[high], array[randomIndex]];
    return partition(array, low, high);
  }

  function quickSort(array, low, high) {
    if (low < high) {
      const p = randomPartition(array, low, high);
      quickSort(array, low, p - 1);
      quickSort(array, p + 1, high);
    }
  }

  quickSort(a, 0, a.length - 1);
  return a;
}