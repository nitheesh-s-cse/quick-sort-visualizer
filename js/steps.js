import { randomInt } from './algorithm.js';
import { computeTreeLayout } from './treeLayout.js';

export function generateQuickSortTreeSteps(inputArray) {
  const arr = [...inputArray];
  const sequence = [];
  const nodes = [];
  let nodeCounter = 0;
  const orderByDepth = {};

  function nextOrder(depth) {
    if (!(depth in orderByDepth)) orderByDepth[depth] = 0;
    return orderByDepth[depth]++;
  }

  function createNodeObject(subarray, depth, parentId, branchLabel, low, high) {
    const node = {
      id: `node-${nodeCounter++}`,
      subarray: [...subarray],
      depth,
      parentId,
      branchLabel,
      low,
      high,
      order: nextOrder(depth),
      pivotValue: null,
      pivotIndexLocal: null,
      leftPartition: [],
      rightPartition: []
    };
    nodes.push(node);
    return node;
  }

  function quickSortRecursive(subarray, depth = 0, parentId = null, branchLabel = 'root', low = 0, high = subarray.length - 1) {
    const node = createNodeObject(subarray, depth, parentId, branchLabel, low, high);

    sequence.push({
      type: 'create_node',
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'create_node'
      }
    });

    sequence.push({
      type: 'recursion_call',
      depth,
      nodeId: node.id,
      nodeData: {
        ...node,
        phase: 'recursion_call'
      }
    });

    if (subarray.length <= 1) {
      sequence.push({
        type: 'base_case',
        depth,
        nodeId: node.id,
        nodeData: {
          ...node,
          phase: 'base_case'
        }
      });
      return [...subarray];
    }

    const working = [...subarray];
    const randomIndex = randomInt(0, working.length - 1);
    [working[randomIndex], working[working.length - 1]] = [working[working.length - 1], working[randomIndex]];
    const pivot = working[working.length - 1];
    node.pivotValue = pivot;
    node.pivotIndexLocal = working.length - 1;

    sequence.push({
      type: 'choose_pivot',
      depth,
      nodeId: node.id,
      pivotValue: pivot,
      pivotIndexLocal: node.pivotIndexLocal,
      nodeData: {
        ...node,
        subarray: [...working],
        phase: 'choose_pivot',
        pivotValue: pivot,
        pivotIndexLocal: working.length - 1
      }
    });

    const left = [];
    const right = [];

    for (let j = 0; j < working.length - 1; j++) {
      sequence.push({
        type: 'compare',
        depth,
        nodeId: node.id,
        compareIndex: j,
        pivotValue: pivot,
        pivotIndexLocal: working.length - 1,
        nodeData: {
          ...node,
          subarray: [...working],
          phase: 'compare',
          compareIndex: j,
          pivotValue: pivot
        }
      });

      if (working[j] < pivot) {
        left.push(working[j]);
        sequence.push({
          type: 'partition_left',
          depth,
          nodeId: node.id,
          movedValue: working[j],
          leftSnapshot: [...left],
          rightSnapshot: [...right],
          nodeData: {
            ...node,
            subarray: [...working],
            phase: 'partition_left',
            movedValue: working[j],
            leftPartition: [...left],
            rightPartition: [...right],
            pivotValue: pivot
          }
        });
      } else {
        right.push(working[j]);
        sequence.push({
          type: 'partition_right',
          depth,
          nodeId: node.id,
          movedValue: working[j],
          leftSnapshot: [...left],
          rightSnapshot: [...right],
          nodeData: {
            ...node,
            subarray: [...working],
            phase: 'partition_right',
            movedValue: working[j],
            leftPartition: [...left],
            rightPartition: [...right],
            pivotValue: pivot
          }
        });
      }
    }

    node.leftPartition = [...left];
    node.rightPartition = [...right];

    sequence.push({
      type: 'create_node',
      depth: depth + 1,
      parentNodeId: node.id,
      branch: '< pivot',
      previewSubarray: [...left],
      nodeData: {
        ...node,
        phase: 'create_left_child',
        leftPartition: [...left],
        rightPartition: [...right],
        pivotValue: pivot
      }
    });

    const sortedLeft = quickSortRecursive(left, depth + 1, node.id, '< pivot', low, low + left.length - 1);

    sequence.push({
      type: 'create_node',
      depth: depth + 1,
      parentNodeId: node.id,
      branch: '>= pivot',
      previewSubarray: [...right],
      nodeData: {
        ...node,
        phase: 'create_right_child',
        leftPartition: [...left],
        rightPartition: [...right],
        pivotValue: pivot
      }
    });

    const sortedRight = quickSortRecursive(right, depth + 1, node.id, '>= pivot', low + left.length + 1, low + left.length + right.length);

    return [...sortedLeft, pivot, ...sortedRight];
  }

  const sortedArray = quickSortRecursive(arr);

  computeTreeLayout(nodes);

  sequence.push({
    type: 'complete',
    sortedArray,
    nodeData: null
  });

  return {
    sequence,
    meta: {
      nodes
    }
  };
}