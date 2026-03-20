import { parseArrayInput, validateInput } from './js/algorithm.js';
import { generateQuickSortTreeSteps } from './js/steps.js';
import {
  setAnimationSpeed,
  delay,
  highlightPseudocodeLine,
  clearPseudocodeHighlight,
  updateStatsUI,
  updateSortedUI,
  updateNodeDetails
} from './js/animation.js';
import { QuickSortTreeScene } from './js/threeScene.js';

const arrayInput = document.getElementById('arrayInput');
const speedControl = document.getElementById('speedControl');

const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const autoBtn = document.getElementById('autoBtn');
const resetBtn = document.getElementById('resetBtn');

const messageBox = document.getElementById('messageBox');
const sortedText = document.getElementById('sortedText');
const compCountEl = document.getElementById('compCount');
const swapCountEl = document.getElementById('swapCount');
const depthCountEl = document.getElementById('depthCount');
const nodeDetails = document.getElementById('nodeDetails');

let state = {
  originalArray: [],
  steps: [],
  stepIndex: 0,
  prepared: false,
  autoRunning: false,
  finished: false,
  stats: {
    comparisons: 0,
    swaps: 0,
    depth: 0
  }
};

const treeScene = new QuickSortTreeScene('threeContainer', {
  onNodeClick: (nodeData) => {
    updateNodeDetails(nodeDetails, nodeData);
  }
});

function setMessage(text, type = '') {
  messageBox.textContent = text;
  messageBox.className = 'message-box';
  if (type) messageBox.classList.add(type);
}

function speedLevelToMs(level) {
  const map = {
    1: 700,
    2: 520,
    3: 360,
    4: 240,
    5: 160
  };
  return map[level] || 360;
}

function resetStats() {
  state.stats = {
    comparisons: 0,
    swaps: 0,
    depth: 0
  };
  updateStatsUI(state.stats, compCountEl, swapCountEl, depthCountEl);
  updateSortedUI(sortedText, null);
}

function getPseudocodeLine(step) {
  if (!step) return null;
  switch (step.type) {
    case 'recursion_call':
      return 1;
    case 'choose_pivot':
      return 7;
    case 'compare':
      return 12;
    case 'partition_left':
    case 'partition_right':
      return 13;
    case 'base_case':
      return 2;
    case 'complete':
      return 5;
    default:
      return 3;
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
  state.steps = generateQuickSortTreeSteps(arr);
  state.stepIndex = 0;
  state.prepared = true;
  state.autoRunning = false;
  state.finished = false;

  resetStats();
  clearPseudocodeHighlight();
  treeScene.initialize(state.steps.meta.nodes);
  updateNodeDetails(nodeDetails, null);

  setAnimationSpeed(speedLevelToMs(Number(speedControl.value)));
  setMessage('Recursion tree prepared successfully.', 'success');
  return true;
}

async function applyStep(step) {
  clearPseudocodeHighlight();
  const line = getPseudocodeLine(step);
  if (line) highlightPseudocodeLine(line);

  if (step.type === 'compare') state.stats.comparisons++;
  if (step.type === 'partition_left' || step.type === 'partition_right') state.stats.swaps++;
  if (step.depth !== undefined) state.stats.depth = Math.max(state.stats.depth, step.depth);

  updateStatsUI(state.stats, compCountEl, swapCountEl, depthCountEl);

  treeScene.applyStep(step);

  if (step.nodeData) {
    updateNodeDetails(nodeDetails, step.nodeData);
  }

  if (step.type === 'complete') {
    updateSortedUI(sortedText, step.sortedArray);
    setMessage(`Sorted Array: [${step.sortedArray.join(', ')}]`, 'success');
  }

  await delay(60);
}

async function processStep() {
  if (!state.prepared || state.finished) return;

  if (state.stepIndex >= state.steps.sequence.length) {
    state.finished = true;
    state.autoRunning = false;
    autoBtn.textContent = 'Auto play';
    return;
  }

  const step = state.steps.sequence[state.stepIndex];
  await applyStep(step);
  state.stepIndex++;

  if (state.stepIndex >= state.steps.sequence.length) {
    state.finished = true;
    state.autoRunning = false;
    autoBtn.textContent = 'Auto play';
  }
}

async function autoRun() {
  state.autoRunning = true;
  autoBtn.textContent = 'Pause';

  while (state.autoRunning && state.stepIndex < state.steps.sequence.length) {
    await processStep();
    await delay(40);
  }

  if (state.stepIndex >= state.steps.sequence.length) {
    state.autoRunning = false;
    autoBtn.textContent = 'Auto play';
  }
}

runBtn.addEventListener('click', async () => {
  if (!prepareSimulation()) return;
  await autoRun();
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
    autoBtn.textContent = 'Auto play';
    setMessage('Auto play paused.', 'warning');
  } else {
    setMessage('Auto play running.', 'success');
    await autoRun();
  }
});

resetBtn.addEventListener('click', () => {
  state = {
    originalArray: [],
    steps: [],
    stepIndex: 0,
    prepared: false,
    autoRunning: false,
    finished: false,
    stats: { comparisons: 0, swaps: 0, depth: 0 }
  };

  resetStats();
  clearPseudocodeHighlight();
  treeScene.dispose();
  updateNodeDetails(nodeDetails, null);
  setMessage('Visualization reset.', 'warning');
});

speedControl.addEventListener('input', () => {
  setAnimationSpeed(speedLevelToMs(Number(speedControl.value)));
});

window.addEventListener('beforeunload', () => {
  treeScene.dispose();
});