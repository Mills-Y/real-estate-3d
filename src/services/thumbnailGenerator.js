/**
 * Thumbnail Generator Service
 * Generates thumbnail images from 3D models using Three.js
 * Supports GLB, GLTF, PLY, and OBJ formats
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const thumbnailCache = new Map();

/**
 * Generate a thumbnail image from a 3D model file
 * Returns a data URL of the rendered thumbnail or null if generation fails
 */
export const generateModelThumbnail = async (modelPath, modelTitle = 'Model') => {
  // Check cache first
  if (thumbnailCache.has(modelPath)) {
    return thumbnailCache.get(modelPath);
  }

  try {
    return new Promise((resolve) => {
      // Create a Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1f2937);

      // Create camera for square aspect ratio
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.set(0, 1.5, 4);

      // Create renderer
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 280;
      
      const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true
      });
      renderer.setSize(280, 280);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(8, 12, 8);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.far = 50;
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(-8, 5, 8);
      scene.add(pointLight);

      // Load the model based on file type
      const fileExtension = modelPath.split('.').pop().toLowerCase();
      let loader;
      let loadPromise;

      if (fileExtension === 'ply') {
        loader = new PLYLoader();
        loadPromise = new Promise((resolveLoad, rejectLoad) => {
          loader.load(
            modelPath,
            (geometry) => {
              const material = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                side: THREE.DoubleSide
              });
              const model = new THREE.Mesh(geometry, material);
              resolveLoad(model);
            },
            undefined,
            rejectLoad
          );
        });
      } else if (fileExtension === 'obj') {
        loader = new OBJLoader();
        loadPromise = new Promise((resolveLoad, rejectLoad) => {
          loader.load(modelPath, resolveLoad, undefined, rejectLoad);
        });
      } else {
        // Default to GLTF for GLB, GLTF, and other formats
        loader = new GLTFLoader();
        loadPromise = new Promise((resolveLoad, rejectLoad) => {
          loader.load(
            modelPath,
            (gltf) => resolveLoad(gltf.scene),
            undefined,
            rejectLoad
          );
        });
      }
            
      const timeout = setTimeout(() => {
        // Timeout - render what we have
        try {
          renderer.render(scene, camera);
          const imageData = canvas.toDataURL('image/png');
          thumbnailCache.set(modelPath, imageData);
          renderer.dispose();
          resolve(imageData);
        } catch (err) {
          console.error('Thumbnail render timeout:', err);
          resolve(null);
        }
      }, 3000);

      loadPromise
        .then((model) => {
          clearTimeout(timeout);
          try {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim;
            
            model.scale.multiplyScalar(scale);
            
            // Center the model
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * scale;
            model.position.y = -center.y * scale;
            model.position.z = -center.z * scale;

            // Enable shadows
            model.traverse(child => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            scene.add(model);

            // Render and get image
            renderer.render(scene, camera);
            const imageData = canvas.toDataURL('image/png');
            
            // Cache the result
            thumbnailCache.set(modelPath, imageData);
            
            // Cleanup
            renderer.dispose();
            canvas.remove();
            
            resolve(imageData);
          } catch (err) {
            console.error('Error processing loaded model:', err);
            resolve(null);
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Error loading model for thumbnail:', error);
          resolve(null);
        });
    });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};

/**
 * Get placeholder thumbnail as data URL
 */
export const getPlaceholderThumbnail = (modelName = '3D Model') => {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 280, 280);
  gradient.addColorStop(0, '#374151');
  gradient.addColorStop(1, '#1f2937');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 280, 280);

  // Draw placeholder icon
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📦', 140, 100);

  // Draw text
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(modelName || '3D Model', 140, 200);

  return canvas.toDataURL('image/png');
};
