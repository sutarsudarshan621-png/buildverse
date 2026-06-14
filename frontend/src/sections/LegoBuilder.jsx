import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ==================== CONSTANTS ====================
const GRID_SIZE = 20;
const BLOCK_SIZE = 1;
const FREE_BLOCKS = 10;
const BVT_COST_PER_BLOCK = 5;
const BVT_COST_FOR_LARGE_MODEL = 50;
const BVT_UNLOCK_BRICK = 20;
const BVT_UNLOCK_COLOR = 10;

const FREE_BRICK_TYPES = ["1x1x1", "2x1x1"];
const PREMIUM_BRICK_TYPES = ["2x2x1", "1x2x1"];
const FREE_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24"];
const PREMIUM_COLORS = ["#6c5ce7", "#a29bfe", "#fd79a8", "#fdcb6e"];

// ==================== UTILITY FUNCTIONS ====================
const getBrickDimensions = (type) => {
  const dims = {
    "1x1x1": { width: 1, height: 1, depth: 1 },
    "2x1x1": { width: 2, height: 1, depth: 1 },
    "2x2x1": { width: 2, height: 1, depth: 2 },
    "1x2x1": { width: 1, height: 1, depth: 2 },
  };
  return dims[type] || dims["1x1x1"];
};

const snapToGrid = (value, gridSize = BLOCK_SIZE) => {
  return Math.round(value / gridSize) * gridSize;
};

// Get rotated dimensions based on Y rotation
const getRotatedDimensions = (dims, rotationY) => {
  const normalized =
    ((rotationY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const is90or270 =
    Math.abs(normalized - Math.PI / 2) < 0.1 ||
    Math.abs(normalized - (3 * Math.PI) / 2) < 0.1;

  if (is90or270) {
    return { width: dims.depth, height: dims.height, depth: dims.width };
  }
  return dims;
};

// ==================== BLOCK MANAGER ====================
class BlockManager {
  constructor() {
    this.blocks = new Map();
    this.occupiedSpaces = new Set();
  }

  getSpaceKey(x, y, z) {
    return `${Math.round(x * 10)},${Math.round(y * 10)},${Math.round(z * 10)}`;
  }

  getOccupiedSpaces(position, dims, rotation = 0) {
    const rotatedDims = getRotatedDimensions(dims, rotation);
    const spaces = new Set();

    const halfWidth = rotatedDims.width / 2;
    const halfDepth = rotatedDims.depth / 2;
    const halfHeight = rotatedDims.height / 2;

    for (let x = -halfWidth + 0.5; x < halfWidth; x += 1) {
      for (let z = -halfDepth + 0.5; z < halfDepth; z += 1) {
        for (let y = -halfHeight + 0.5; y < halfHeight; y += 1) {
          const worldX = position.x + x;
          const worldY = position.y + y;
          const worldZ = position.z + z;
          spaces.add(this.getSpaceKey(worldX, worldY, worldZ));
        }
      }
    }

    return spaces;
  }

  canPlaceBlock(position, dims, rotation = 0, excludeId = null) {
    const newSpaces = this.getOccupiedSpaces(position, dims, rotation);

    for (const space of newSpaces) {
      if (this.occupiedSpaces.has(space)) {
        if (excludeId) {
          const block = this.blocks.get(excludeId);
          if (block) {
            const blockSpaces = this.getOccupiedSpaces(
              block.position,
              getBrickDimensions(block.brickType),
              block.rotation,
            );
            if (blockSpaces.has(space)) continue;
          }
        }
        return false;
      }
    }

    const rotatedDims = getRotatedDimensions(dims, rotation);
    const maxX = position.x + rotatedDims.width / 2;
    const minX = position.x - rotatedDims.width / 2;
    const maxZ = position.z + rotatedDims.depth / 2;
    const minZ = position.z - rotatedDims.depth / 2;

    const gridLimit = GRID_SIZE / 2;
    if (
      maxX > gridLimit ||
      minX < -gridLimit ||
      maxZ > gridLimit ||
      minZ < -gridLimit
    ) {
      return false;
    }

    return true;
  }

  addBlock(blockData) {
    const dims = getBrickDimensions(blockData.brickType);
    const spaces = this.getOccupiedSpaces(
      blockData.position,
      dims,
      blockData.rotation,
    );

    this.blocks.set(blockData.id, blockData);
    spaces.forEach((space) => this.occupiedSpaces.add(space));
  }

  removeBlock(id) {
    const block = this.blocks.get(id);
    if (!block) return;

    const dims = getBrickDimensions(block.brickType);
    const spaces = this.getOccupiedSpaces(block.position, dims, block.rotation);

    spaces.forEach((space) => this.occupiedSpaces.delete(space));
    this.blocks.delete(id);
  }

  updateBlockPosition(id, newPosition, newRotation) {
    const block = this.blocks.get(id);
    if (!block) return false;

    const dims = getBrickDimensions(block.brickType);
    const oldSpaces = this.getOccupiedSpaces(
      block.position,
      dims,
      block.rotation,
    );
    oldSpaces.forEach((space) => this.occupiedSpaces.delete(space));

    if (!this.canPlaceBlock(newPosition, dims, newRotation, id)) {
      oldSpaces.forEach((space) => this.occupiedSpaces.add(space));
      return false;
    }

    block.position = newPosition;
    block.rotation = newRotation;
    const newSpaces = this.getOccupiedSpaces(newPosition, dims, newRotation);
    newSpaces.forEach((space) => this.occupiedSpaces.add(space));

    return true;
  }

  getBlocksBelow(position, dims, rotation = 0) {
    const rotatedDims = getRotatedDimensions(dims, rotation);
    const testY = position.y - dims.height;

    for (const [id, block] of this.blocks) {
      const blockDims = getBrickDimensions(block.brickType);
      const blockRotatedDims = getRotatedDimensions(blockDims, block.rotation);
      const blockTop = block.position.y + blockDims.height / 2;

      if (Math.abs(blockTop - testY) < 0.1) {
        const rotatedWidth = rotatedDims.width / 2;
        const rotatedDepth = rotatedDims.depth / 2;
        const blockWidth = blockRotatedDims.width / 2;
        const blockDepth = blockRotatedDims.depth / 2;

        const overlapX =
          Math.abs(position.x - block.position.x) < rotatedWidth + blockWidth;
        const overlapZ =
          Math.abs(position.z - block.position.z) < rotatedDepth + blockDepth;

        if (overlapX && overlapZ) {
          return block;
        }
      }
    }

    return null;
  }

  clear() {
    this.blocks.clear();
    this.occupiedSpaces.clear();
  }

  getAllBlocks() {
    return Array.from(this.blocks.values());
  }
}

// ==================== HISTORY MANAGER ====================
class HistoryManager {
  constructor(maxSize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  push(state) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(state)));

    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

// ==================== ORBIT CONTROLS ====================
class SimpleOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;
    this.rotateSpeed = 0.5;
    this.zoomSpeed = 1;

    const radius = Math.sqrt(
      camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2,
    );

    this.spherical = {
      radius,
      theta: Math.atan2(camera.position.x, camera.position.z),
      phi: Math.acos(camera.position.y / radius),
    };

    this.target = new THREE.Vector3(0, 0, 0);
    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);

    domElement.addEventListener("mousedown", this.onMouseDown);
    domElement.addEventListener("mousemove", this.onMouseMove);
    domElement.addEventListener("mouseup", this.onMouseUp);
    domElement.addEventListener("wheel", this.onWheel);
  }

  onMouseDown(e) {
    if (e.button === 2) {
      this.isDragging = true;
      this.previousMouse = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }

  onMouseMove(e) {
    if (!this.enabled || !this.isDragging || e.buttons !== 2) return;

    const deltaX = e.clientX - this.previousMouse.x;
    const deltaY = e.clientY - this.previousMouse.y;

    this.spherical.theta -= deltaX * 0.01 * this.rotateSpeed;
    this.spherical.phi -= deltaY * 0.01 * this.rotateSpeed;

    this.spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, this.spherical.phi),
    );

    this.previousMouse = { x: e.clientX, y: e.clientY };
    this.update();
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.spherical.radius += e.deltaY * 0.01 * this.zoomSpeed;
    this.spherical.radius = Math.max(5, Math.min(50, this.spherical.radius));
    this.update();
  }

  update() {
    const sinPhiRadius = Math.sin(this.spherical.phi) * this.spherical.radius;

    this.camera.position.x = sinPhiRadius * Math.sin(this.spherical.theta);
    this.camera.position.y =
      Math.cos(this.spherical.phi) * this.spherical.radius;
    this.camera.position.z = sinPhiRadius * Math.cos(this.spherical.theta);

    this.camera.lookAt(this.target);
  }

  dispose() {
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.domElement.removeEventListener("mouseup", this.onMouseUp);
    this.domElement.removeEventListener("wheel", this.onWheel);
  }
}

// ==================== GEOMETRY CACHE ====================
class GeometryCache {
  constructor() {
    this.geometries = new Map();
  }

  getKey(width, height, depth) {
    return `${width}_${height}_${depth}`;
  }

  get(width, height, depth) {
    const key = this.getKey(width, height, depth);
    if (!this.geometries.has(key)) {
      this.geometries.set(key, new THREE.BoxGeometry(width, height, depth));
    }
    return this.geometries.get(key);
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries.clear();
  }
}

// ==================== MAIN COMPONENT ====================
const LegoBuilder = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const ghostCubeRef = useRef(null);
  const orbitControlsRef = useRef(null);
  const dragPlaneRef = useRef(null);
  const selectedBlockRef = useRef(null);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const blockManagerRef = useRef(new BlockManager());
  const historyManagerRef = useRef(new HistoryManager());
  const geometryCacheRef = useRef(new GeometryCache());

  const [blockDataList, setBlockDataList] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#ff6b6b");
  const [selectedBrickType, setSelectedBrickType] = useState("1x1x1");
  const [stats, setStats] = useState({ blockCount: 0 });
  const [editMode, setEditMode] = useState("place");
  const [isDragging, setIsDragging] = useState(false);

  const currentColorRef = useRef(selectedColor);
  const currentBrickTypeRef = useRef(selectedBrickType);
  const currentEditModeRef = useRef(editMode);

  const [freeBlocksLeft, setFreeBlocksLeft] = useState(() => {
    const saved = localStorage.getItem("freeBlocksLeft");
    return saved !== null ? parseInt(saved, 10) : FREE_BLOCKS;
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [unlockedBricks] = useState([
    ...FREE_BRICK_TYPES,
    ...PREMIUM_BRICK_TYPES,
  ]);

  const [unlockedColors] = useState([...FREE_COLORS, ...PREMIUM_COLORS]);

  useEffect(() => {
    localStorage.setItem("freeBlocksLeft", freeBlocksLeft.toString());
  }, [freeBlocksLeft]);

  useEffect(() => {
    localStorage.setItem("unlockedBricks", JSON.stringify(unlockedBricks));
  }, [unlockedBricks]);

  useEffect(() => {
    localStorage.setItem("unlockedColors", JSON.stringify(unlockedColors));
  }, [unlockedColors]);

  useEffect(() => {
    currentColorRef.current = selectedColor;
  }, [selectedColor]);

  useEffect(() => {
    currentBrickTypeRef.current = selectedBrickType;
  }, [selectedBrickType]);

  useEffect(() => {
    currentEditModeRef.current = editMode;
  }, [editMode]);

  const createBrickMesh = (brickType, color) => {
    const dims = getBrickDimensions(brickType);
    const group = new THREE.Group();

    const bodyGeometry = geometryCacheRef.current.get(
      dims.width,
      dims.height,
      dims.depth,
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const studRadius = 0.15;
    const studHeight = 0.15;
    const studGeometry = new THREE.CylinderGeometry(
      studRadius,
      studRadius,
      studHeight,
      16,
    );
    const studMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.2,
    });

    const studsX = Math.floor(dims.width);
    const studsZ = Math.floor(dims.depth);

    for (let x = 0; x < studsX; x++) {
      for (let z = 0; z < studsZ; z++) {
        const stud = new THREE.Mesh(studGeometry, studMaterial);
        const offsetX = (x - (studsX - 1) / 2) * 0.8;
        const offsetZ = (z - (studsZ - 1) / 2) * 0.8;
        stud.position.set(offsetX, dims.height / 2 + studHeight / 2, offsetZ);
        stud.castShadow = true;
        group.add(stud);
      }
    }

    return group;
  };

  const highlightBlock = (block, isHighlighted) => {
    if (!block) return;

    block.traverse((child) => {
      if (child.material) {
        if (isHighlighted) {
          child.material.emissive = new THREE.Color(0x444444);
          child.material.emissiveIntensity = 0.3;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  };

  const findBlockGroup = (object) => {
    let current = object;
    while (current) {
      if (current.userData.isBlock) {
        return current;
      }
      current = current.parent;
    }
    return null;
  };

  const saveToHistory = () => {
    const state = blockDataList.map((b) => ({
      id: b.id,
      position: { ...b.position },
      color: b.color,
      brickType: b.brickType,
      rotation: b.rotation,
    }));

    historyManagerRef.current.push(state);
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  };

  const restoreState = (state) => {
    if (!state) return;

    blockDataList.forEach((block) => {
      const mesh = sceneRef.current.getObjectByProperty("userData", {
        id: block.id,
        isBlock: true,
      });
      if (mesh) {
        sceneRef.current.remove(mesh);
        mesh.traverse((child) => {
          if (child.material) child.material.dispose();
        });
      }
    });

    blockManagerRef.current.clear();

    const newBlockDataList = state.map((blockData) => {
      const mesh = createBrickMesh(blockData.brickType, blockData.color);
      mesh.position.set(
        blockData.position.x,
        blockData.position.y,
        blockData.position.z,
      );
      mesh.rotation.y = blockData.rotation || 0;
      mesh.userData.isBlock = true;
      mesh.userData.id = blockData.id;

      sceneRef.current.add(mesh);
      blockManagerRef.current.addBlock({
        id: blockData.id,
        position: blockData.position,
        brickType: blockData.brickType,
        rotation: blockData.rotation || 0,
      });

      return {
        ...blockData,
        meshId: blockData.id,
      };
    });

    setBlockDataList(newBlockDataList);
    setStats({ blockCount: newBlockDataList.length });
  };

  const handleUndo = () => {
    const state = historyManagerRef.current.undo();
    if (state) {
      restoreState(state);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
    }
  };

  const handleRedo = () => {
    const state = historyManagerRef.current.redo();
    if (state) {
      restoreState(state);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
    }
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new SimpleOrbitControls(camera, renderer.domElement);
    orbitControlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(
      GRID_SIZE,
      GRID_SIZE,
      0x444444,
      0x888888,
    );
    scene.add(gridHelper);

    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const groundMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.name = "ground";
    scene.add(ground);

    const dragPlaneGeometry = new THREE.PlaneGeometry(100, 100);
    const dragPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const dragPlane = new THREE.Mesh(dragPlaneGeometry, dragPlaneMaterial);
    dragPlane.rotation.x = -Math.PI / 2;
    dragPlane.name = "dragPlane";
    scene.add(dragPlane);
    dragPlaneRef.current = dragPlane;

    const dims = getBrickDimensions(selectedBrickType);
    const ghostGeometry = geometryCacheRef.current.get(
      dims.width,
      dims.height,
      dims.depth,
    );
    const ghostMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
    });
    const ghostCube = new THREE.Mesh(ghostGeometry, ghostMaterial);
    ghostCube.visible = false;
    scene.add(ghostCube);
    ghostCubeRef.current = ghostCube;

    const onMouseDown = (event) => {
      if (event.button === 2) {
        event.preventDefault();
      }

      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      if (event.button === 2 && currentEditModeRef.current === "edit") {
        const blockObjects = sceneRef.current.children.filter(
          (obj) => obj.userData.isBlock,
        );
        const intersects = raycasterRef.current.intersectObjects(
          blockObjects,
          true,
        );

        if (intersects.length > 0) {
          const selectedObj = findBlockGroup(intersects[0].object);

          if (selectedObj) {
            const newRotation = selectedObj.rotation.y + Math.PI / 2;
            const dims = getBrickDimensions(selectedObj.userData.brickType);

            const canRotate = blockManagerRef.current.canPlaceBlock(
              selectedObj.position,
              dims,
              newRotation,
              selectedObj.userData.id,
            );

            if (canRotate) {
              selectedObj.rotation.y = newRotation;

              blockManagerRef.current.updateBlockPosition(
                selectedObj.userData.id,
                selectedObj.position,
                newRotation,
              );

              setBlockDataList((prev) =>
                prev.map((b) =>
                  b.meshId === selectedObj.userData.id
                    ? { ...b, rotation: newRotation }
                    : b,
                ),
              );

              saveToHistory();

              highlightBlock(selectedObj, true);
              setTimeout(() => highlightBlock(selectedObj, false), 200);
            } else {
              const originalColor =
                selectedObj.children[0].material.color.getHex();
              selectedObj.children[0].material.color.setHex(0xff0000);
              setTimeout(() => {
                selectedObj.children[0].material.color.setHex(originalColor);
              }, 150);
            }
          }

          return;
        }
      }

      if (event.button === 0 && currentEditModeRef.current === "edit") {
        const blockObjects = sceneRef.current.children.filter(
          (obj) => obj.userData.isBlock,
        );
        const intersects = raycasterRef.current.intersectObjects(
          blockObjects,
          true,
        );

        if (intersects.length > 0) {
          const selectedObj = findBlockGroup(intersects[0].object);

          if (selectedObj) {
            selectedBlockRef.current = selectedObj;
            setIsDragging(true);

            orbitControlsRef.current.enabled = false;

            const intersectPoint = intersects[0].point;
            dragOffsetRef.current
              .copy(selectedObj.position)
              .sub(intersectPoint);

            highlightBlock(selectedObj, true);

            dragPlaneRef.current.position.y = selectedObj.position.y;
          }
        }
      }
    };

    const onMouseMove = (event) => {
      if (event.buttons === 2) {
        if (ghostCubeRef.current) ghostCubeRef.current.visible = false;
        return;
      }

      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      if (
        currentEditModeRef.current === "edit" &&
        isDragging &&
        selectedBlockRef.current
      ) {
        const intersects = raycasterRef.current.intersectObject(
          dragPlaneRef.current,
        );

        if (intersects.length > 0) {
          const point = intersects[0].point;

          const newX = snapToGrid(point.x + dragOffsetRef.current.x);
          const newZ = snapToGrid(point.z + dragOffsetRef.current.z);

          const dims = getBrickDimensions(
            selectedBlockRef.current.userData.brickType,
          );
          const blockBelow = blockManagerRef.current.getBlocksBelow(
            { x: newX, y: selectedBlockRef.current.position.y, z: newZ },
            dims,
            selectedBlockRef.current.rotation.y,
          );

          let newY;
          if (blockBelow) {
            const belowDims = getBrickDimensions(blockBelow.brickType);
            newY =
              blockBelow.position.y + belowDims.height / 2 + dims.height / 2;
          } else {
            newY = dims.height / 2;
          }

          const newPosition = { x: newX, y: newY, z: newZ };

          const canMove = blockManagerRef.current.canPlaceBlock(
            newPosition,
            dims,
            selectedBlockRef.current.rotation.y,
            selectedBlockRef.current.userData.id,
          );

          if (canMove) {
            selectedBlockRef.current.position.set(newX, newY, newZ);
            dragPlaneRef.current.position.y = newY;
          }
        }
        return;
      }

      if (currentEditModeRef.current === "place") {
        const allObjects = [
          sceneRef.current.getObjectByName("ground"),
          ...sceneRef.current.children.filter((obj) => obj.userData.isBlock),
        ].filter(Boolean);

        const intersects = raycasterRef.current.intersectObjects(
          allObjects,
          true,
        );

        if (intersects.length > 0) {
          const intersect = intersects[0];
          const dims = getBrickDimensions(currentBrickTypeRef.current);

          let x, y, z;

          const hitBlock = findBlockGroup(intersect.object);

          if (hitBlock && hitBlock.userData.isBlock) {
            const blockDims = getBrickDimensions(hitBlock.userData.brickType);

            x = snapToGrid(intersect.point.x);
            y = hitBlock.position.y + blockDims.height / 2 + dims.height / 2;
            z = snapToGrid(intersect.point.z);
          } else {
            x = snapToGrid(intersect.point.x);
            y = dims.height / 2;
            z = snapToGrid(intersect.point.z);
          }

          const ghost = ghostCubeRef.current;

          const currentDims = getBrickDimensions(currentBrickTypeRef.current);
          if (
            ghost.geometry !==
            geometryCacheRef.current.get(
              currentDims.width,
              currentDims.height,
              currentDims.depth,
            )
          ) {
            ghost.geometry = geometryCacheRef.current.get(
              currentDims.width,
              currentDims.height,
              currentDims.depth,
            );
          }

          ghost.position.set(x, y, z);
          ghost.material.color.setStyle(currentColorRef.current);

          const canPlace = blockManagerRef.current.canPlaceBlock(
            { x, y, z },
            currentDims,
            0,
          );

          ghost.material.opacity = canPlace ? 0.3 : 0.15;
          ghost.material.color.setStyle(
            canPlace ? currentColorRef.current : "#ff0000",
          );
          ghost.visible = true;
        } else {
          ghostCubeRef.current.visible = false;
        }
      }
    };

    const onMouseUp = async (event) => {
      if (event.button !== 0) return;

      if (
        currentEditModeRef.current === "edit" &&
        isDragging &&
        selectedBlockRef.current
      ) {
        highlightBlock(selectedBlockRef.current, false);

        const success = blockManagerRef.current.updateBlockPosition(
          selectedBlockRef.current.userData.id,
          selectedBlockRef.current.position,
          selectedBlockRef.current.rotation.y,
        );

        if (success) {
          setBlockDataList((prev) =>
            prev.map((b) =>
              b.meshId === selectedBlockRef.current.userData.id
                ? {
                    ...b,
                    position: {
                      x: selectedBlockRef.current.position.x,
                      y: selectedBlockRef.current.position.y,
                      z: selectedBlockRef.current.position.z,
                    },
                  }
                : b,
            ),
          );

          saveToHistory();
        }

        selectedBlockRef.current = null;
        setIsDragging(false);
        orbitControlsRef.current.enabled = true;
        return;
      }

      if (currentEditModeRef.current === "place" && event.button === 0) {
        const ghost = ghostCubeRef.current;
        if (!ghost.visible) return;

        const dims = getBrickDimensions(currentBrickTypeRef.current);
        const position = {
          x: ghost.position.x,
          y: ghost.position.y,
          z: ghost.position.z,
        };

        if (!blockManagerRef.current.canPlaceBlock(position, dims, 0)) {
          ghost.material.color.setHex(0xff0000);
          setTimeout(() => {
            ghost.material.color.setStyle(currentColorRef.current);
          }, 200);
          return;
        }

        try {
          setFreeBlocksLeft((prev) => Math.max(0, prev - 1));
          const brickMesh = createBrickMesh(
            currentBrickTypeRef.current,
            currentColorRef.current,
          );
          brickMesh.position.copy(ghost.position);
          brickMesh.userData.isBlock = true;
          brickMesh.userData.color = currentColorRef.current;
          brickMesh.userData.brickType = currentBrickTypeRef.current;
          brickMesh.userData.id = Date.now() + Math.random();

          sceneRef.current.add(brickMesh);

          const blockData = {
            id: brickMesh.userData.id,
            meshId: brickMesh.userData.id,
            position: {
              x: ghost.position.x,
              y: ghost.position.y,
              z: ghost.position.z,
            },
            color: currentColorRef.current,
            brickType: currentBrickTypeRef.current,
            rotation: 0,
          };

          blockManagerRef.current.addBlock(blockData);

          setBlockDataList((prev) => [...prev, blockData]);
          setStats((prev) => ({ ...prev, blockCount: prev.blockCount + 1 }));

          saveToHistory();
        } catch (err) {
          console.error("Error placing block:", err);
          alert("❌ Failed to place block");
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault(),
    );

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      controls.dispose();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      geometryCacheRef.current.dispose();

      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (ghostCubeRef.current) {
      const dims = getBrickDimensions(selectedBrickType);
      ghostCubeRef.current.geometry = geometryCacheRef.current.get(
        dims.width,
        dims.height,
        dims.depth,
      );
      ghostCubeRef.current.material.color.setStyle(selectedColor);
    }
  }, [selectedColor, selectedBrickType]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedBlockRef.current) {
          const blockToDelete = selectedBlockRef.current;
          const blockId = blockToDelete.userData.id;

          sceneRef.current.remove(blockToDelete);
          blockToDelete.traverse((child) => {
            if (child.material) child.material.dispose();
          });

          blockManagerRef.current.removeBlock(blockId);
          setBlockDataList((prev) => prev.filter((b) => b.meshId !== blockId));
          setStats((prev) => ({ ...prev, blockCount: prev.blockCount - 1 }));

          selectedBlockRef.current = null;
          setIsDragging(false);

          saveToHistory();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo]);

  const clearAll = () => {
    blockDataList.forEach((block) => {
      const mesh = sceneRef.current.children.find(
        (obj) => obj.userData.isBlock && obj.userData.id === block.meshId,
      );
      if (mesh) {
        sceneRef.current.remove(mesh);
        mesh.traverse((child) => {
          if (child.material) child.material.dispose();
        });
      }
    });

    blockManagerRef.current.clear();
    setBlockDataList([]);
    setStats({ blockCount: 0 });
    historyManagerRef.current.clear();
    setCanUndo(false);
    setCanRedo(false);
  };

  const takeScreenshot = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
      return null;

    return new Promise((resolve) => {
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      setTimeout(() => {
        rendererRef.current.domElement.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/png",
          1.0,
        );
      }, 100);
    });
  };

  const exportScene = async () => {
    const modelName = prompt("Enter model name");
    if (!modelName) return;

    const sceneData = blockDataList.map((b) => ({
      position: b.position,
      color: b.color,
      brickType: b.brickType,
      rotation: b.rotation || 0,
    }));

    const imageBlob = await takeScreenshot();

    if (!imageBlob) {
      alert("Failed to capture image");
      return;
    }

    const formData = new FormData();
    formData.append("name", modelName);
    formData.append("scene", JSON.stringify(sceneData));
    formData.append("image", imageBlob, "model.png");

    const data = {
      name: modelName,
      scene: sceneData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${modelName}.json`;
    a.click();

    URL.revokeObjectURL(url);

    alert("✅ Model exported locally");
  };

  const panelStyle = {
    position: "absolute",
    top: 20,
    left: 20,
    width: "280px",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "black",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const colors = [...FREE_COLORS, ...PREMIUM_COLORS];
  const brickTypes = [...FREE_BRICK_TYPES, ...PREMIUM_BRICK_TYPES];

  return (
    <div
      style={{ width: "100vw", height: "100vh", margin: 0, overflow: "hidden" }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <div style={panelStyle}>
        <h2
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🧱 LEGO Builder
        </h2>

        <div
          style={{
            marginBottom: "14px",
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div>
            <strong>Free Blocks:</strong> {freeBlocksLeft}
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Mode:
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setEditMode("place")}
              style={{
                flex: 1,
                padding: "10px",
                border:
                  editMode === "place" ? "3px solid #4CAF50" : "2px solid #ddd",
                borderRadius: "6px",
                background: editMode === "place" ? "#e8f5e9" : "white",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: editMode === "place" ? "bold" : "normal",
                transition: "all 0.2s",
              }}
            >
              🎨 Place
            </button>
            <button
              onClick={() => setEditMode("edit")}
              style={{
                flex: 1,
                padding: "10px",
                border:
                  editMode === "edit" ? "3px solid #2196F3" : "2px solid #ddd",
                borderRadius: "6px",
                background: editMode === "edit" ? "#e3f2fd" : "white",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: editMode === "edit" ? "bold" : "normal",
                transition: "all 0.2s",
              }}
            >
              ✋ Edit
            </button>
          </div>
        </div>

        {editMode === "place" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, opacity: 0.8 }}>Brick Type</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {brickTypes.map((type) => {
                  const unlocked = unlockedBricks.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        unlocked
                          ? setSelectedBrickType(type)
                          : unlockBrickType(type)
                      }
                      disabled={false}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        background: unlocked
                          ? selectedBrickType === type
                            ? "#4caf50"
                            : "rgba(255,255,255,0.25)"
                          : "rgba(0,0,0,0.4)",
                        color: unlocked ? "#fff" : "#999",
                        cursor: "pointer",
                        position: "relative",
                        border: "none",
                      }}
                    >
                      {type}
                      {!unlocked && (
                        <span style={{ position: "absolute", right: 8 }}>
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, opacity: 0.8 }}>Color</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                {colors.map((color) => {
                  const unlocked = unlockedColors.includes(color);
                  return (
                    <div
                      key={color}
                      onClick={() =>
                        
                        (unlocked
                          ? setSelectedColor(color)
                          : unlockColor(color))
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: unlocked ? color : "#999",
                        cursor: "pointer",
                        position: "relative",
                        opacity: unlocked ? 1 : 0.4,
                        boxShadow:
                          selectedColor === color && unlocked
                            ? "0 0 0 3px #fff"
                            : "none",
                      }}
                    >
                      {!unlocked && (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          🔒
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div
          style={{
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "15px",
            fontSize: "13px",
          }}
        >
          <div>
            <strong>Blocks Placed:</strong> {stats.blockCount}
          </div>
          {isDragging && (
            <div style={{ color: "#2196F3", marginTop: "4px" }}>
              🖐️ Dragging...
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              style={{
                flex: 1,
                padding: "8px",
                background: canUndo ? "#9c27b0" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: canUndo ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              ↶ Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              style={{
                flex: 1,
                padding: "8px",
                background: canRedo ? "#9c27b0" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: canRedo ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              ↷ Redo
            </button>
          </div>

          <button
            onClick={clearAll}
            style={{
              padding: "10px",
              background: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Clear All
          </button>

          <button
            onClick={async () => {
              const blob = await takeScreenshot();
              if (blob) {
                const url = URL.createObjectURL(blob);
                setPreviewImage(url);
              }
            }}
            style={{
              padding: "10px",
              background: "#6c5ce7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            📸 Take Screenshot
          </button>

          {previewImage && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setPreviewImage(null)}
            >
              <img
                src={previewImage}
                alt="Model Preview"
                style={{
                  maxWidth: "80%",
                  maxHeight: "80%",
                  borderRadius: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          <button
            onClick={exportScene}
            disabled={false}
            style={{
              padding: "10px",
              background: "#4ecdc4",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Export Scene
          </button>

          <button
            style={{
              padding: "10px",
              background: "#f9ca24",
              color: "black",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
            onClick={() => window.history.back()}
          >
            ⬅ BACK
          </button>
        </div>

        <div
          style={{
            marginTop: "15px",
            fontSize: "12px",
            color: "#666",
            borderTop: "1px solid #ddd",
            paddingTop: "12px",
          }}
        >
          <strong>Controls:</strong>
          <br />
          {editMode === "place" ? (
            <>
              • Left Click: Place block
              <br />
              • Right Click + Drag: Rotate camera
              <br />
              • Scroll: Zoom
              <br />• Ctrl+Z: Undo | Ctrl+Y: Redo
            </>
          ) : (
            <>
              • Left Click + Drag: Move block
              <br />
              • Right Click on Block: Rotate 90°
              <br />
              • Right Click + Drag: Rotate camera
              <br />
              • Delete/Backspace: Delete selected
              <br />
              • Scroll: Zoom
              <br />• Ctrl+Z: Undo | Ctrl+Y: Redo
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegoBuilder;
