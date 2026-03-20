export function buildTreeLayout(nodes) {
  const groupedByDepth = new Map();

  nodes.forEach(node => {
    if (!groupedByDepth.has(node.depth)) groupedByDepth.set(node.depth, []);
    groupedByDepth.get(node.depth).push(node);
  });

  const depthLevels = [...groupedByDepth.keys()].sort((a, b) => a - b);

  depthLevels.forEach(depth => {
    const row = groupedByDepth.get(depth);
    row.sort((a, b) => a.order - b.order);

    const spacing = Math.max(2.8, 10 / Math.max(1, row.length));
    const startX = -((row.length - 1) * spacing) / 2;

    row.forEach((node, index) => {
      node.x = startX + index * spacing;
      node.y = -depth * 2.8;
      node.z = 0;
    });
  });

  return nodes;
}