import { randomInt } from './algorithm.js';
import { buildTreeLayout } from './graphLayout.js';

export function generateQuickSortSteps(inputArray) {
  const arr = [...inputArray];
  const sequence = [];
  const treeNodes = [];
  let nodeIdCounter = 0;
  let orderCounterByDepth = {};

  function nextOrder(depth) {
    if (!(depth in orderCounterByDepth)) orderCounterByDepth[depth] = 0;
    return orderCounterByDepth[depth]++;
  }

  function createNode(low, high, depth, parentId, subarraySnapshot) {
    const id = `node-${nodeIdCounter++}`;
    const node = {
      id,
      low,
      high,
      depth,
      parentId,
      order: nextOrder(depth),
      subarray: [...subarraySnapshot]
    };
    treeNodes.push(node);
    return node;
  }

  function partition(a, low, high, depth, node) {
    const pivot = a[high];

    sequence.push({
      type: 'choose_pivot',
      low,
      high,
      pivotIndex: high,
      pivotValue: pivot,
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'choose_pivot',
        pivotValue
      }
    });

    let i = low - 1;

    for (let j = low; j <= high - 1; j++) {
      sequence.push({
        type: 'compare',
        low,
        high,
        indices: [j, high],
        j,
        pivotIndex: high,
        pivotValue: pivot,
        depth,
        nodeId: node.id,
        nodeData: {
          ...node,
          phase: 'compare',
          comparingIndex: j,
          pivotValue: pivot
        }
      });

      if (a[j] < pivot) {
        i++;
        sequence.push({
          type: 'swap',
          indices: [i, j],
          low,
          high,
          depth,
          nodeId: node.id,
          nodeData: {
            ...node,
            phase: 'swap',
            swapIndices: [i, j],
            pivotValue: pivot
          }
        });
        [a[i], a[j]] = [a[j], a[i]];
      }
    }

    sequence.push({
      type: 'swap',
      indices: [i + 1, high],
      low,
      high,
      depth,
      finalPivotSwap: true,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'final_pivot_swap',
        swapIndices: [i + 1, high],
        pivotValue: pivot
      }
    });
    [a[i + 1], a[high]] = [a[high], a[i + 1]];

    sequence.push({
      type: 'partition_complete',
      low,
      high,
      pivotIndex: i + 1,
      pivotValue: a[i + 1],
      depth,
      arrayAfterPartition: [...a],
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'partition_complete',
        pivotIndex: i + 1,
        pivotValue: a[i + 1]
      }
    });

    return i + 1;
  }

  function randomPartition(a, low, high, depth, node) {
    const randomIndex = randomInt(low, high);

    sequence.push({
      type: 'choose_pivot',
      low,
      high,
      pivotIndex: randomIndex,
      pivotValue: a[randomIndex],
      randomSelection: true,
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'random_choice',
        pivotIndex: randomIndex,
        pivotValue: a[randomIndex]
      }
    });

    sequence.push({
      type: 'random_swap',
      indices: [randomIndex, high],
      low,
      high,
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'random_swap',
        swapIndices: [randomIndex, high],
        pivotValue: a[randomIndex]
      }
    });

    [a[randomIndex], a[high]] = [a[high], a[randomIndex]];
    return partition(a, low, high, depth, node);
  }

  function quickSort(a, low, high, depth = 0, parentId = null) {
    const node = createNode(low, high, depth, parentId, a.slice(low, high + 1));

    sequence.push({
      type: 'recursive_call',
      low,
      high,
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'recursive_call'
      }
    });

    if (low < high) {
      const pivotIndex = randomPartition(a, low, high, depth, node);

      sequence.push({
        type: 'recursive_call',
        low,
        high: pivotIndex - 1,
        depth: depth + 1,
        parentNodeId: node.id,
        branch: 'left',
        nodeData: {
          ...node,
          phase: 'spawn_left',
          pivotIndex
        }
      });

      quickSort(a, low, pivotIndex - 1, depth + 1, node.id);

      sequence.push({
        type: 'recursive_call',
        low: pivotIndex + 1,
        high,
        depth: depth + 1,
        parentNodeId: node.id,
        branch: 'right',
        nodeData: {
          ...node,
          phase: 'spawn_right',
          pivotIndex
        }
      });

      quickSort(a, pivotIndex + 1, high, depth + 1, node.id);
    } else {
      sequence.push({
        type: 'base_case',
        low,
        high,
        depth,
        nodeId: node.id,
        nodeData: {
          ...node,
          phase: 'base_case'
        }
      });
    }
  }

  quickSort(arr, 0, arr.length - 1, 0, null);

  sequence.push({
    type: 'complete',
    sortedArray: [...arr],
    depth: 0
  });

  buildTreeLayout(treeNodes);

  return {
    sequence,
    meta: {
      treeNodes
    }
  };
}