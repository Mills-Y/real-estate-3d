# Local Storage Configuration

Your Real Estate 3D Scanner is configured to use **100% local storage** on your PC. No cloud services.

## Storage Locations

### 1. **Uploaded 3D Models** (Backend)
- **Location**: `backend/uploads/models/`
- **Stored on**: Your local PC
- **Max File Size**: 100 MB per file
- **File Types**: `.glb`, `.gltf`, `.ply`, `.obj`, `.fbx`
- **Metadata**: `backend/data/models.json` (JSON database)

### 2. **App Data** (Browser)
- **Type**: Browser `localStorage` (IndexedDB abstraction)
- **Stored on**: Your browser's local storage
- **Contents**: User preferences, analytics, session data
- **Limit**: ~5-10 MB per domain

### 3. **Build Assets**
- **Location**: `build/` folder
- **Contents**: Compiled frontend code (HTML, CSS, JS)

## Environment Configuration

### Frontend (.env)
```
REACT_APP_USE_LOCAL_STORAGE=true
REACT_APP_STORAGE_TYPE=file
MAX_FILE_SIZE=104857600  # 100 MB in bytes
```

### Backend (.env)
```
PORT=5000
UPLOAD_DIR=./uploads/models
MAX_FILE_SIZE=100000000  # 100 MB
```

## Starting Your App

### Terminal 1 - Start Backend
```powershell
cd backend
npm install  # First time only
npm start
```

### Terminal 2 - Start Frontend
```powershell
npm install  # First time only
npm start
```

The app will open at `http://localhost:3000`

## File Storage Structure

```
real-estate-3d-main/
├── backend/
│   └── uploads/
│       └── models/           ← Your 3D model files stored here
│   └── data/
│       └── models.json       ← Model metadata database
└── src/                      ← Frontend source code
```

## Features Using Local Storage

1. **Model Uploads**: Files saved to `backend/uploads/models/`
2. **Model Database**: JSON file at `backend/data/models.json`
3. **Analytics**: Stored in browser localStorage
4. **User Sessions**: Stored in browser localStorage
5. **Gallery**: Reads from local models.json

## Switching to Cloud (If Needed Later)

To add cloud storage later:
1. Install cloud SDK (AWS S3, Azure Blob, Google Cloud)
2. Update `backend/routes/upload.js` to use cloud storage
3. Update storage service URLs
4. Add cloud credentials to `.env`

## Data Persistence

- **Models**: Persist across app restarts (files on disk)
- **App Data**: Persist across browser sessions (localStorage)
- **All data stays on your PC** - No external cloud service

## Troubleshooting

**Models not appearing after upload?**
- Check that `backend/uploads/models/` directory exists
- Verify `backend/data/models.json` has entries

**Storage full?**
- Delete old models from `backend/uploads/models/`
- Clear browser localStorage: DevTools → Application → Clear Site Data

**File size limit exceeded?**
- Increase `MAX_FILE_SIZE` in both `.env` files (in bytes)
- 1 GB = 1000000000 bytes

---

**Your data is 100% local and private on your PC!**
