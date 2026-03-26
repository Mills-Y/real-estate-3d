import * as THREE from 'three';

/**
 * MeasureTool Class
 * Handles tap-to-measure functionality in Three.js scene
 */
class MeasureTool {
  constructor(scene, camera, renderer, onMeasurementComplete) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.onMeasurementComplete = onMeasurementComplete;
    
    this.isActive = false;
    this.points = [];
    this.markers = [];
    this.lines = [];
    this.labels = [];
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Materials
    this.markerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.9
    });
    
    this.lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x60a5fa,
      linewidth: 2
    });
    
    // Bind methods
    this.handleClick = this.handleClick.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
  }

  /**
   * Activate measure mode
   */
  activate() {
    this.isActive = true;
    this.renderer.domElement.addEventListener('click', this.handleClick);
    this.renderer.domElement.addEventListener('touchstart', this.handleTouchStart);
    this.renderer.domElement.style.cursor = 'crosshair';
    console.log('[MeasureTool] Activated');
  }

  /**
   * Deactivate measure mode
   */
  deactivate() {
    this.isActive = false;
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    this.renderer.domElement.removeEventListener('touchstart', this.handleTouchStart);
    this.renderer.domElement.style.cursor = 'grab';
    console.log('[MeasureTool] Deactivated');
  }

  /**
   * Handle click/tap event
   */
  handleClick(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.castRay();
  }

  /**
   * Handle touch event
   */
  handleTouchStart(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.castRay();
    }
  }

  /**
   * Cast ray and find intersection
   */
  castRay() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all meshes in scene
    const meshes = [];
    this.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
    
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      this.addPoint(point);
    }
  }

  /**
   * Add a measurement point
   */
  addPoint(point) {
    this.points.push(point);
    
    // Create marker sphere
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const marker = new THREE.Mesh(markerGeometry, this.markerMaterial.clone());
    marker.position.copy(point);
    this.scene.add(marker);
    this.markers.push(marker);
    
    console.log('[MeasureTool] Point added:', point);
    
    // If we have 2 points, calculate distance
    if (this.points.length === 2) {
      this.completeMeasurement();
    }
  }

  /**
   * Complete measurement and draw line
   */
  completeMeasurement() {
    const point1 = this.points[0];
    const point2 = this.points[1];
    
    // Calculate distance
    const distance = point1.distanceTo(point2);
    
    // Create line between points
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const line = new THREE.Line(lineGeometry, this.lineMaterial);
    this.scene.add(line);
    this.lines.push(line);
    
    // Create label at midpoint
    const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
    const label = this.createTextLabel(`${distance.toFixed(2)}m`, midpoint);
    if (label) {
      this.scene.add(label);
      this.labels.push(label);
    }
    
    console.log('[MeasureTool] Measurement complete:', distance.toFixed(2), 'meters');
    
    // Callback with measurement data
    if (this.onMeasurementComplete) {
      this.onMeasurementComplete({
        point1: { x: point1.x, y: point1.y, z: point1.z },
        point2: { x: point2.x, y: point2.y, z: point2.z },
        distance: distance,
        unit: 'm',
        timestamp: new Date().toISOString()
      });
    }
    
    // Reset for next measurement
    this.points = [];
  }

  /**
   * Create a text label sprite
   */
  createTextLabel(text, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Background
    context.fillStyle = 'rgba(15, 23, 42, 0.9)';
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();
    
    // Border
    context.strokeStyle = '#3b82f6';
    context.lineWidth = 2;
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.stroke();
    
    // Text
    context.font = 'bold 28px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 0.1; // Slightly above the line
    sprite.scale.set(0.3, 0.075, 1);
    
    return sprite;
  }

  /**
   * Clear all measurements
   */
  clearAll() {
    // Remove markers
    this.markers.forEach(marker => {
      this.scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    });
    this.markers = [];
    
    // Remove lines
    this.lines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.lines = [];
    
    // Remove labels
    this.labels.forEach(label => {
      this.scene.remove(label);
      if (label.material.map) label.material.map.dispose();
      label.material.dispose();
    });
    this.labels = [];
    
    // Reset points
    this.points = [];
    
    console.log('[MeasureTool] All measurements cleared');
  }

  /**
   * Get all measurements
   */
  getMeasurements() {
    return this.lines.map((line, i) => {
      const positions = line.geometry.attributes.position.array;
      const point1 = new THREE.Vector3(positions[0], positions[1], positions[2]);
      const point2 = new THREE.Vector3(positions[3], positions[4], positions[5]);
      return {
        index: i,
        distance: point1.distanceTo(point2),
        unit: 'm'
      };
    });
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.deactivate();
    this.clearAll();
    this.markerMaterial.dispose();
    this.lineMaterial.dispose();
  }
}

export default MeasureTool;
