export function computeTreeLayout(nodes) {
  const byDepth = new Map();

  nodes.forEach(node => {
    if (!byDepth.has(node.depth)) byDepth.set(node.depth, []);
    byDepth.get(node.depth).push(node);
  });

  const depths = [...byDepth.keys()].sort((a, b) => a - b);

  depths.forEach(depth => {
    const row = byDepth.get(depth);
    row.sort((a, b) => a.order - b.order);

    const spacingX = Math.max(5.5, 24 / Math.max(1, row.length));
    const startX = -((row.length - 1) * spacingX) / 2;

    row.forEach((node, index) => {
      node.x = startX + index * spacingX;
      node.y = -depth * 5.0;
      node.z = -depth * 0.8;
    });
  });

  return nodes;
}