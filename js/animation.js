let animationSpeed = 360;

export function setAnimationSpeed(ms) {
  animationSpeed = ms;
}

export function delay(ms = animationSpeed) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  depthEl.textContent = stats.depth;
}

export function updateSortedUI(el, arr) {
  el.textContent = arr ? `Sorted Array: [${arr.join(', ')}]` : 'Sorted Array: [ ]';
}

export function updateNodeDetails(el, nodeData) {
  if (!nodeData) {
    el.innerHTML = 'Click a node to inspect its subtree.';
    return;
  }

  el.innerHTML = `
    <strong>Node ID:</strong> ${nodeData.id || '—'}<br>
    <strong>Depth:</strong> ${nodeData.depth ?? '—'}<br>
    <strong>Range:</strong> [${nodeData.low ?? '—'}, ${nodeData.high ?? '—'}]<br>
    <strong>Branch:</strong> ${nodeData.branchLabel || 'root'}<br>
    <strong>Subarray:</strong> [${(nodeData.subarray || []).join(', ')}]<br>
    ${nodeData.pivotValue !== null && nodeData.pivotValue !== undefined ? `<strong>Pivot:</strong> ${nodeData.pivotValue}<br>` : ''}
    ${nodeData.leftPartition ? `<strong>Left Partition:</strong> [${nodeData.leftPartition.join(', ')}]<br>` : ''}
    ${nodeData.rightPartition ? `<strong>Right Partition:</strong> [${nodeData.rightPartition.join(', ')}]<br>` : ''}
    ${nodeData.phase ? `<strong>Phase:</strong> ${nodeData.phase}<br>` : ''}
  `;
}