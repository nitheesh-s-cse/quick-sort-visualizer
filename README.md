# Randomized Quick Sort Visualization — CS3401 Seminar Project

## Project Overview
This project is an interactive educational website that visualizes **Randomized Quick Sort** using:
- HTML
- CSS
- JavaScript
- Three.js r128

It runs directly by opening `index.html` locally in a browser.

---

## Algorithm Explanation

Randomized Quick Sort works like Quick Sort, but instead of always using a fixed pivot, it first selects a **random pivot** from the current subarray.

### Pseudocode

```text
function quickSort(arr, low, high):
  if low < high:
    pivotIndex = randomPartition(arr, low, high)
    quickSort(arr, low, pivotIndex - 1)
    quickSort(arr, pivotIndex + 1, high)

function randomPartition(arr, low, high):
  randomIndex = random(low, high)
  swap(arr[randomIndex], arr[high])
  return partition(arr, low, high)

function partition(arr, low, high):
  pivot = arr[high]
  i = low - 1
  for j = low to high-1:
    if arr[j] < pivot:
      i++
      swap(arr[i], arr[j])
  swap(arr[i+1], arr[high])
  return i + 1