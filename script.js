import { parseArrayInput, validateInput, generateRandomArray } from './js/algorithm.js';
import { generateQuickSortSteps } from './js/steps.js';
import {
  createArrayBlocks,
  applyArrayStep,
  resetArrayView,
  setAnimationSpeed,
  delay,
  highlightPseudocodeLine,
  clearPseudocodeHighlight,
  updateStatsUI,
  updateSortedUI,
  updateNodeDetails
} from './js/animation.js';
import { ThreeQuickSortScene } from './js/threeScene.js';

const arrayInput = document.getElementById('arrayInput');
const speedControl = document.getElementById('speedControl');

const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const autoBtn = document.getElementById('autoBtn');
const resetBtn = document.getElementById('resetBtn');
const randomBtn = document.getElementById('randomBtn');

const messageBox = document.getElementById('messageBox');
const arrayContainer = document.getElementById('arrayContainer');
const sortedText = document.getElementById('sortedText');
const nodeDetails = document.getElementById('nodeDetails');

const compCountEl = document.getElementById('compCount');
const swapCountEl = document.getElementById('swapCount');
const depthCountEl = document.getElementById('depthCount');

let state = {
  originalArray: [],
  currentArray: [],
  steps: [],
  stepIndex: 0,
  prepared: false,
  autoRunning: false,
  finished: false,
  stats: {
    comparisons: 0,
    swaps: 0,
    maxDepth: 0
  }
};

const threeScene = new ThreeQuickSortScene('threeContainer', {
  onNodeClick: (nodeData) => {
    updateNodeDetails(nodeDetails, nodeData);
  }
});

function setMessage(text, type = '') {
  messageBox.textContent = text;
  messageBox.className = 'message-box';
  if (type) messageBox.classList.add(type);
}

function setControlsEnabled(enabled) {
  [runBtn, stepBtn, resetBtn, randomBtn].forEach(btn => {
    btn.disabled = !enabled;
  });
  // keep auto button enabled while auto mode is running so user can pause
  autoBtn.disabled = false;
}

function speedLevelToMs(level) {
  const map = {
    1: 520,
    2: 400,
    3: 300,
    4: 220,
    5: 160
  };
  return map[level] || 300;
}

function resetStats() {
  state.stats = { comparisons: 0, swaps: 0, maxDepth: 0 };
  updateStatsUI(state.stats, compCountEl, swapCountEl, depthCountEl);
  updateSortedUI(sortedText, null);
}

function getPseudocodeLine(step) {
  if (!step) return null;
  switch (step.type) {
    case 'recursive_call':
      return 1;
    case 'base_case':
      return 2;
    case 'choose_pivot':
      return 7;
    case 'random_swap':
      return 8;
    case 'compare':
      return 14;
    case 'swap':
      return 16;
    case 'partition_complete':
      return 18;
    case 'complete':
      return 18;
    default:
      return 13;
  }
}

function prepareSimulation() {
  const arr = parseArrayInput(arrayInput.value);
  const validation = validateInput(arr);

  if (!validation.valid) {
    setMessage(validation.message, validation.type || 'error');
    return false;
  }

  state.originalArray = [...arr];
  state.currentArray = [...arr];
  state.steps = generateQuickSortSteps(arr);
  state.stepIndex = 0;
  state.prepared = true;
  state.autoRunning = false;
  state.finished = false;

  resetStats();
  clearPseudocodeHighlight();
  resetArrayView(arrayContainer);
  createArrayBlocks(arrayContainer, state.currentArray);
  threeScene.initialize(state.steps.meta.treeNodes, state.currentArray);

  updateNodeDetails(nodeDetails, null);
  setAnimationSpeed(speedLevelToMs(Number(speedControl.value)));
  setMessage('Simulation prepared successfully.', 'success');
  return true;
}

async function applyStep(step) {
  const line = getPseudocodeLine(step);
  clearPseudocodeHighlight();
  if (line) highlightPseudocodeLine(line);

  if (step.depth !== undefined) {
    state.stats.maxDepth = Math.max(state.stats.maxDepth, step.depth);
  }
  if (step.type === 'compare') state.stats.comparisons++;
  if (step.type === 'swap' || step.type === 'random_swap') state.stats.swaps++;

  updateStatsUI(state.stats, compCountEl, swapCountEl, depthCountEl);

  await applyArrayStep(arrayContainer, state.currentArray, step);
  threeScene.applyStep(step, state.currentArray);

  if (step.type === 'random_swap' || step.type === 'swap') {
    const [i, j] = step.indices;
    [state.currentArray[i], state.currentArray[j]] = [state.currentArray[j], state.currentArray[i]];
  }

  if (step.type === 'partition_complete' && Array.isArray(step.arrayAfterPartition)) {
    state.currentArray = [...step.arrayAfterPartition];
  }

  if (step.type === 'complete') {
    updateSortedUI(sortedText, step.sortedArray);
    setMessage(`Sorted Array: [${step.sortedArray.join(', ')}]`, 'success');
  }

  if (step.nodeData) {
    updateNodeDetails(nodeDetails, step.nodeData);
  }
}

async function processStep() {
  if (!state.prepared || state.finished) return;

  if (state.stepIndex >= state.steps.sequence.length) {
    state.finished = true;
    state.autoRunning = false;
    autoBtn.textContent = 'Auto';
    return;
  }

  const step = state.steps.sequence[state.stepIndex];
  await applyStep(step);
  state.stepIndex++;

  if (state.stepIndex >= state.steps.sequence.length) {
    state.finished = true;
    state.autoRunning = false;
    autoBtn.textContent = 'Auto';
  }
}

async function runAuto() {
  state.autoRunning = true;
  autoBtn.textContent = 'Pause';
  setControlsEnabled(false);

  while (state.autoRunning && state.stepIndex < state.steps.sequence.length) {
    await processStep();
    await delay(40);
  }

  if (state.stepIndex >= state.steps.sequence.length) {
    state.autoRunning = false;
    autoBtn.textContent = 'Auto';
  }

  setControlsEnabled(true);
}

runBtn.addEventListener('click', async () => {
  if (!prepareSimulation()) return;
  await runAuto();
});

stepBtn.addEventListener('click', async () => {
  if (!state.prepared) {
    const ok = prepareSimulation();
    if (!ok) return;
  }
  if (state.autoRunning) return;
  await processStep();
});

autoBtn.addEventListener('click', async () => {
  if (!state.prepared) {
    const ok = prepareSimulation();
    if (!ok) return;
  }

  if (state.finished) return;

  if (state.autoRunning) {
    state.autoRunning = false;
    autoBtn.textContent = 'Auto';
    setMessage('Auto playback paused.', 'warning');
  } else {
    setMessage('Auto playback running.', 'success');
    await runAuto();
  }
});

resetBtn.addEventListener('click', () => {
  state = {
    originalArray: [],
    currentArray: [],
    steps: [],
    stepIndex: 0,
    prepared: false,
    autoRunning: false,
    finished: false,
    stats: { comparisons: 0, swaps: 0, maxDepth: 0 }
  };

  resetStats();
  clearPseudocodeHighlight();
  resetArrayView(arrayContainer);
  threeScene.dispose();
  updateNodeDetails(nodeDetails, null);
  setMessage('Visualization reset.', 'warning');
});

randomBtn.addEventListener('click', () => {
  const length = 7 + Math.floor(Math.random() * 5);
  const arr = generateRandomArray(length);
  arrayInput.value = arr.join(',');
  setMessage('Random array generated.', 'success');
});

speedControl.addEventListener('input', () => {
  setAnimationSpeed(speedLevelToMs(Number(speedControl.value)));
});

window.addEventListener('beforeunload', () => {
  threeScene.dispose();
});