import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const initThreeScene = (mountElement) => {
  if (!mountElement) {
    console.error('mountElement is null!');
    return null;
  }

  // Clean up existing scene
  if (mountElement.children.length > 0) {
    mountElement.children[0]?.remove();
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    75,
    mountElement.clientWidth / mountElement.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 4, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
  renderer.shadowMap.enabled = true;
  mountElement.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Ground plane
  const groundGeom = new THREE.PlaneGeometry(15, 15);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x90ee90 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid and axes helpers
  const gridHelper = new THREE.GridHelper(15, 15);
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;

  return {
    scene,
    camera,
    renderer,
    controls,
    ambientLight,
    directionalLight,
  };
};

export const setupAnimation = (renderer, scene, camera, controls) => {
  let animationId = null;

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
};

export const disposeThreeScene = (renderer, mountElement) => {
  if (renderer && mountElement && renderer.domElement && renderer.domElement.parentNode === mountElement) {
    renderer.domElement?.remove();
    renderer.dispose();
  }
};

export const centerAndPositionModel = (model, camera) => {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  model.position.sub(center);
  model.position.y = 0;

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;
  let cameraZ = maxDim / (2 * Math.tan(fov / 2));
  cameraZ *= 2.5;

  camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
  camera.lookAt(0, 0, 0);

  return size;
};
