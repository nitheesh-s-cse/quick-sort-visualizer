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

  if (arr.some(n => Number.isNaN(n) || !Number.isFinite(n))) {
    return { valid: false, message: 'Array must contain only valid numbers.', type: 'error' };
  }

  if (arr.length > 20) {
    return { valid: false, message: 'Maximum array size is 20.', type: 'warning' };
  }

  return { valid: true };
}

export function randomInt(low, high) {
  return low + Math.floor(Math.random() * (high - low + 1));
}

export function generateRandomArray(length = 8) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(1 + Math.floor(Math.random() * 99));
  }
  return arr;
}

/* Core algorithm implementation */
export function randomizedQuickSort(arr) {
  function partition(a, low, high) {
    const pivot = a[high];
    let i = low - 1;
    for (let j = low; j <= high - 1; j++) {
      if (a[j] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    return i + 1;
  }

  function randomPartition(a, low, high) {
    const randomIndex = randomInt(low, high);
    [a[randomIndex], a[high]] = [a[high], a[randomIndex]];
    return partition(a, low, high);
  }

  function quickSort(a, low, high) {
    if (low < high) {
      const pivotIndex = randomPartition(a, low, high);
      quickSort(a, low, pivotIndex - 1);
      quickSort(a, pivotIndex + 1, high);
    }
  }

  const copy = [...arr];
  quickSort(copy, 0, copy.length - 1);
  return copy;
}