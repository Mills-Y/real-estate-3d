import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { optimizeModel, validateModel, normalizeModel, getModelMetrics } from './modelNormalizer';
import { autoResizeGridForModel } from './gridManager';
import { 
  checkGltfDependencies, 
  extractRequiredResources, 
  embedGltfResourcesFromUrl 
} from './gltfConverter';

export const createSimple3DModel = (type = 'house') => {
  const group = new THREE.Group();

  if (type === 'scanned') {
    // Point cloud style for scanned properties
    const numPoints = 1000;
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.5;
      const height = Math.random() * 3;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;

      colors[i3] = 0.7 + Math.random() * 0.3;
      colors[i3 + 1] = 0.6 + Math.random() * 0.2;
      colors[i3 + 2] = 0.5 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // Add mesh approximation
    const meshGeom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const meshMat = new THREE.MeshPhongMaterial({
      color: 0x88aa88,
      transparent: true,
      opacity: 0.4,
    });
    const mesh = new THREE.Mesh(meshGeom, meshMat);
    mesh.position.y = 1.25;
    group.add(mesh);

    const roofGeom = new THREE.ConeGeometry(2, 1.2, 4);
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x994444 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 3;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  } else {
    // Standard house model
    const bodyGeom = new THREE.BoxGeometry(3, 2.5, 3);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xe8d4a8 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.25;
    body.castShadow = true;
    group.add(body);

    const roofGeom = new THREE.ConeGeometry(2.5, 1.5, 4);
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 3;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    const doorGeom = new THREE.BoxGeometry(0.6, 1.2, 0.1);
    const doorMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 0.6, 1.55);
    group.add(door);
  }

  return group;
};

export const loadPLYModel = (url, scene, camera) => {
  return new Promise((resolve, reject) => {
    const plyLoader = new PLYLoader();

    plyLoader.load(
      url,
      (geometry) => {
        console.log('✅ PLY model loaded successfully');
        console.log('Has colors:', geometry.attributes.color ? 'Yes' : 'No');
        console.log('Vertex count:', geometry.attributes.position.count);

        const hasGaussianAttribs =
          geometry.attributes.opacity ||
          geometry.attributes.scale_0 ||
          geometry.attributes.f_dc_0;

        if (hasGaussianAttribs) {
          console.warn('⚠️ This appears to be a 3D Gaussian Splatting file.');
        }

        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        const pointSize = hasGaussianAttribs ? maxDim / 500 : maxDim / 200;

        const material = new THREE.PointsMaterial({
          size: pointSize,
          vertexColors: !!geometry.attributes.color,
          color: geometry.attributes.color ? undefined : 0xaaaaaa,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.8,
        });

        const pointCloud = new THREE.Points(geometry, material);

        // Apply model normalization
        const normResult = normalizeModel(pointCloud);
        console.log('📊 PLY Model Normalization:', {
          scale: normResult.scale,
          normalized: normResult.normalized,
          originalSize: normResult.originalSize,
          newSize: normResult.newSize,
        });

        scene.add(pointCloud);

        const boxHelper = new THREE.BoxHelper(pointCloud, 0xffff00);
        scene.add(boxHelper);

        // Get normalized metrics
        const metrics = getModelMetrics(pointCloud);
        const normalizedMaxDim = metrics.maxDim;

        // Auto-resize grid if model is too large
        const gridResizeResult = autoResizeGridForModel(scene, metrics);
        if (gridResizeResult.resized) {
          console.log(
            `📐 Grid auto-resized from ${gridResizeResult.previousSize}x${gridResizeResult.previousSize} ` +
            `to ${gridResizeResult.newSize}x${gridResizeResult.newSize} for PLY model (${gridResizeResult.modelMaxDim.toFixed(2)} units)`
          );
        }

        const fov = (camera.fov * Math.PI) / 180;
        let cameraZ = normalizedMaxDim / (2 * Math.tan(fov / 2));
        cameraZ *= 2.5;

        camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
        camera.lookAt(0, 0, 0);

        resolve({ 
          model: pointCloud, 
          size, 
          maxDim: normalizedMaxDim,
          normalization: normResult,
          gridResized: gridResizeResult.resized,
        });
      },
      undefined,
      (error) => {
        console.error('Error loading PLY model:', error);
        reject(error);
      }
    );
  });
};

export const loadGLTFModel = (url, scene, camera) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    const onSuccess = (gltf) => {
      console.log('✅ 3D model loaded successfully');
      const model = gltf.scene;

      let hasMaterials = false;

      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;

          if (obj.material) {
            hasMaterials = true;
            obj.material.needsUpdate = true;

            if (!obj.material.color || obj.material.opacity === 0) {
              obj.material = new THREE.MeshPhongMaterial({
                color: 0x888888,
                side: THREE.DoubleSide,
              });
            }
          } else {
            obj.material = new THREE.MeshPhongMaterial({
              color: 0x888888,
              side: THREE.DoubleSide,
            });
          }
        }
      });

      console.log('Has materials:', hasMaterials);

      // Validate model before normalization
      const validation = validateModel(model);
      console.log('📋 Model Validation:', {
        isValid: validation.isValid,
        warnings: validation.warnings,
        errors: validation.errors,
      });

      // Apply model normalization
      const normResult = normalizeModel(model);
      console.log('📊 GLTF Model Normalization:', {
        scale: normResult.scale,
        normalized: normResult.normalized,
        originalSize: normResult.originalSize,
        newSize: normResult.newSize,
      });

      scene.add(model);

      const boxHelper = new THREE.BoxHelper(model, 0xffff00);
      scene.add(boxHelper);

      // Get normalized metrics
      const metrics = getModelMetrics(model);
      const normalizedMaxDim = metrics.maxDim;

      // Auto-resize grid if model is too large
      const gridResizeResult = autoResizeGridForModel(scene, metrics);
      if (gridResizeResult.resized) {
        console.log(
          `📐 Grid auto-resized from ${gridResizeResult.previousSize}x${gridResizeResult.previousSize} ` +
          `to ${gridResizeResult.newSize}x${gridResizeResult.newSize} for GLTF model (${gridResizeResult.modelMaxDim.toFixed(2)} units)`
        );
      }

      const fov = (camera.fov * Math.PI) / 180;
      let cameraZ = normalizedMaxDim / (2 * Math.tan(fov / 2));
      cameraZ *= 2.5;

      camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
      camera.lookAt(0, 0, 0);

      resolve({ 
        model, 
        size: metrics.size,
        maxDim: normalizedMaxDim,
        normalization: normResult,
        validation: validation,
        gridResized: gridResizeResult.resized,
      });
    };

    const onError = async (error) => {
      console.error('❌ Error loading GLB/GLTF model:', error);
      console.log('🔍 Attempting to fix GLTF with missing external resources...');

      // Try to load and convert GLTF with embedded resources
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if it's JSON (GLTF) or binary (GLB)
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        
        let gltfJson;
        
        if (contentType.includes('json') || text.trim().startsWith('{')) {
          // It's JSON GLTF
          try {
            gltfJson = JSON.parse(text);
          } catch (parseError) {
            throw new Error(`Invalid JSON in GLTF file: ${parseError.message}`);
          }

          // Check for external dependencies
          const deps = checkGltfDependencies(gltfJson);
          console.log('📦 GLTF Dependency Check:', deps);

          if (deps.requiresEmbedding) {
            console.log(`🔗 Attempting to embed ${deps.dependencyCount} missing resource(s)...`);
            
            try {
              // Try to fetch and embed resources
              const baseUrl = new URL(url).href.split('/').slice(0, -1).join('/') + '/';
              const embedded = await embedGltfResourcesFromUrl(
                gltfJson, 
                baseUrl,
                deps.dependencies
              );

              // Create data URL for embedded GLTF
              const embeddedJson = JSON.stringify(embedded);
              const gltfDataUrl = `data:application/json;charset=utf-8;base64,${btoa(embeddedJson)}`;

              console.log('✅ Successfully embedded GLTF resources. Retrying load...');
              
              // Retry loading with embedded version
              loader.load(gltfDataUrl, onSuccess, undefined, (retryError) => {
                console.error('❌ Failed to load embedded GLTF:', retryError);
                reject(new Error(
                  `GLTF file has missing dependencies that could not be embedded. ` +
                  `Missing: ${deps.dependencies.join(', ')} ` +
                  `Original error: ${error.message}`
                ));
              });
            } catch (embedError) {
              console.error('⚠️ Could not embed resources:', embedError);
              reject(new Error(
                `GLTF file missing external resources (${deps.dependencies.join(', ')}). ` +
                `Try using .GLB format instead or ensure all files are uploaded together. ` +
                `Details: ${embedError.message}`
              ));
            }
          } else {
            reject(new Error(
              `GLTF file failed to load for unknown reason. ` +
              `Try using .GLB format instead. ` +
              `Error: ${error.message}`
            ));
          }
        } else {
          reject(new Error(
            `Expected JSON GLTF file but received different format. ` +
            `Make sure to upload .gltf (not .glb) files. ` +
            `Error: ${error.message}`
          ));
        }
      } catch (recoveryError) {
        console.error('❌ Recovery attempt failed:', recoveryError);
        reject(new Error(
          `Failed to load GLTF file. ${recoveryError.message}. ` +
          `Please use .GLB files instead (which include all resources).`
        ));
      }
    };

    loader.load(
      url,
      onSuccess,
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      onError
    );
  });
};
