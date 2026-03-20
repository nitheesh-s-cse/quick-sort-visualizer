export class QuickSortTreeScene {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rootGroup = null;

    this.nodes = new Map();
    this.nodeMeshes = [];
    this.edges = [];

    this.animationId = null;
    this.clock = new THREE.Clock();

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.hoveredId = null;
    this.selectedId = null;

    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.rotationTarget = { x: -0.18, y: 0.0 };

    this.boundResize = this.onResize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundMouseDrag = this.onMouseDrag.bind(this);
  }

  initialize(nodes) {
    this.dispose();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08101d);

    const width = this.container.clientWidth || 1200;
    const height = this.container.clientHeight || 700;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, -8, 42);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.addLights();
    this.createTree(nodes);
    this.attachEvents();
    this.animate();
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.85);
    directional.position.set(4, 10, 10);
    this.scene.add(directional);

    const blueLight = new THREE.PointLight(0x4ea1ff, 0.8, 90);
    blueLight.position.set(-12, 2, 12);
    this.scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x18d0e6, 0.55, 90);
    cyanLight.position.set(12, -8, 14);
    this.scene.add(cyanLight);
  }

  createNodeTexture(node, style = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    const bg = style.bg || '#17305a';
    const border = style.border || '#274a84';
    const glow = style.glow || '#4ea1ff';
    const text = style.text || '#ffffff';

    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 8;
    this.roundRect(ctx, 20, 20, 984, 380, 28, true, true);

    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    this.roundRect(ctx, 28, 28, 968, 364, 24, false, true);

    ctx.fillStyle = '#dce9ff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Range: [${node.low}, ${node.high}]`, 44, 58);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#a9d8ff';
    ctx.fillText(node.branchLabel === 'root' ? 'Root Node' : `Branch: ${node.branchLabel}`, 44, 92);

    const arr = node.subarray || [];
    const pivotIndex = node.pivotIndexLocal;
    const boxW = Math.max(52, Math.min(78, Math.floor(860 / Math.max(1, arr.length))));
    const gap = 8;
    const totalW = arr.length * boxW + Math.max(0, arr.length - 1) * gap;
    const startX = Math.max(44, Math.floor((1024 - totalW) / 2));
    const y = 125;
    const h = 68;

    for (let i = 0; i < arr.length; i++) {
      const x = startX + i * (boxW + gap);

      ctx.fillStyle = '#0f1d38';
      ctx.strokeStyle = '#33538d';
      ctx.lineWidth = 3;
      this.roundRect(ctx, x, y, boxW, h, 12, true, true);

      if (pivotIndex !== null && pivotIndex !== undefined && i === pivotIndex) {
        ctx.strokeStyle = '#4ea1ff';
        ctx.lineWidth = 6;
        this.roundRect(ctx, x - 2, y - 2, boxW + 4, h + 4, 12, false, true);
      }

      ctx.fillStyle = text;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(String(arr[i]), x + boxW / 2, y + 42);
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Arial';

    ctx.fillStyle = '#6df0a4';
    ctx.fillText('<= pivot', 44, 250);
    this.drawMiniBoxes(ctx, node.leftPartition || [], 44, 268, '#143624', '#2dcc71');

    ctx.fillStyle = '#8aefff';
    ctx.fillText('>= pivot', 44, 338);
    this.drawMiniBoxes(ctx, node.rightPartition || [], 44, 356, '#0f3140', '#18d0e6');

    return new THREE.CanvasTexture(canvas);
  }

  drawMiniBoxes(ctx, arr, startX, startY, fill, stroke) {
    const boxW = 38;
    const boxH = 32;
    const gap = 6;

    for (let i = 0; i < arr.length && i < 18; i++) {
      const x = startX + i * (boxW + gap);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      this.roundRect(ctx, x, startY, boxW, boxH, 8, true, true);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(String(arr[i]), x + boxW / 2, startY + 21);
    }
    ctx.textAlign = 'left';
  }

  roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  createTree(nodes) {
    nodes.forEach(node => this.createNode(node));
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) this.createEdge(parent, node);
      }
    });
  }

  createNode(node) {
    const group = new THREE.Group();
    group.position.set(node.x, node.y, node.z);
    group.scale.set(0.001, 0.001, 0.001);

    const panelGeometry = new THREE.PlaneGeometry(7.6, 3.2);
    const texture = this.createNodeTexture(node, {});
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });

    const panel = new THREE.Mesh(panelGeometry, material);
    panel.userData = { nodeId: node.id };
    group.add(panel);

    const borderGeometry = new THREE.PlaneGeometry(7.8, 3.4);
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x254170,
      transparent: true,
      opacity: 0.18
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.z = -0.02;
    group.add(border);

    group.userData = {
      ...node,
      texture,
      targetScale: 1,
      hoverScale: 1,
      pulse: 1
    };

    this.rootGroup.add(group);
    this.nodes.set(node.id, group);
    this.nodeMeshes.push(panel);
  }

  createEdge(parentNode, childNode) {
    const start = new THREE.Vector3(parentNode.x, parentNode.y - 1.7, parentNode.z);
    const end = new THREE.Vector3(childNode.x, childNode.y + 1.7, childNode.z);
    const mid = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2 + 0.1);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(30);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4b7fd4,
      transparent: true,
      opacity: 0.7
    });

    const line = new THREE.Line(geometry, material);
    this.rootGroup.add(line);
    this.edges.push(line);
  }

  updateNodeVisual(nodeId, state) {
    const group = this.nodes.get(nodeId);
    if (!group) return;

    const baseNode = {
      id: group.userData.id,
      low: group.userData.low,
      high: group.userData.high,
      depth: group.userData.depth,
      branchLabel: group.userData.branchLabel,
      subarray: group.userData.subarray,
      pivotValue: group.userData.pivotValue,
      pivotIndexLocal: group.userData.pivotIndexLocal,
      leftPartition: group.userData.leftPartition || [],
      rightPartition: group.userData.rightPartition || []
    };

    let style = {
      bg: '#17305a',
      border: '#274a84',
      glow: '#4ea1ff',
      text: '#ffffff'
    };

    if (state === 'hover') {
      style = { bg: '#1d3b6d', border: '#4ea1ff', glow: '#7dc1ff', text: '#ffffff' };
    } else if (state === 'pivot') {
      style = { bg: '#16345e', border: '#4ea1ff', glow: '#4ea1ff', text: '#ffffff' };
    } else if (state === 'compare') {
      style = { bg: '#5c2d10', border: '#ff973d', glow: '#ff973d', text: '#fff7ed' };
    } else if (state === 'left') {
      style = { bg: '#133924', border: '#2dcc71', glow: '#2dcc71', text: '#effff5' };
    } else if (state === 'right') {
      style = { bg: '#103a4a', border: '#18d0e6', glow: '#18d0e6', text: '#eefcff' };
    } else if (state === 'final') {
      style = { bg: '#4a3a0f', border: '#ffd24d', glow: '#ffd24d', text: '#fff7d8' };
    }

    const panel = group.children[0];
    if (panel.material.map) panel.material.map.dispose();
    panel.material.map = this.createNodeTexture(baseNode, style);
    panel.material.needsUpdate = true;
  }

  resetNodeStates() {
    this.nodes.forEach((group, id) => {
      this.updateNodeVisual(id, 'default');
      group.userData.hoverScale = 1;
      group.userData.pulse = 1;
    });
  }

  revealNode(nodeId) {
    const group = this.nodes.get(nodeId);
    if (!group) return;
    group.userData.targetScale = 1;
  }

  focusNode(nodeId) {
    const group = this.nodes.get(nodeId);
    if (!group) return;
    this.selectedId = nodeId;
    this.camera.position.x = group.position.x;
    this.camera.position.y = group.position.y - 1;
    this.camera.position.z = 18;
  }

  applyStep(step) {
    if (!this.scene) return;

    if (step.type === 'create_node') {
      const targetId = step.nodeId || step.parentNodeId;
      if (targetId) this.revealNode(targetId);
    }

    if (step.type === 'recursion_call') {
      this.resetNodeStates();
      if (step.nodeId) {
        this.revealNode(step.nodeId);
        this.updateNodeVisual(step.nodeId, 'hover');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.08;
      }
    }

    if (step.type === 'choose_pivot') {
      this.resetNodeStates();
      if (step.nodeId) {
        this.updateNodeVisual(step.nodeId, 'pivot');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.12;
      }
    }

    if (step.type === 'compare') {
      this.resetNodeStates();
      if (step.nodeId) {
        this.updateNodeVisual(step.nodeId, 'compare');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.07;
      }
    }

    if (step.type === 'partition_left') {
      this.resetNodeStates();
      if (step.nodeId) {
        const group = this.nodes.get(step.nodeId);
        if (group) {
          group.userData.leftPartition = [...(step.leftSnapshot || [])];
          group.userData.rightPartition = [...(step.rightSnapshot || [])];
          this.updateNodeVisual(step.nodeId, 'left');
          group.userData.pulse = 1.1;
        }
      }
    }

    if (step.type === 'partition_right') {
      this.resetNodeStates();
      if (step.nodeId) {
        const group = this.nodes.get(step.nodeId);
        if (group) {
          group.userData.leftPartition = [...(step.leftSnapshot || [])];
          group.userData.rightPartition = [...(step.rightSnapshot || [])];
          this.updateNodeVisual(step.nodeId, 'right');
          group.userData.pulse = 1.1;
        }
      }
    }

    if (step.type === 'base_case') {
      this.resetNodeStates();
      if (step.nodeId) {
        this.updateNodeVisual(step.nodeId, 'final');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.08;
      }
    }

    if (step.type === 'complete') {
      this.nodes.forEach((group, id) => {
        this.updateNodeVisual(id, 'final');
        group.userData.pulse = 1.05;
      });
    }
  }

  attachEvents() {
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.container.addEventListener('click', this.boundClick);
    this.container.addEventListener('wheel', this.boundWheel, { passive: true });
    this.container.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('mousemove', this.boundMouseDrag);
    window.addEventListener('resize', this.boundResize);
  }

  onMouseMove(event) {
    if (!this.camera || !this.renderer) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersections = this.raycaster.intersectObjects(this.nodeMeshes);

    if (this.hoveredId) {
      const prev = this.nodes.get(this.hoveredId);
      if (prev) prev.userData.hoverScale = 1;
      this.hoveredId = null;
    }

    if (intersections.length > 0) {
      const nodeId = intersections[0].object.userData.nodeId;
      this.hoveredId = nodeId;
      const group = this.nodes.get(nodeId);
      if (group) group.userData.hoverScale = 1.08;
    }
  }

  onClick() {
    if (!this.hoveredId) return;
    this.focusNode(this.hoveredId);

    const group = this.nodes.get(this.hoveredId);
    if (group && this.options.onNodeClick) {
      this.options.onNodeClick({
        id: group.userData.id,
        depth: group.userData.depth,
        low: group.userData.low,
        high: group.userData.high,
        branchLabel: group.userData.branchLabel,
        subarray: group.userData.subarray,
        pivotValue: group.userData.pivotValue,
        leftPartition: group.userData.leftPartition,
        rightPartition: group.userData.rightPartition
      });
    }
  }

  onWheel(event) {
    if (!this.camera) return;
    this.camera.position.z += event.deltaY * 0.01;
    this.camera.position.z = Math.max(12, Math.min(65, this.camera.position.z));
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.prevMouse.x = event.clientX;
    this.prevMouse.y = event.clientY;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onMouseDrag(event) {
    if (!this.isDragging || !this.rootGroup) return;

    const dx = event.clientX - this.prevMouse.x;
    const dy = event.clientY - this.prevMouse.y;

    this.rotationTarget.y += dx * 0.004;
    this.rotationTarget.x += dy * 0.0025;
    this.rotationTarget.x = Math.max(-0.8, Math.min(0.4, this.rotationTarget.x));

    this.prevMouse.x = event.clientX;
    this.prevMouse.y = event.clientY;
  }

  animate() {
    const tick = () => {
      if (!this.scene || !this.camera || !this.renderer) return;

      if (this.rootGroup) {
        this.rootGroup.rotation.x = THREE.MathUtils.lerp(this.rootGroup.rotation.x, this.rotationTarget.x, 0.08);
        this.rootGroup.rotation.y = THREE.MathUtils.lerp(this.rootGroup.rotation.y, this.rotationTarget.y, 0.08);
      }

      this.nodes.forEach(group => {
        const target = group.userData.targetScale * group.userData.hoverScale * group.userData.pulse;
        group.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
        group.userData.pulse = THREE.MathUtils.lerp(group.userData.pulse, 1, 0.12);
        group.userData.targetScale = THREE.MathUtils.lerp(group.userData.targetScale, 1, 0.1);
      });

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(tick);
    };

    tick();
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = this.container.clientWidth || 1200;
    const height = this.container.clientHeight || 700;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.container) {
      this.container.removeEventListener('mousemove', this.boundMouseMove);
      this.container.removeEventListener('click', this.boundClick);
      this.container.removeEventListener('wheel', this.boundWheel);
      this.container.removeEventListener('mousedown', this.boundMouseDown);
    }

    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('mousemove', this.boundMouseDrag);
    window.removeEventListener('resize', this.boundResize);

    if (this.scene) {
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              if (m.map) m.map.dispose?.();
              m.dispose?.();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose?.();
            obj.material.dispose?.();
          }
        }
      });
    }

    this.nodes.clear();
    this.nodeMeshes = [];
    this.edges = [];

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rootGroup = null;

    if (this.container) this.container.innerHTML = '';
  }
}