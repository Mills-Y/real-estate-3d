# Kiri Engine Proxy Server

This proxy server solves the CORS issue when calling the Kiri Engine API from a browser.

## Setup

### 1. Install & Run the Proxy Server

```bash
cd proxy-server
npm install
npm start
```

The server will run on `http://localhost:3001`

### 2. Update Your React App

Open your `App.js` and make these changes:

#### A. Add the proxy URL constant (near the top of your component):

```javascript
const PROXY_URL = 'http://localhost:3001';
```

#### B. Update the `uploadToKiriEngine` function

Change this line:
```javascript
const uploadResponse = await fetch('https://api.kiriengine.app/api/v1/open/3dgs/image', {
```

To:
```javascript
const uploadResponse = await fetch(`${PROXY_URL}/api/kiri/upload`, {
```

And change `formData.append('imagesFiles', ...)` to `formData.append('images', ...)`

#### C. Update the `pollKiriStatus` function

Change:
```javascript
const response = await fetch(
  `https://api.kiriengine.app/api/v1/open/model/${serialNumber}`,
```

To:
```javascript
const response = await fetch(
  `${PROXY_URL}/api/kiri/status/${serialNumber}`,
```

#### D. Update the `downloadKiriModel` function

Change:
```javascript
const response = await fetch(
  `https://api.kiriengine.app/api/v1/open/model/${serialNumber}/download`,
```

To:
```javascript
const response = await fetch(
  `${PROXY_URL}/api/kiri/download/${serialNumber}`,
```

#### E. Fix the frame count (line ~449)

Change:
```javascript
const totalFrames = 15;
```

To:
```javascript
const totalFrames = 25;
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/kiri/upload` | POST | Upload images for 3D processing |
| `/api/kiri/status/:serialNumber` | GET | Check processing status |
| `/api/kiri/download/:serialNumber` | GET | Get download link for model |

## Running Both Servers

You'll need two terminal windows:

**Terminal 1 - Proxy Server:**
```bash
cd proxy-server
npm start
```

**Terminal 2 - React App:**
```bash
cd your-react-app
npm start
```

## Troubleshooting

- **"Missing API key"** - Make sure you've set your Kiri API key in the Settings modal
- **"No images provided"** - Capture at least 20 frames before uploading
- **CORS errors still appearing** - Make sure the proxy server is running on port 3001
