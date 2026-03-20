export class ThreeQuickSortScene {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rootGroup = null;

    this.nodes = new Map();
    this.edges = [];
    this.hoveredNode = null;
    this.selectedNode = null;

    this.animationId = null;
    this.clock = new THREE.Clock();

    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };
    this.rotationTarget = { x: -0.2, y: 0.0 };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.boundResize = this.onResize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundMouseDrag = this.onMouseDrag.bind(this);
  }

  initialize(treeNodes, currentArray) {
    this.dispose();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x09101e);

    const width = this.container.clientWidth || 1000;
    const height = this.container.clientHeight || 560;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, -2, 24);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.addLights();
    this.createGraph(treeNodes);
    this.attachEvents();

    this.animate();
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(3, 6, 10);
    this.scene.add(directional);

    const cyan = new THREE.PointLight(0x1dd6ff, 0.8, 50);
    cyan.position.set(-8, 2, 8);
    this.scene.add(cyan);

    const purple = new THREE.PointLight(0x9c5cff, 0.8, 50);
    purple.position.set(8, -5, 8);
    this.scene.add(purple);
  }

  createTextTexture(lines, bg = '#19305f', color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 228, 24);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(lines[0] || '', 256, 90);

    ctx.font = '28px Arial';
    ctx.fillText(lines[1] || '', 256, 148);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createNodeMesh(node) {
    const group = new THREE.Group();
    group.position.set(node.x, node.y, node.z);
    group.scale.set(0.001, 0.001, 0.001);

    const sphereGeometry = new THREE.SphereGeometry(0.72, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c2a55,
      emissive: 0x11224d,
      emissiveIntensity: 0.9,
      roughness: 0.22,
      metalness: 0.35
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.userData = { type: 'nodeSphere', nodeId: node.id };
    group.add(sphere);

    const labelTexture = this.createTextTexture(
      [`[${node.low}, ${node.high}]`, `${(node.subarray || []).join(', ')}`],
      '#1f366a'
    );

    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true
    });

    const label = new THREE.Sprite(labelMaterial);
    label.scale.set(2.4, 1.2, 1);
    label.position.set(0, 1.45, 0);
    group.add(label);

    group.userData = {
      ...node,
      targetScale: 1,
      hoverScale: 1,
      pulse: 0,
      labelTexture
    };

    this.rootGroup.add(group);
    this.nodes.set(node.id, group);
  }

  createEdge(parentNode, childNode) {
    if (!parentNode || !childNode) return;

    const start = new THREE.Vector3(parentNode.x, parentNode.y, parentNode.z);
    const end = new THREE.Vector3(childNode.x, childNode.y, childNode.z);
    const mid = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2 + 0.8, (start.z + end.z) / 2);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(24);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4a79d8,
      transparent: true,
      opacity: 0.75
    });

    const line = new THREE.Line(geometry, material);
    this.rootGroup.add(line);
    this.edges.push(line);
  }

  createGraph(treeNodes) {
    treeNodes.forEach(node => this.createNodeMesh(node));

    treeNodes.forEach(node => {
      if (node.parentId) {
        const parent = treeNodes.find(n => n.id === node.parentId);
        this.createEdge(parent, node);
      }
    });
  }

  setNodeColor(nodeId, state = 'default') {
    const group = this.nodes.get(nodeId);
    if (!group) return;

    const sphere = group.children[0];
    const label = group.children[1];

    let color = 0x1c2a55;
    let emissive = 0x11224d;
    let labelBg = '#1f366a';

    if (state === 'active') {
      color = 0x1dd6ff;
      emissive = 0x006b80;
      labelBg = '#00576a';
    } else if (state === 'pivot') {
      color = 0xffd24d;
      emissive = 0x8f6c00;
      labelBg = '#7b6200';
    } else if (state === 'compare') {
      color = 0xff8b3d;
      emissive = 0x823600;
      labelBg = '#7a3700';
    } else if (state === 'swap') {
      color = 0x9c5cff;
      emissive = 0x4c2087;
      labelBg = '#542e93';
    } else if (state === 'sorted') {
      color = 0x34d17b;
      emissive = 0x145c34;
      labelBg = '#1d7243';
    }

    sphere.material.color.setHex(color);
    sphere.material.emissive.setHex(emissive);

    const low = group.userData.low;
    const high = group.userData.high;
    const subarray = group.userData.subarray || [];
    if (label.material.map) label.material.map.dispose();
    label.material.map = this.createTextTexture(
      [`[${low}, ${high}]`, `${subarray.join(', ')}`],
      labelBg
    );
    label.material.needsUpdate = true;
  }

  clearNodeStates() {
    this.nodes.forEach((_, nodeId) => this.setNodeColor(nodeId, 'default'));
  }

  focusNode(nodeId) {
    const group = this.nodes.get(nodeId);
    if (!group) return;
    this.selectedNode = nodeId;
    this.camera.position.x = group.position.x;
    this.camera.position.y = group.position.y + 0.5;
    this.camera.position.z = 12;
  }

  applyStep(step, currentArray) {
    if (!this.scene) return;

    this.clearNodeStates();

    if (step.type === 'recursive_call' || step.type === 'base_case') {
      if (step.nodeId) {
        this.setNodeColor(step.nodeId, step.type === 'base_case' ? 'sorted' : 'active');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.targetScale = 1;
      }
    }

    if (step.type === 'choose_pivot') {
      if (step.nodeId) {
        this.setNodeColor(step.nodeId, 'pivot');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.2;
      }
    }

    if (step.type === 'compare') {
      if (step.nodeId) {
        this.setNodeColor(step.nodeId, 'compare');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.1;
      }
    }

    if (step.type === 'swap' || step.type === 'random_swap') {
      if (step.nodeId) {
        this.setNodeColor(step.nodeId, 'swap');
        const group = this.nodes.get(step.nodeId);
        if (group) group.userData.pulse = 1.18;
      }
    }

    if (step.type === 'partition_complete') {
      if (step.nodeId) {
        this.setNodeColor(step.nodeId, 'active');
      }
    }

    if (step.type === 'complete') {
      this.nodes.forEach((_, nodeId) => {
        this.setNodeColor(nodeId, 'sorted');
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
    if (!this.renderer || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = [];
    this.nodes.forEach(group => meshes.push(group.children[0]));
    const intersects = this.raycaster.intersectObjects(meshes);

    if (this.hoveredNode) {
      const oldGroup = this.nodes.get(this.hoveredNode);
      if (oldGroup) oldGroup.userData.hoverScale = 1;
      this.hoveredNode = null;
    }

    if (intersects.length > 0) {
      const nodeId = intersects[0].object.userData.nodeId;
      this.hoveredNode = nodeId;
      const group = this.nodes.get(nodeId);
      if (group) group.userData.hoverScale = 1.1;
    }
  }

  onClick() {
    if (!this.hoveredNode) return;
    this.focusNode(this.hoveredNode);
    const group = this.nodes.get(this.hoveredNode);
    if (group && this.options.onNodeClick) {
      this.options.onNodeClick({
        id: group.userData.id,
        low: group.userData.low,
        high: group.userData.high,
        depth: group.userData.depth,
        subarray: group.userData.subarray
      });
    }
  }

  onWheel(event) {
    if (!this.camera) return;
    this.camera.position.z += event.deltaY * 0.01;
    this.camera.position.z = Math.max(6, Math.min(40, this.camera.position.z));
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.previousMouse.x = event.clientX;
    this.previousMouse.y = event.clientY;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onMouseDrag(event) {
    if (!this.isDragging || !this.rootGroup) return;
    const dx = event.clientX - this.previousMouse.x;
    const dy = event.clientY - this.previousMouse.y;

    this.rotationTarget.y += dx * 0.005;
    this.rotationTarget.x += dy * 0.003;
    this.rotationTarget.x = Math.max(-1.0, Math.min(0.6, this.rotationTarget.x));

    this.previousMouse.x = event.clientX;
    this.previousMouse.y = event.clientY;
  }

  animate() {
    const tick = () => {
      if (!this.scene || !this.camera || !this.renderer) return;

      const delta = this.clock.getDelta();

      if (this.rootGroup) {
        this.rootGroup.rotation.x = THREE.MathUtils.lerp(this.rootGroup.rotation.x, this.rotationTarget.x, 0.08);
        this.rootGroup.rotation.y = THREE.MathUtils.lerp(this.rootGroup.rotation.y, this.rotationTarget.y, 0.08);
      }

      this.nodes.forEach(group => {
        const target = group.userData.targetScale * group.userData.hoverScale * (group.userData.pulse || 1);
        group.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
        group.userData.targetScale = THREE.MathUtils.lerp(group.userData.targetScale, 1, 0.08);
        group.userData.pulse = THREE.MathUtils.lerp(group.userData.pulse, 1, 0.12);
      });

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(tick);
    };

    tick();
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = this.container.clientWidth || 1000;
    const height = this.container.clientHeight || 560;
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

    this.nodes.forEach(group => {
      const labelTexture = group.userData.labelTexture;
      if (labelTexture) labelTexture.dispose?.();
    });

    this.nodes.clear();
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