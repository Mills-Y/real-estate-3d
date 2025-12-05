import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, Upload, Home, Play, X, Check, Grid3x3, Eye, Trash2, Share2, Settings } from 'lucide-react';

const RealEstateScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('gallery');
  const [showScanModal, setShowScanModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Kiri Engine API states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [kiriApiKey, setKiriApiKey] = useState(localStorage.getItem('kiriApiKey') || '');
  const [isProcessingKiri, setIsProcessingKiri] = useState(false);
  const [kiriProgress, setKiriProgress] = useState(0);
  const [kiriStatus, setKiriStatus] = useState('');
  
  const [properties, setProperties] = useState([
    {
      id: 1,
      title: 'Modern Beach House',
      location: 'Malibu, CA',
      price: '$2,450,000',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
      type: 'scan',
      beds: 4,
      baths: 3,
      sqft: '3,200'
    },
    {
      id: 2,
      title: 'Downtown Loft',
      location: 'New York, NY',
      price: '$1,850,000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      type: 'upload',
      beds: 2,
      baths: 2,
      sqft: '1,800'
    },
    {
      id: 3,
      title: 'Suburban Family Home',
      location: 'Austin, TX',
      price: '$675,000',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
      type: 'scan',
      beds: 5,
      baths: 3,
      sqft: '2,800'
    }
  ]);

  const PROXY_URL = 'http://localhost:3001';

  const createSimple3DModel = (type = 'house') => {
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
        vertexColors: true
      });
      
      const points = new THREE.Points(geometry, material);
      group.add(points);
      
      // Add mesh approximation
      const meshGeom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const meshMat = new THREE.MeshPhongMaterial({
        color: 0x88aa88,
        transparent: true,
        opacity: 0.4
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

  const init3DViewer = () => {
  if (!mountRef.current) {
    console.error('mountRef.current is null!');
    return;
  }

  // Clean up existing scene
  if (rendererRef.current && rendererRef.current.domElement && rendererRef.current.domElement.parentNode === mountRef.current) {
    mountRef.current.removeChild(rendererRef.current.domElement);
    rendererRef.current.dispose();
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  sceneRef.current = scene;

  const camera = new THREE.PerspectiveCamera(
    75,
    mountRef.current.clientWidth / mountRef.current.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 4, 5);
  camera.lookAt(0, 0, 0);
  cameraRef.current = camera;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
  renderer.shadowMap.enabled = true;
  mountRef.current.appendChild(renderer.domElement);
  rendererRef.current = renderer;

  // --- lights ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // --- ground plane ---
  const groundGeom = new THREE.PlaneGeometry(15, 15);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x90ee90 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add grid helper for reference
  const gridHelper = new THREE.GridHelper(15, 15);
  scene.add(gridHelper);

  // Add axes helper (red=X, green=Y, blue=Z)
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // --- helper to add a model (either GLB or fallback cube house) ---
  const addFallbackModel = () => {
    const fallback = createSimple3DModel(
      selectedProperty?.type === 'scan' ? 'scanned' : 'house'
    );
    scene.add(fallback);
    modelRef.current = fallback;
  };

  const property = selectedProperty;

  // Load 3D model based on file type
  if (property?.modelUrl) {
    // Check if it's a PLY file
    if (property.fileType === 'ply') {
      const plyLoader = new PLYLoader();
      
      plyLoader.load(
        property.modelUrl,
        (geometry) => {
          console.log('✅ PLY model loaded successfully');
          console.log('Has colors:', geometry.attributes.color ? 'Yes' : 'No');
          console.log('Vertex count:', geometry.attributes.position.count);
          
          // Check if this might be a 3D Gaussian Splatting file
          const hasGaussianAttribs = geometry.attributes.opacity || 
                                      geometry.attributes.scale_0 || 
                                      geometry.attributes.f_dc_0;
          
          if (hasGaussianAttribs) {
            console.warn('⚠️ This appears to be a 3D Gaussian Splatting file. Basic point cloud rendering may not look optimal.');
          }
          
          // Compute normals for better appearance
          geometry.computeVertexNormals();
          
          // Calculate appropriate point size based on model density
          geometry.computeBoundingBox();
          const bbox = geometry.boundingBox;
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // For 3DGS files, use smaller, denser points
          const pointSize = hasGaussianAttribs ? maxDim / 500 : maxDim / 200;
          
          // Create point cloud material with vertex colors
          const material = new THREE.PointsMaterial({
            size: pointSize,
            vertexColors: geometry.attributes.color ? true : false,
            color: geometry.attributes.color ? undefined : 0xaaaaaa,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
          });
          
          const pointCloud = new THREE.Points(geometry, material);
          
          // Center model at origin
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          pointCloud.position.sub(center);
          pointCloud.position.y = 0;
          
          scene.add(pointCloud);
          modelRef.current = pointCloud;
          
          // Add bounding box helper
          const boxHelper = new THREE.BoxHelper(pointCloud, 0xffff00);
          scene.add(boxHelper);
          
          // Position camera
          const fov = (camera.fov * Math.PI) / 180;
          let cameraZ = maxDim / (2 * Math.tan(fov / 2));
          cameraZ *= 2.5;
          
          camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
          camera.lookAt(0, 0, 0);
          
          console.log('PLY rendered as point cloud with', geometry.attributes.position.count, 'points');
          console.log('Point size:', pointSize);
          
          if (hasGaussianAttribs) {
            alert('Note: This is a 3D Gaussian Splatting file. For best quality, consider using a dedicated Gaussian Splatting viewer or converting to a mesh format.');
          }
        },
        undefined,
        (error) => {
          console.error('Error loading PLY model:', error);
          alert('Failed to load PLY file. Check console for details.');
          addFallbackModel();
        }
      );
    } else {
      // Load GLB/GLTF files
      const loader = new GLTFLoader();

      loader.load(
        property.modelUrl,
        (gltf) => {
          console.log('✅ 3D model loaded successfully');
          const model = gltf.scene;
        
        let hasMaterials = false;
        
        // Enable shadows and fix materials
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            
            // Check if material exists and is visible
            if (obj.material) {
              hasMaterials = true;
              obj.material.needsUpdate = true;
              
              // If material is transparent or has no color, add a default material
              if (!obj.material.color || obj.material.opacity === 0) {
                obj.material = new THREE.MeshPhongMaterial({ 
                  color: 0x888888,
                  side: THREE.DoubleSide 
                });
              }
            } else {
              // No material - add a default one
              obj.material = new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                side: THREE.DoubleSide 
              });
            }
          }
        });

        console.log('Has materials:', hasMaterials);

        // Center model at origin
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.sub(center);
        model.position.y = 0; // Place on ground

        scene.add(model);
        modelRef.current = model;

        // Add a bounding box helper to visualize the model bounds
        const boxHelper = new THREE.BoxHelper(model, 0xffff00);
        scene.add(boxHelper);

        // Position camera based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera.fov * Math.PI) / 180;
        let cameraZ = maxDim / (2 * Math.tan(fov / 2));
        cameraZ *= 2.5; // more padding to see the whole model
        
        camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
        camera.lookAt(0, 0, 0);

        
        console.log('Camera positioned at:', camera.position);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading GLB/GLTF model:', error);
        alert('Failed to load 3D model. Check console for details.');
        addFallbackModel();
      }
    );
    }
  } else {
    // No model for this property → just show the simple demo house
    addFallbackModel();
  }

  // --- OrbitControls for better 3D manipulation ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    controls.update(); // required if damping is enabled
    renderer.render(scene, camera);
  };
  animate();
};


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanProgress(0);
    setCapturedFrames([]);
    
    let frameCount = 0;
    const totalFrames = 25;
    
    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        setCapturedFrames(prev => [...prev, frame]);
        frameCount++;
        setScanProgress((frameCount / totalFrames) * 100);
        
        if (frameCount >= totalFrames) {
          clearInterval(interval);
          setIsScanning(false);
          processScannedProperty();
        }
      }
    }, 600);
  };

  const processScannedProperty = () => {
    setTimeout(() => {
      const newProperty = {
        id: Date.now(),
        title: `Scanned Property ${properties.length + 1}`,
        location: 'Location TBD',
        price: 'Price TBD',
        image: capturedFrames[0],
        type: 'scan',
        beds: 0,
        baths: 0,
        sqft: 'N/A'
      };

      setProperties(prev => [newProperty, ...prev]);
      stopCamera();
      setShowScanModal(false);
      setCapturedFrames([]);
      alert('Property successfully scanned and uploaded!');
    }, 1000);
  };

  // Kiri Engine API Functions
  const saveApiKey = (key) => {
    setKiriApiKey(key);
    localStorage.setItem('kiriApiKey', key);
  };

  const uploadToKiriEngine = async () => {
  if (!kiriApiKey) {
    alert('Please set your Kiri Engine API key in Settings first!');
    setShowSettingsModal(true);
    return;
  }

  if (capturedFrames.length < 20) {
    alert('Please capture at least 20 images for Kiri Engine processing!');
    return;
  }

  try {
    setIsProcessingKiri(true);
    setKiriStatus('Uploading images to Kiri Engine...');
    setKiriProgress(10);

    // Create FormData for our proxy server
    const formData = new FormData();
    formData.append('isMesh', '1');
    formData.append('isMask', '0');
    formData.append('fileFormat', 'glb');

    // Convert dataURL frames to blobs and append to formData
    for (let i = 0; i < capturedFrames.length; i++) {
      const response = await fetch(capturedFrames[i]);
      const blob = await response.blob();
      formData.append('images', blob, `image_${i}.jpg`);
    }

    // Send to our proxy server (not directly to Kiri)
    const uploadResponse = await fetch(`${PROXY_URL}/api/kiri/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kiriApiKey}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.msg || 'Failed to upload images');
    }

    const data = await uploadResponse.json();
    
    if (data.ok && data.data.serialize) {
      setKiriStatus('Upload successful! Processing started...');
      setKiriProgress(30);
      pollKiriStatus(data.data.serialize);
    } else {
      throw new Error(data.msg || 'Invalid response from Kiri Engine');
    }
  } catch (error) {
    console.error('Kiri Engine upload error:', error);
    alert(`Upload failed: ${error.message}`);
    setIsProcessingKiri(false);
    setKiriStatus('');
    setKiriProgress(0);
  }
};

  const pollKiriStatus = async (serialNumber) => {
  // Skip status polling - just wait and try to download periodically
  let attempts = 0;
  const maxAttempts = 60; // Try for up to 10 minutes (60 * 10 seconds)

  const tryDownload = async () => {
    attempts++;
    setKiriStatus(`Processing... (attempt ${attempts}/${maxAttempts}) - This may take 5-10 minutes`);
    setKiriProgress(30 + (attempts * 1));

    try {
      // Try to download directly - if the model isn't ready, it will fail
      const response = await fetch(
        `${PROXY_URL}/api/kiri/download/${serialNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kiriApiKey}`
          }
        }
      );

      const data = await response.json();
      
      if (data.ok && data.data && data.data.downloadUrl) {
        // Model is ready!
        await downloadKiriModel(serialNumber);
        return;
      }
      
      // Not ready yet, try again
      if (attempts < maxAttempts) {
        setTimeout(tryDownload, 10000); // Wait 10 seconds between attempts
      } else {
        throw new Error('Timeout - model may still be processing. Try again later.');
      }
    } catch (error) {
      if (attempts < maxAttempts) {
        setTimeout(tryDownload, 10000);
      } else {
        setKiriStatus('Processing timeout');
        setIsProcessingKiri(false);
        alert(`Processing is taking longer than expected. Your model serial number is: ${serialNumber}\n\nYou can try downloading later from the Kiri Engine website.`);
      }
    }
  };

  // Start trying after an initial 30-second delay
  setKiriStatus('Upload complete! Waiting for processing to start...');
  setTimeout(tryDownload, 30000);
};

  const downloadKiriModel = async (serialNumber) => {
  try {
    // Use proxy server instead of direct Kiri API
    const response = await fetch(
      `${PROXY_URL}/api/kiri/download/${serialNumber}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kiriApiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get download link');
    }

    const data = await response.json();
    
    if (data.ok && data.data && data.data.downloadUrl) {
      setKiriProgress(95);
      setKiriStatus('Downloading model file...');
      
      // Download the actual model file
      const modelResponse = await fetch(data.data.downloadUrl);
      const blob = await modelResponse.blob();
      
      const newProperty = {
        id: Date.now(),
        title: `Kiri Scanned Property ${properties.length + 1}`,
        location: 'Location TBD',
        price: 'Price TBD',
        image: capturedFrames[0],
        type: 'kiri-scan',
        beds: 0,
        baths: 0,
        sqft: 'N/A',
        modelUrl: URL.createObjectURL(blob),
        fileType: 'gltf',
        serialNumber: serialNumber
      };
      
      setProperties([newProperty, ...properties]);
      
      setKiriProgress(100);
      setKiriStatus('Complete!');
      
      setTimeout(() => {
        setIsProcessingKiri(false);
        setKiriStatus('');
        setKiriProgress(0);
        setShowScanModal(false);
        stopCamera();
        setCapturedFrames([]);
        alert('3D model created successfully with Kiri Engine!');
      }, 1500);
    } else {
      throw new Error('No download URL in response');
    }
  } catch (error) {
    console.error('Download error:', error);
    alert(`Download failed: ${error.message}`);
    setIsProcessingKiri(false);
    setKiriStatus('');
    setKiriProgress(0);
  }
};

  const handleFileUpload = (e) => {
   const file = e.target.files?.[0];
   if (!file) return;

   const name = file.name.toLowerCase();
   if (!name.endsWith('.glb') && !name.endsWith('.gltf') && !name.endsWith('.ply')) {
     alert('Please upload GLB, GLTF, or PLY files only.');
     return;
   }

   // Create a temporary URL for this file in the browser
   const objectUrl = URL.createObjectURL(file);

   const newProperty = {
     id: Date.now(),
     title: file.name.replace(/\.[^/.]+$/, ''),
     location: 'Location TBD',
     price: 'Price TBD',
     image:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
     type: 'upload',
     beds: 0,
     baths: 0,
     sqft: 'N/A',
     modelUrl: objectUrl,
     fileType: name.endsWith('.ply') ? 'ply' : 'gltf', // Track file type
   };

  setProperties((prev) => [newProperty, ...prev]);
  setShowUploadModal(false);
  alert('3D model uploaded successfully!');
};

  const openScanModal = () => {
    setShowScanModal(true);
    startCamera();
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    stopCamera();
    setIsScanning(false);
    setCapturedFrames([]);
    setScanProgress(0);
  };

  const viewProperty = (property) => {
    console.log('viewProperty called with:', property);
    setSelectedProperty(property);
    setShowViewer(true);
  };

  const closeViewer = () => {
    setShowViewer(false);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (rendererRef.current && mountRef.current && rendererRef.current.domElement && rendererRef.current.domElement.parentNode === mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }
  };

  const deleteProperty = (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // Initialize 3D viewer when modal opens and property is selected
  useEffect(() => {
    if (showViewer && selectedProperty) {
      console.log('useEffect: Initializing 3D viewer for property:', selectedProperty);
      setTimeout(() => init3DViewer(), 100);
    }
  }, [showViewer, selectedProperty]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Professional Header */}
      <header style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
              }}>
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ 
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>RealEstate3D</h1>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Professional Property Visualization</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={openScanModal}
                className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Camera className="w-5 h-5" />
                Scan Property
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Upload className="w-5 h-5" />
                Upload Model
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats/Hero Section */}
        <div className="mb-8 p-6 rounded-2xl" style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Property Portfolio</h2>
              <p style={{ color: '#94a3b8' }}>Manage and visualize your 3D property scans</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#60a5fa' }}>{properties.length}</div>
                <div className="text-sm" style={{ color: '#94a3b8' }}>Total Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#a78bfa' }}>{properties.filter(p => p.type === 'scan').length}</div>
                <div className="text-sm" style={{ color: '#94a3b8' }}>3D Scanned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
            style={{
              background: activeTab === 'gallery' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: activeTab === 'gallery' ? 'white' : '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              backdropFilter: 'blur(12px)',
              boxShadow: activeTab === 'gallery' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <Grid3x3 className="w-5 h-5" />
            All Properties
          </button>
          <button
            onClick={() => setActiveTab('myuploads')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
            style={{
              background: activeTab === 'myuploads' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: activeTab === 'myuploads' ? 'white' : '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              backdropFilter: 'blur(12px)',
              boxShadow: activeTab === 'myuploads' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <Upload className="w-5 h-5" />
            My Uploads
          </button>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
              }}
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={property.image} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.9)' }}
                />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 50%)'
                }} />
                <div className="absolute top-3 right-3">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                    style={{
                      background: property.type === 'scan' 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {property.type === 'scan' ? '✓ 3D Scanned' : '↑ Uploaded'}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-1">{property.title}</h3>
                <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>{property.location}</p>
                <p className="text-2xl font-bold mb-4" style={{ 
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{property.price}</p>
                
                <div className="flex justify-between text-sm mb-4 pb-4" style={{ 
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8'
                }}>
                  <span>🛏️ {property.beds} beds</span>
                  <span>🚿 {property.baths} baths</span>
                  <span>📐 {property.sqft} sqft</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => viewProperty(property)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Eye className="w-4 h-4" />
                    View 3D
                  </button>
                  <button
                    onClick={() => deleteProperty(property.id)}
                    className="px-3 py-2.5 rounded-xl transition-all duration-300"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    className="px-3 py-2.5 rounded-xl transition-all duration-300"
                    style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: '#94a3b8',
                      border: '1px solid rgba(148, 163, 184, 0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-20">
            <Camera className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No Properties Yet</h3>
            <p className="text-gray-500">Start by scanning or uploading your first property</p>
          </div>
        )}
      </main>

      {/* Scan Modal - MOBILE OPTIMIZED */}
      {showScanModal && (
        <div 
          className="fixed inset-0 bg-black"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
        >
          {/* Header - Fixed at top */}
          <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-90 p-3 flex justify-between items-center" style={{ zIndex: 50 }}>
            <h2 className="text-lg font-bold text-white">Scanner</h2>
            <button 
              onClick={closeScanModal} 
              className="bg-red-600 hover:bg-red-700 rounded-full p-2"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Camera View - Fixed height with proper aspect ratio */}
          <div 
            className="absolute bg-gray-900 flex items-center justify-center"
            style={{
              top: '60px',
              left: 0,
              right: 0,
              height: 'calc(100vh - 260px)',
              maxHeight: '500px'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Photo Counter - Top Left */}
            {capturedFrames.length > 0 && (
              <div 
                className="absolute top-3 left-3 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg"
                style={{ zIndex: 10 }}
              >
                <p className="font-bold text-base">{capturedFrames.length} photos</p>
              </div>
            )}

            {/* Thumbnails - Bottom Left */}
            {capturedFrames.length > 0 && !isScanning && !isProcessingKiri && (
              <div 
                className="absolute bottom-3 left-3 flex gap-2 overflow-x-auto"
                style={{ 
                  maxWidth: '180px',
                  zIndex: 10
                }}
              >
                {capturedFrames.slice(-3).map((frame, i) => (
                  <img 
                    key={i} 
                    src={frame} 
                    alt={`Frame ${i}`} 
                    className="rounded border-2 border-green-500 object-cover"
                    style={{ 
                      width: '50px', 
                      height: '50px',
                      flexShrink: 0
                    }}
                  />
                ))}
              </div>
            )}

            {/* Scanning Progress Overlay */}
            {isScanning && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center"
                style={{ zIndex: 20 }}
              >
                <Camera className="w-12 h-12 text-green-500 mb-3 animate-pulse" />
                <div className="text-white text-xl font-bold mb-2">Scanning...</div>
                <div className="text-green-400 text-base mb-3">{Math.round(scanProgress)}%</div>
                <div 
                  className="bg-gray-700 rounded-full overflow-hidden"
                  style={{ width: '200px', height: '8px' }}
                >
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Kiri Processing Overlay */}
            {isProcessingKiri && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4"
                style={{ zIndex: 20 }}
              >
                <div 
                  className="border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"
                  style={{ width: '48px', height: '48px' }}
                ></div>
                <div className="text-white text-lg font-bold mb-2">Kiri Processing</div>
                <p className="text-purple-200 text-sm mb-3 text-center">{kiriStatus}</p>
                <div 
                  className="bg-gray-700 rounded-full overflow-hidden"
                  style={{ width: '200px', height: '8px' }}
                >
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${kiriProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls Panel - Fixed at bottom */}
          <div 
            className="absolute left-0 right-0 bg-gray-900 bg-opacity-95 p-4"
            style={{
              bottom: 0,
              height: '200px',
              zIndex: 50
            }}
          >
            {/* Manual Capture Button - Center */}
            {!isScanning && !isProcessingKiri && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => {
                    const frame = captureFrame();
                    if (frame) {
                      setCapturedFrames(prev => [...prev, frame]);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl"
                  style={{ 
                    width: '70px', 
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera className="w-8 h-8" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Auto Scan Button */}
              <button
                onClick={startScanning}
                disabled={isScanning || !stream || isProcessingKiri}
                className="w-full rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg text-white transition"
                style={{
                  padding: '12px',
                  backgroundColor: (isScanning || !stream || isProcessingKiri) ? '#4B5563' : '#10B981',
                  cursor: (isScanning || !stream || isProcessingKiri) ? 'not-allowed' : 'pointer'
                }}
              >
                {isScanning ? (
                  <>
                    <Play className="w-4 h-4 animate-pulse" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Auto Scan (15 frames)</span>
                  </>
                )}
              </button>

              {/* Kiri Engine Button */}
              {capturedFrames.length >= 20 && !isScanning && !isProcessingKiri && (
                <button
                  onClick={uploadToKiriEngine}
                  className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg text-white transition"
                  style={{ padding: '12px' }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Process with Kiri ({capturedFrames.length} photos)</span>
                </button>
              )}

              {/* Photo count message */}
              {capturedFrames.length > 0 && capturedFrames.length < 20 && !isScanning && (
                <div 
                  className="bg-yellow-600 rounded-lg text-center"
                  style={{ padding: '8px' }}
                >
                  <p className="text-xs font-semibold text-white">
                    Need {20 - capturedFrames.length} more photos for Kiri Engine
                  </p>
                </div>
              )}

              {/* Instructions */}
              {!isScanning && !isProcessingKiri && capturedFrames.length === 0 && (
                <div 
                  className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg text-center"
                  style={{ padding: '8px' }}
                >
                  <p className="text-xs text-blue-100">
                    Tap blue button to capture • Or use Auto Scan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4" 
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            // Close modal if clicking on the background (not the modal content)
            if (e.target === e.currentTarget) {
              setShowUploadModal(false);
            }
          }}
        >
          <div className="bg-gray-800 text-white rounded-lg p-6 max-w-md w-full shadow-2xl" style={{ margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Upload 3D Model</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2" style={{ minWidth: '44px', minHeight: '44px' }} title="Close upload">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="mb-3 font-semibold" style={{ color: '#FFFFFF' }}>Supported formats:</p>
              <ul className="text-sm list-disc list-inside space-y-1" style={{ color: '#F0F0F0' }}>
                <li>GLB (Binary glTF)</li>
                <li>GLTF (GL Transmission Format)</li>
                <li>PLY (Polygon File Format / Point Cloud)</li>
              </ul>
            </div>

            <div 
              className="border-2 border-dashed rounded-lg p-10 text-center mb-4 transition-all duration-200"
              style={{ 
                backgroundColor: isDragging ? '#DBEAFE' : '#E5E7EB',
                borderColor: isDragging ? '#3B82F6' : '#9CA3AF',
                borderWidth: '3px'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                
                const files = e.dataTransfer.files;
                if (files && files[0]) {
                  const file = files[0];
                  const name = file.name.toLowerCase();
                  if (name.endsWith('.glb') || name.endsWith('.gltf') || name.endsWith('.ply')) {
                    // Simulate the file input change event
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    const fileInput = document.getElementById('file-upload-input');
                    fileInput.files = dataTransfer.files;
                    handleFileUpload({ target: { files: [file] } });
                  } else {
                    alert('Please upload a GLB, GLTF, or PLY file');
                  }
                }
              }}
            >
              <input
                type="file"
                accept=".glb,.gltf,.ply"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <div 
                onClick={() => document.getElementById('file-upload-input').click()}
                className="flex flex-col items-center gap-3 w-full cursor-pointer"
              >
                <Upload className="w-20 h-20" style={{ color: isDragging ? '#2563EB' : '#3B82F6' }} />
                <div>
                  <p className="text-xl font-bold mb-1" style={{ color: '#1F2937' }}>
                    {isDragging ? 'Drop your file here' : 'Drag & Drop or Click to Upload'}
                  </p>
                  <p className="text-sm font-medium" style={{ color: '#4B5563' }}>
                    GLB, GLTF, or PLY files
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-3">
              <p className="text-sm" style={{ color: '#FFFFE0' }}>
                💡 <strong>Tip:</strong> Ensure your model is optimized and properly textured for best viewing experience.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3D Viewer Modal */}
      {showViewer && selectedProperty && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.95)' 
          }}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-6xl flex flex-col" style={{ height: '85vh', maxHeight: '85vh' }}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800" style={{ flexShrink: 0, zIndex: 100 }}>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedProperty.title}</h2>
                <p className="text-gray-400">{selectedProperty.location}</p>
              </div>
              <button 
                onClick={closeViewer} 
                className="text-white bg-red-600 hover:bg-red-700 rounded-full p-3 flex items-center justify-center"
                style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
                title="Close viewer"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            
            <div className="flex-1 relative" style={{ backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
              <div ref={mountRef} className="w-full h-full" style={{ backgroundColor: '#2a2a2a', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              
              {/* Floating close button - positioned over the canvas */}
              <button 
                onClick={closeViewer} 
                className="text-white bg-red-600 hover:bg-red-700 rounded-full p-3 flex items-center justify-center shadow-lg"
                style={{ 
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  minWidth: '56px', 
                  minHeight: '56px',
                  zIndex: 1000,
                  cursor: 'pointer'
                }}
                title="Close viewer"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-sm" style={{ zIndex: 10 }}>
                <p className="font-semibold mb-1">Controls:</p>
                <p>• Left-click + drag to rotate</p>
                <p>• Right-click + drag to pan</p>
                <p>• Scroll to zoom in/out</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4" 
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
            }
          }}
        >
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl" style={{ margin: 'auto', color: '#ffffff' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Kiri Engine Settings</h2>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="bg-red-600 hover:bg-red-700 rounded-full p-2"
                style={{ minWidth: '44px', minHeight: '44px', color: '#ffffff' }}
                title="Close settings"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-semibold" style={{ color: '#ffffff' }}>API Key</label>
              <input
                type="password"
                value={kiriApiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="Enter your Kiri Engine API key"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                style={{ color: '#ffffff' }}
              />
              <p className="text-sm mt-2" style={{ color: '#e5e5e5' }}>
                Get your API key from{' '}
                <a 
                  href="https://www.kiriengine.app/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                  style={{ color: '#c084fc' }}
                >
                  kiriengine.app/api
                </a>
              </p>
            </div>

            <div className="bg-purple-900 bg-opacity-40 border border-purple-600 rounded-lg p-4 mb-4">
              <p className="text-sm" style={{ color: '#ffffff' }}>
                💡 <strong>About Kiri Engine:</strong> Professional 3D scanning service using photogrammetry. Sign up to get 20 free credits!
              </p>
            </div>

            <div className="bg-blue-900 bg-opacity-40 border border-blue-600 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2" style={{ color: '#ffffff' }}>
                How it works:
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#f5f5f5' }}>
                <li>• Capture 20+ photos of your property</li>
                <li>• Click "Process with Kiri Engine"</li>
                <li>• Wait 5-10 minutes for processing</li>
                <li>• Download your 3D model automatically!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateScanner;