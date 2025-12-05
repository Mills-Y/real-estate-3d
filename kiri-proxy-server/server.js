const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 3001;

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// Kiri Engine API base URL
const KIRI_API_BASE = 'https://api.kiriengine.app/api/v1';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kiri Proxy Server is running' });
});

// Upload images to Kiri Engine
app.post('/api/kiri/upload', upload.array('images', 300), async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    console.log(`Uploading ${req.files.length} images to Kiri Engine...`);

    // Create form data for Kiri API
    const formData = new FormData();
    
    // Add each image file
    req.files.forEach((file, index) => {
      formData.append('imagesFiles', file.buffer, {
        filename: file.originalname || `image_${index}.jpg`,
        contentType: file.mimetype || 'image/jpeg'
      });
    });

    // Add other parameters
    formData.append('modelQuality', req.body.modelQuality || '1');
    formData.append('textureQuality', req.body.textureQuality || '1');
    formData.append('fileFormat', req.body.fileFormat || 'OBJ');
    formData.append('isMask', req.body.isMask || '1');
    formData.append('textureSmoothing', req.body.textureSmoothing || '1');

    // Make request to Kiri Engine using axios
    const response = await axios.post(
      `${KIRI_API_BASE}/open/photo/image-upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000 // 5 minute timeout for large uploads
      }
    );

    console.log('Kiri upload response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Upload failed',
      details: error.response?.data || error.message
    });
  }
});

// Check model status - CORRECTED ENDPOINT
app.get('/api/kiri/status/:serialNumber', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    const { serialNumber } = req.params;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    console.log(`Checking status for model: ${serialNumber}`);

    // CORRECT ENDPOINT: /api/v1/open/model/getStatus with serialize as query param
    const response = await axios.get(
      `${KIRI_API_BASE}/open/model/getStatus`,
      {
        params: {
          serialize: serialNumber
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    console.log('Status response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Status check failed',
      details: error.response?.data || error.message
    });
  }
});

// Download model - CORRECTED ENDPOINT
app.get('/api/kiri/download/:serialNumber', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    const { serialNumber } = req.params;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    console.log(`Getting download URL for model: ${serialNumber}`);

    // CORRECT ENDPOINT: /api/v1/open/model/getModelUrl with serialize as query param
    const response = await axios.get(
      `${KIRI_API_BASE}/open/model/getModelUrl`,
      {
        params: {
          serialize: serialNumber
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    console.log('Download response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('Download error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Download failed',
      details: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Kiri Engine Proxy Server Running                 ║
║                                                            ║
║  Port: ${PORT}                                               ║
║  Health: http://localhost:${PORT}/health                     ║
║                                                            ║
║  Endpoints:                                                ║
║  POST /api/kiri/upload      - Upload images                ║
║  GET  /api/kiri/status/:id  - Check processing status      ║
║  GET  /api/kiri/download/:id - Get download URL            ║
║                                                            ║
║  Status Codes:                                             ║
║  -1: Uploading  |  0: Processing  |  1: Failed             ║
║   2: Successful |  3: Queuing     |  4: Expired            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
