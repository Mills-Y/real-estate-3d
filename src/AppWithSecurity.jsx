/** @jsx React.createElement */
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, Upload, Home, Play, X, Check, Grid3x3, Eye, Trash2, Share2, Settings, LogOut, User, Lock, Mail } from 'lucide-react';

const RealEstateScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('gallery');
  const [showScanModal, setShowScanModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Kiri Engine API states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [kiriApiKey, setKiriApiKey] = useState('');
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

  // Simple password hashing simulation (in production, use proper backend hashing)
  const hashPassword = (password) => {
    // This is a VERY basic hash simulation - in production use bcrypt on backend
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  // Load users from localStorage
  const getUsers = () => {
    const users = localStorage.getItem('realEstate3D_users');
    return users ? JSON.parse(users) : [];
  };

  // Save users to localStorage
  const saveUsers = (users) => {
    localStorage.setItem('realEstate3D_users', JSON.stringify(users));
  };

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('realEstate3D_session');
    const guestSession = localStorage.getItem('realEstate3D_guest');
    
    if (session) {
      const userData = JSON.parse(session);
      setCurrentUser(userData);
      setIsAuthenticated(true);
      setIsGuestMode(false);
      setShowAuthModal(false);
      
      // Load user's Kiri API key
      const userKiriKey = localStorage.getItem(`kiriApiKey_${userData.username}`);
      if (userKiriKey) {
        setKiriApiKey(userKiriKey);
      }
    } else if (guestSession) {
      setIsGuestMode(true);
      setIsAuthenticated(false);
      setShowAuthModal(false);
    }
  }, []);

  // Handle registration
  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');

    // Validation
    if (!authForm.username || !authForm.email || !authForm.password) {
      setAuthError('All fields are required');
      return;
    }

    if (authForm.username.length < 3) {
      setAuthError('Username must be at least 3 characters');
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authForm.email)) {
      setAuthError('Please enter a valid email');
      return;
    }

    // Check if user already exists
    const users = getUsers();
    if (users.find(u => u.username === authForm.username)) {
      setAuthError('Username already exists');
      return;
    }

    if (users.find(u => u.email === authForm.email)) {
      setAuthError('Email already registered');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      username: authForm.username,
      email: authForm.email,
      password: hashPassword(authForm.password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Auto login after registration
    const userData = { username: newUser.username, email: newUser.email, id: newUser.id };
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('realEstate3D_session', JSON.stringify(userData));
    
    alert('Account created successfully! Welcome to RealEstate3D.');
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authForm.username || !authForm.password) {
      setAuthError('Username and password are required');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username === authForm.username);

    if (!user) {
      setAuthError('Invalid username or password');
      return;
    }

    if (user.password !== hashPassword(authForm.password)) {
      setAuthError('Invalid username or password');
      return;
    }

    // Login successful
    const userData = { username: user.username, email: user.email, id: user.id };
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('realEstate3D_session', JSON.stringify(userData));
    
    // Load user's Kiri API key
    const userKiriKey = localStorage.getItem(`kiriApiKey_${user.username}`);
    if (userKiriKey) {
      setKiriApiKey(userKiriKey);
    }
  };

  // Handle guest mode
  const handleGuestMode = () => {
    setIsGuestMode(true);
    setIsAuthenticated(false);
    setShowAuthModal(false);
    localStorage.setItem('realEstate3D_guest', 'true');
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuestMode(false);
    setCurrentUser(null);
    setShowAuthModal(true);
    localStorage.removeItem('realEstate3D_session');
    localStorage.removeItem('realEstate3D_guest');
    setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
    setKiriApiKey('');
  };

  // Update Kiri API key save to be user-specific
  const saveApiKey = (key) => {
    setKiriApiKey(key);
    if (currentUser) {
      localStorage.setItem(`kiriApiKey_${currentUser.username}`, key);
    }
  };

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const groundGeom = new THREE.PlaneGeometry(15, 15);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x90ee90 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(15, 15);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const addFallbackModel = () => {
      const fallback = createSimple3DModel(
        selectedProperty?.type === 'scan' ? 'scanned' : 'house'
      );
      scene.add(fallback);
      modelRef.current = fallback;
    };

    const property = selectedProperty;

    if (property?.modelUrl) {
      if (property.fileType === 'ply') {
        const plyLoader = new PLYLoader();
        
        plyLoader.load(
          property.modelUrl,
          (geometry) => {
            console.log('[SUCCESS] PLY model loaded successfully');
            
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            
            const hasGaussianAttribs = geometry.attributes.opacity || 
                                        geometry.attributes.scale_0 || 
                                        geometry.attributes.f_dc_0;
            
            const pointSize = hasGaussianAttribs ? maxDim / 500 : maxDim / 200;
            
            const material = new THREE.PointsMaterial({
              size: pointSize,
              vertexColors: geometry.attributes.color ? true : false,
              color: geometry.attributes.color ? undefined : 0xaaaaaa,
              sizeAttenuation: true,
              transparent: true,
              opacity: 0.8
            });
            
            const pointCloud = new THREE.Points(geometry, material);
            
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            pointCloud.position.sub(center);
            pointCloud.position.y = 0;
            
            scene.add(pointCloud);
            modelRef.current = pointCloud;
            
            const boxHelper = new THREE.BoxHelper(pointCloud, 0xffff00);
            scene.add(boxHelper);
            
            const fov = (camera.fov * Math.PI) / 180;
            let cameraZ = maxDim / (2 * Math.tan(fov / 2));
            cameraZ *= 2.5;
            
            camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
            camera.lookAt(0, 0, 0);
          },
          undefined,
          (error) => {
            console.error('Error loading PLY model:', error);
            alert('Failed to load PLY file. Check console for details.');
            addFallbackModel();
          }
        );
      } else {
        const loader = new GLTFLoader();

        loader.load(
          property.modelUrl,
          (gltf) => {
            console.log('[SUCCESS] 3D model loaded successfully');
            const model = gltf.scene;
          
            model.traverse((obj) => {
              if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
                
                if (obj.material) {
                  obj.material.needsUpdate = true;
                  
                  if (!obj.material.color || obj.material.opacity === 0) {
                    obj.material = new THREE.MeshPhongMaterial({ 
                      color: 0x888888,
                      side: THREE.DoubleSide 
                    });
                  }
                } else {
                  obj.material = new THREE.MeshPhongMaterial({ 
                    color: 0x888888,
                    side: THREE.DoubleSide 
                  });
                }
              }
            });

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            model.position.sub(center);
            model.position.y = 0;

            scene.add(model);
            modelRef.current = model;

            const boxHelper = new THREE.BoxHelper(model, 0xffff00);
            scene.add(boxHelper);

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = (camera.fov * Math.PI) / 180;
            let cameraZ = maxDim / (2 * Math.tan(fov / 2));
            cameraZ *= 2.5;
            
            camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
            camera.lookAt(0, 0, 0);
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
      addFallbackModel();
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return {
          success: false,
          message: 'Camera is unavailable in this browser context. Use HTTPS (or localhost) and try again.',
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return { success: true };
    } catch (error) {
      let message = 'Unable to access camera. Ensure you are on HTTPS (or localhost) and permissions are enabled.';

      if (!globalThis.isSecureContext) {
        message = 'Camera access requires a secure context. Open the app using HTTPS (or localhost).';
      } else if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        message = 'Camera permission was denied. Allow camera access in browser settings and retry.';
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        message = 'No camera device was found on this system.';
      } else if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        message = 'Camera is already in use by another application.';
      }

      return {
        success: false,
        message,
      };
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
    const totalFrames = 15;
    
    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        setCapturedFrames(prev => prev.concat([frame]));
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

      setProperties(prev => [newProperty].concat(prev));
      stopCamera();
      setShowScanModal(false);
      setCapturedFrames([]);
      alert('Property successfully scanned and uploaded!');
    }, 1000);
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

      const formData = new FormData();
      formData.append('isMesh', '1');
      formData.append('isMask', '0');
      formData.append('fileFormat', 'glb');

      for (let i = 0; i < capturedFrames.length; i++) {
        const response = await fetch(capturedFrames[i]);
        const blob = await response.blob();
        formData.append('imagesFiles', blob, `image_${i}.jpg`);
      }

      const uploadResponse = await fetch('https://api.kiriengine.app/api/v1/open/3dgs/image', {
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
        throw new Error('Invalid response from Kiri Engine');
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
    const maxAttempts = 120;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `https://api.kiriengine.app/api/v1/open/model/${serialNumber}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${kiriApiKey}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();
        
        if (data.ok && data.data) {
          const status = data.data.status;
          
          switch (status) {
            case 0:
              setKiriStatus('Queued for processing...');
              setKiriProgress(35);
              break;
            case 1:
              setKiriStatus('Processing 3D model...');
              setKiriProgress(50 + (attempts * 0.3));
              break;
            case 2:
              setKiriStatus('Processing complete! Downloading...');
              setKiriProgress(90);
              await downloadKiriModel(serialNumber);
              return;
            case 3:
              throw new Error('Processing failed');
            default:
              setKiriStatus('Unknown status');
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            throw new Error('Processing timeout');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
        setKiriStatus(`Error: ${error.message}`);
        setIsProcessingKiri(false);
        alert(`Processing failed: ${error.message}`);
      }
    };

    checkStatus();
  };

  const downloadKiriModel = async (serialNumber) => {
    try {
      const response = await fetch(
        `https://api.kiriengine.app/api/v1/open/model/${serialNumber}/download`,
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
          serialNumber: serialNumber
        };
        
        setProperties([newProperty].concat(properties));
        
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

    const objectUrl = URL.createObjectURL(file);

    const newProperty = {
      id: Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      location: 'Location TBD',
      price: 'Price TBD',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
      type: 'upload',
      beds: 0,
      baths: 0,
      sqft: 'N/A',
      modelUrl: objectUrl,
      fileType: name.endsWith('.ply') ? 'ply' : 'gltf',
    };

    setProperties((prev) => [newProperty].concat(prev));
    setShowUploadModal(false);
    alert('3D model uploaded successfully!');
  };

  const openScanModal = async () => {
    const cameraResult = await startCamera();
    if (!cameraResult?.success) {
      alert(cameraResult?.message || 'Unable to access camera.');
      return;
    }

    setShowScanModal(true);
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

  useEffect(() => {
    if (showViewer && selectedProperty) {
      console.log('useEffect: Initializing 3D viewer for property:', selectedProperty);
      setTimeout(() => init3DViewer(), 100);
    }
  }, [showViewer, selectedProperty]);

   // Don't render main app if not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    const formTitle =
      authMode === "login"
        ? "Sign in to your account"
        : "Create your account";
    const formHandler = authMode === "login" ? handleLogin : handleRegister;
    const submitButtonText =
      authMode === "login" ? "Sign In" : "Create Account";
    const toggleText =
      authMode === "login"
        ? "Don't have an account? "
        : "Already have an account? ";
    const toggleLinkText = authMode === "login" ? "Sign Up" : "Sign In";

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        }}
      >
        <div
          className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4"
          style={{
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <div className="flex justify-center mb-6">
            <div
              style={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                padding: "16px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
              }}
            >
              <Home className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1
            className="text-3xl font-bold text-center mb-2"
            style={{
              background:
                "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            RealEstate3D
          </h1>
          <p className="text-center mb-8" style={{ color: "#94a3b8" }}>
            {formTitle}
          </p>

          {authError && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <p className="text-sm text-red-400">{authError}</p>
            </div>
          )}

          <form onSubmit={formHandler}>
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={authForm.username}
                    onChange={(e) =>
                      setAuthForm({
                        ...authForm,
                        username: e.target.value,
                      })
                    }
                    placeholder="Enter username"
                    className="w-full pl-11 pr-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
                    required
                  />
                </div>
              </div>

              {/* Email Field (Register only) */}
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email"
                      className="w-full pl-11 pr-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({
                        ...authForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm password"
                      className="w-full pl-11 pr-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-lg font-bold text-white transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {submitButtonText}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {toggleText}
              <button
                onClick={() => {
                  const newMode =
                    authMode === "login" ? "register" : "login";
                  setAuthMode(newMode);
                  setAuthError("");
                  setAuthForm({
                    username: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="font-semibold transition-colors"
                style={{ color: "#60a5fa" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#93c5fd";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#60a5fa";
                }}
              >
                {toggleLinkText}
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Guest Mode Button */}
          <button
            onClick={handleGuestMode}
            className="w-full py-3 rounded-lg font-bold transition-all duration-300"
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.3)'
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
            Continue as Guest
          </button>

          <div className="mt-4 p-3 rounded-lg" style={{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <p className="text-xs text-center text-yellow-300">
              &#9432; Guest mode: View properties only. Sign up to scan & upload.
            </p>
          </div>

          <div
            className="mt-4 p-3 rounded-lg"
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <p className="text-xs text-center text-blue-300">
              &#128274; Your data is stored securely using browser local
              storage
            </p>
          </div>
        </div>
      </div>
    );
  }
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
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                    {isGuestMode ? 'Browsing as Guest' : `Welcome, ${currentUser?.username}`}
                    </p>
                </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                {!isGuestMode && (
                  <>
                  <button
                    onClick={() => { setShowSettingsModal(true); }}
                    className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                    style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
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
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Camera className="w-5 h-5" />
                    Scan Property
                  </button>
                  <button
                    onClick={() => { setShowUploadModal(true); }}
                    className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                    style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Upload className="w-5 h-5" />
                    Upload Model
                  </button>
                  </>
                )}
                {isGuestMode && (
                  <button
                    onClick={handleLogout}
                    className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                    style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <User className="w-5 h-5" />
                    Sign In
                  </button>
                )}
                {!isGuestMode && (
                  <button
                    onClick={handleLogout}
                    className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300"
                    style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';}}
                    onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';}}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
                </div>
            </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
            {/* Guest Mode Banner */}
            {isGuestMode && (
              <div className="mb-6 p-4 rounded-2xl" style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                backdropFilter: 'blur(12px)'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">&#128065;</div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-300">Guest Mode - View Only</h3>
                      <p className="text-sm text-yellow-200">Sign up to scan properties and upload your own 3D models!</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* Stats/Hero Section */}
            <div className="mb-8 p-6 rounded-2xl" style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isGuestMode ? 'Browse Properties' : 'Your Property Portfolio'}
                </h2>
                <p style={{ color: '#94a3b8' }}>
                  {isGuestMode ? 'Explore available 3D property scans' : 'Manage and visualize your 3D property scans'}
                </p>
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
                onClick={() => { setActiveTab('gallery'); }}
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
                onClick={() => { setActiveTab('myuploads'); }}
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
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.3)';}}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';}}
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
                        {property.type === 'scan' ? '&#10003; 3D Scanned' : '&#8593; Uploaded'}
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
                  <span>Beds: {property.beds}</span>
                  <span>Baths: {property.baths}</span>
                  <span>Sqft: {property.sqft}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => { viewProperty(property); }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Eye className="w-4 h-4" />
                    View 3D
                  </button>
                  <button
                    onClick={() => { deleteProperty(property.id); }}
                    className="px-3 py-2.5 rounded-xl transition-all duration-300"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = 'white';}}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#ef4444';}}
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
                      e.currentTarget.style.color = 'white';}}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#94a3b8';}}
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
                      setCapturedFrames(prev => prev.concat([frame]));}
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
            if (e.target === e.currentTarget) {
              setShowUploadModal(false);}
          }}
        >
          <div className="bg-gray-800 text-white rounded-lg p-6 max-w-md w-full shadow-2xl" style={{ margin: 'auto' }} onClick={(e) => { e.stopPropagation(); }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Upload 3D Model</h2>
              <button onClick={() => { setShowUploadModal(false); }} className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2" style={{ minWidth: '44px', minHeight: '44px' }} title="Close upload">
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
                onClick={() => { document.getElementById('file-upload-input').click(); }}
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
                &#128161; <strong>Tip:</strong> Ensure your model is optimized and properly textured for best viewing experience.
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
              setShowSettingsModal(false);}
          }}
        >
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl" style={{ margin: 'auto', color: '#ffffff' }} onClick={(e) => { e.stopPropagation(); }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Kiri Engine Settings</h2>
              <button 
                onClick={() => { setShowSettingsModal(false); }} 
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
                onChange={(e) => { saveApiKey(e.target.value); }}
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
                &#128161; <strong>About Kiri Engine:</strong> Professional 3D scanning service using photogrammetry. Sign up to get 20 free credits!
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
