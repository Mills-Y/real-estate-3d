/**
 * Mock 3D model data for testing and development
 */

export const mockModels = [
  {
    id: 'model-001',
    name: 'Modern Office Space',
    url: '/models/office-space.glb',
    type: 'gltf',
    fileSize: 2.4,
    vertices: 125000,
    polygons: 62500,
    createdAt: new Date('2025-01-10'),
    scanDate: new Date('2025-01-10'),
  },
  {
    id: 'model-002',
    name: 'Residential Villa',
    url: '/models/villa.ply',
    type: 'ply',
    fileSize: 3.8,
    vertices: 245000,
    polygons: 122500,
    createdAt: new Date('2025-01-08'),
    scanDate: new Date('2025-01-08'),
  },
  {
    id: 'model-003',
    name: 'Commercial Building',
    url: '/models/building.gltf',
    type: 'gltf',
    fileSize: 5.2,
    vertices: 350000,
    polygons: 175000,
    createdAt: new Date('2025-01-05'),
    scanDate: new Date('2025-01-05'),
  },
];

export const getModelById = (id) => mockModels.find((m) => m.id === id);

export const getModelsByType = (type) => mockModels.filter((m) => m.type === type);
