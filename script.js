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
const treeContainer = document.getElementById('treeContainer');

window.addEventListener('error', event => {
  setMessage(`Runtime error: ${event.message} (see console)`, 'error');
});

window.addEventListener('unhandledrejection', event => {
  setMessage(`Unhandled promise rejection: ${event.reason}`, 'error');
});

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
  },
  treeNodes: [],
  nodeComparisonCounts: {}
};

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

function buildTreeView(treeNodes) {
  treeContainer.innerHTML = '';
  
  if (!treeNodes || treeNodes.length === 0) return;

  // Create SVG for tree connections
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tree-svg');
  svg.setAttribute('viewBox', '0 0 1400 800');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  
  // Add gradients defs
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'treeGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'rgba(75, 120, 216, 0.35)');
  gradient.appendChild(stop1);
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'rgba(100, 80, 200, 0.28)');
  gradient.appendChild(stop2);
  
  defs.appendChild(gradient);
  svg.appendChild(defs);
  
  treeContainer.appendChild(svg);

  // Calculate tree layout
  const nodePositions = new Map();
  const levelHeights = {};
  
  // Group nodes by depth
  const nodesByDepth = {};
  treeNodes.forEach(node => {
    if (!nodesByDepth[node.depth]) nodesByDepth[node.depth] = [];
    nodesByDepth[node.depth].push(node);
  });

  // Calculate positions for each node
  const maxDepth = Math.max(...Object.keys(nodesByDepth).map(Number));
  const depths = Object.keys(nodesByDepth).map(Number).sort((a, b) => a - b);
  
  const nodeWidth = 140;
  const nodeHeight = 100;
  const verticalGap = 140;
  const horizontalGap = 160;

  depths.forEach(depth => {
    const depthNodes = nodesByDepth[depth];
    depthNodes.sort((a, b) => a.order - b.order);
    
    const nodesAtDepth = depthNodes.length;
    const totalWidth = nodesAtDepth * horizontalGap;
    const startX = (1400 - totalWidth) / 2;
    const y = depth * verticalGap + 40;

    depthNodes.forEach((node, index) => {
      const x = startX + index * horizontalGap + horizontalGap / 2;
      nodePositions.set(node.id, { x, y, node });
    });
  });

  // Draw lines connecting parent to children
  treeNodes.forEach(node => {
    if (node.parentId) {
      const childPos = nodePositions.get(node.id);
      const parentPos = nodePositions.get(node.parentId);
      
      if (childPos && parentPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentPos.x);
        line.setAttribute('y1', parentPos.y + nodeHeight / 2);
        line.setAttribute('x2', childPos.x);
        line.setAttribute('y2', childPos.y - nodeHeight / 2);
        line.setAttribute('class', 'tree-connection');
        svg.appendChild(line);
      }
    }
  });

  // Create node boxes with details
  depths.forEach(depth => {
    const depthNodes = nodesByDepth[depth];
    depthNodes.sort((a, b) => a.order - b.order);
    
    depthNodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'tree-node-group');
      g.setAttribute('data-node-id', node.id);
      
      // Background rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', pos.x - nodeWidth / 2);
      rect.setAttribute('y', pos.y - nodeHeight / 2);
      rect.setAttribute('width', nodeWidth);
      rect.setAttribute('height', nodeHeight);
      rect.setAttribute('class', 'tree-node-box');
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      g.appendChild(rect);

      const comparableElements = node.subarray ? node.subarray.filter(el => el !== undefined) : [];
      const compCount = state.nodeComparisonCounts[node.id] || 0;

      // Range text
      const rangeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rangeText.setAttribute('x', pos.x);
      rangeText.setAttribute('y', pos.y - 30);
      rangeText.setAttribute('class', 'tree-node-text range');
      rangeText.setAttribute('text-anchor', 'middle');
      rangeText.textContent = `[${node.low}, ${node.high}]`;
      g.appendChild(rangeText);

      // Subarray text
      const subarrayText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subarrayText.setAttribute('x', pos.x);
      subarrayText.setAttribute('y', pos.y - 8);
      subarrayText.setAttribute('class', 'tree-node-text subarray');
      subarrayText.setAttribute('text-anchor', 'middle');
      const shortArray = comparableElements.length > 4 
        ? `[${comparableElements.slice(0, 3).join(',')}...]`
        : `[${comparableElements.join(',')}]`;
      subarrayText.textContent = shortArray;
      g.appendChild(subarrayText);

      // Comparisons text
      const compText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      compText.setAttribute('x', pos.x);
      compText.setAttribute('y', pos.y + 15);
      compText.setAttribute('class', 'tree-node-text comparisons');
      compText.setAttribute('text-anchor', 'middle');
      compText.textContent = `Comp: ${compCount}`;
      g.appendChild(compText);

      // Depth text
      const depthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      depthText.setAttribute('x', pos.x);
      depthText.setAttribute('y', pos.y + 32);
      depthText.setAttribute('class', 'tree-node-text depth');
      depthText.setAttribute('text-anchor', 'middle');
      depthText.textContent = `D:${node.depth}`;
      g.appendChild(depthText);

      // Add hover/click interaction
      g.style.cursor = 'pointer';
      g.addEventListener('mouseenter', () => {
        rect.setAttribute('class', 'tree-node-box hover');
      });
      g.addEventListener('mouseleave', () => {
        rect.setAttribute('class', 'tree-node-box');
      });
      g.addEventListener('click', () => {
        updateNodeDetails(nodeDetails, node);
      });

      svg.appendChild(g);
    });
  });

  // Add legend below tree
  const legend = document.createElement('div');
  legend.className = 'tree-legend';
  legend.innerHTML = `
    <div style="font-size: 0.85rem; color: var(--muted); text-align: center; margin-top: 16px;">
      <strong style="color: var(--primary-2);">Tree Legend:</strong> 
      [low, high] = Array range | [elements] = Subarray | Comp = Comparisons at this node | D = Depth
    </div>
  `;
  treeContainer.appendChild(legend);
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
  state.treeNodes = state.steps.meta.treeNodes;
  state.nodeComparisonCounts = {};

  // Initialize comparison counts for all nodes
  state.treeNodes.forEach(node => {
    state.nodeComparisonCounts[node.id] = 0;
  });

  resetStats();
  clearPseudocodeHighlight();
  resetArrayView(arrayContainer);
  createArrayBlocks(arrayContainer, state.currentArray);
  buildTreeView(state.treeNodes);

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
  if (step.type === 'compare') {
    state.stats.comparisons++;
    // Track comparisons per node
    if (step.nodeId) {
      state.nodeComparisonCounts[step.nodeId] = (state.nodeComparisonCounts[step.nodeId] || 0) + 1;
      buildTreeView(state.treeNodes);
    }
  }
  if (step.type === 'swap' || step.type === 'random_swap') state.stats.swaps++;

  updateStatsUI(state.stats, compCountEl, swapCountEl, depthCountEl);

  await applyArrayStep(arrayContainer, state.currentArray, step);

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
    stats: { comparisons: 0, swaps: 0, maxDepth: 0 },
    treeNodes: [],
    nodeComparisonCounts: {}
  };

  resetStats();
  clearPseudocodeHighlight();
  resetArrayView(arrayContainer);
  treeContainer.innerHTML = '';
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