let animationSpeed = 300;

export function setAnimationSpeed(ms) {
  animationSpeed = ms;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function resetArrayView(container) {
  container.innerHTML = '';
}

export function createArrayBlocks(container, arr) {
  container.innerHTML = '';
  const blockWidth = window.innerWidth < 768 ? 68 : 78;
  const gap = 16;
  const top = 24;

  container.style.height = '165px';
  container.style.minWidth = `${arr.length * (blockWidth + gap) + 20}px`;

  arr.forEach((value, index) => {
    const block = document.createElement('div');
    block.className = 'array-block default';
    block.style.left = `${index * (blockWidth + gap)}px`;
    block.style.top = `${top}px`;
    block.dataset.index = index;

    block.innerHTML = `
      <div class="value">${value}</div>
      <div class="index">index ${index}</div>
    `;

    container.appendChild(block);
  });
}

function getBlocks(container) {
  return [...container.querySelectorAll('.array-block')];
}

function setDefaultState(container) {
  getBlocks(container).forEach(block => {
    block.classList.remove('active', 'pivot', 'compare', 'swap', 'sorted');
    block.classList.add('default');
    block.style.transform = 'translateY(0) scale(1)';
  });
}

function refreshValues(container, arr) {
  const blocks = getBlocks(container);
  blocks.forEach((block, idx) => {
    const value = block.querySelector('.value');
    const index = block.querySelector('.index');
    if (value) value.textContent = arr[idx];
    if (index) index.textContent = `index ${idx}`;
  });
}

function markRange(container, low, high, className = 'active') {
  const blocks = getBlocks(container);
  for (let i = low; i <= high; i++) {
    if (blocks[i]) {
      blocks[i].classList.remove('default');
      blocks[i].classList.add(className);
    }
  }
}

async function animateCompare(container, step) {
  setDefaultState(container);
  markRange(container, step.low, step.high, 'active');

  const blocks = getBlocks(container);
  const [j, pivotIndex] = step.indices;

  if (blocks[j]) {
    blocks[j].classList.remove('active');
    blocks[j].classList.add('compare');
    blocks[j].style.transform = 'translateY(-10px) scale(1.05)';
  }

  if (blocks[pivotIndex]) {
    blocks[pivotIndex].classList.remove('active');
    blocks[pivotIndex].classList.add('pivot');
    blocks[pivotIndex].style.transform = 'translateY(-12px) scale(1.08)';
  }

  await delay(animationSpeed);
}

async function animatePivot(container, step) {
  setDefaultState(container);
  markRange(container, step.low, step.high, 'active');

  const blocks = getBlocks(container);
  if (blocks[step.pivotIndex]) {
    blocks[step.pivotIndex].classList.remove('active');
    blocks[step.pivotIndex].classList.add('pivot');
    blocks[step.pivotIndex].style.transform = 'scale(1.1)';
  }

  await delay(animationSpeed);
}

async function animateSwap(container, arrAfter, step) {
  setDefaultState(container);
  markRange(container, step.low, step.high, 'active');

  const blocks = getBlocks(container);
  const [i, j] = step.indices;
  const blockA = blocks[i];
  const blockB = blocks[j];
  if (!blockA || !blockB) return;

  blockA.classList.remove('active');
  blockB.classList.remove('active');
  blockA.classList.add('swap');
  blockB.classList.add('swap');

  blockA.style.transform = 'translateY(-18px) scale(1.08)';
  blockB.style.transform = 'translateY(-18px) scale(1.08)';

  const leftA = blockA.style.left;
  const leftB = blockB.style.left;

  await delay(animationSpeed / 3);

  blockA.style.left = leftB;
  blockB.style.left = leftA;

  await delay(animationSpeed);

  if (i !== j) {
    const children = getBlocks(container);
    if (children[i] && children[j]) {
      if (i < j) {
        container.insertBefore(children[j], children[i]);
      } else {
        container.insertBefore(children[i], children[j]);
      }
    }
  }

  const updated = getBlocks(container);
  updated.forEach((block, idx) => {
    block.style.left = `${idx * ((window.innerWidth < 768 ? 68 : 78) + 16)}px`;
  });

  refreshValues(container, arrAfter);
  await delay(animationSpeed / 3);
}

async function animatePartitionComplete(container, arr, step) {
  setDefaultState(container);
  markRange(container, step.low, step.high, 'active');

  const blocks = getBlocks(container);
  if (blocks[step.pivotIndex]) {
    blocks[step.pivotIndex].classList.remove('active');
    blocks[step.pivotIndex].classList.add('pivot');
    blocks[step.pivotIndex].style.transform = 'scale(1.08)';
  }

  refreshValues(container, arr);
  await delay(animationSpeed);
}

async function animateComplete(container) {
  const blocks = getBlocks(container);
  blocks.forEach((block, idx) => {
    setTimeout(() => {
      block.classList.remove('default', 'active', 'pivot', 'compare', 'swap');
      block.classList.add('sorted');
      block.style.transform = 'scale(1.05)';
    }, idx * 40);
  });

  await delay(animationSpeed + blocks.length * 40);
}

export async function applyArrayStep(container, currentArray, step) {
  switch (step.type) {
    case 'recursive_call':
      setDefaultState(container);
      if (step.low <= step.high) {
        markRange(container, step.low, step.high, 'active');
      }
      await delay(animationSpeed / 1.5);
      break;

    case 'base_case':
      setDefaultState(container);
      if (step.low <= step.high) {
        markRange(container, step.low, step.high, 'sorted');
      }
      await delay(animationSpeed / 1.5);
      break;

    case 'choose_pivot':
      await animatePivot(container, step);
      break;

    case 'compare':
      await animateCompare(container, step);
      break;

    case 'random_swap': {
      const arrAfter = [...currentArray];
      const [a, b] = step.indices;
      [arrAfter[a], arrAfter[b]] = [arrAfter[b], arrAfter[a]];
      await animateSwap(container, arrAfter, step);
      break;
    }

    case 'swap': {
      const arrAfter = [...currentArray];
      const [a, b] = step.indices;
      [arrAfter[a], arrAfter[b]] = [arrAfter[b], arrAfter[a]];
      await animateSwap(container, arrAfter, step);
      break;
    }

    case 'partition_complete':
      await animatePartitionComplete(container, step.arrayAfterPartition, step);
      break;

    case 'complete':
      await animateComplete(container);
      break;

    default:
      await delay(animationSpeed / 2);
      break;
  }
}

export function highlightPseudocodeLine(lineNumber) {
  document.querySelectorAll('#pseudocode span').forEach(span => {
    span.classList.toggle('active', Number(span.dataset.line) === lineNumber);
  });
}

export function clearPseudocodeHighlight() {
  document.querySelectorAll('#pseudocode span').forEach(span => {
    span.classList.remove('active');
  });
}

export function updateStatsUI(stats, compEl, swapEl, depthEl) {
  compEl.textContent = stats.comparisons;
  swapEl.textContent = stats.swaps;
  depthEl.textContent = stats.maxDepth;
}

export function updateSortedUI(el, arr) {
  el.textContent = arr ? `Sorted Array: [${arr.join(', ')}]` : 'Sorted Array: [ ]';
}

export function updateNodeDetails(el, nodeData) {
  if (!nodeData) {
    el.innerHTML = 'Click a graph node to inspect its recursive call details.';
    return;
  }

  el.innerHTML = `
    <strong>Node ID:</strong> ${nodeData.id || '—'}<br>
    <strong>Range:</strong> [${nodeData.low}, ${nodeData.high}]<br>
    <strong>Depth:</strong> ${nodeData.depth ?? '—'}<br>
    <strong>Phase:</strong> ${nodeData.phase || '—'}<br>
    <strong>Subarray:</strong> [${(nodeData.subarray || []).join(', ')}]<br>
    ${nodeData.pivotValue !== undefined ? `<strong>Pivot Value:</strong> ${nodeData.pivotValue}<br>` : ''}
    ${nodeData.pivotIndex !== undefined ? `<strong>Pivot Index:</strong> ${nodeData.pivotIndex}<br>` : ''}
    ${nodeData.swapIndices ? `<strong>Swap Indices:</strong> [${nodeData.swapIndices.join(', ')}]<br>` : ''}
  `;
}