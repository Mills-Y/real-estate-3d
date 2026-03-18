# Real Estate 3D Scanner - Complete Setup Guide

Complete instructions for setting up and running the full Real Estate 3D Scanner application (frontend + backend + analytics).

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** (optional)
- A code editor (VS Code recommended)
- ~500MB disk space

## 📁 Project Structure

```
real-estate-3d-main/
├── src/                          # React frontend source code
│   ├── components/               # React components
│   ├── services/                 # API & analytics services
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── App.js                    # Main app component
│   └── index.js                  # Entry point
├── public/                       # Static files
├── backend/                      # Express API server
│   ├── routes/                   # API route handlers
│   ├── middleware/               # Multer config
│   ├── uploads/models/           # Uploaded 3D files
│   ├── data/models.json          # Database
│   ├── server.js                 # Main server
│   ├── package.json              # Dependencies
│   └── .env                      # Config
├── package.json                  # Frontend dependencies
├── .env                          # Frontend config
└── README.md                     # Project info
```

## 🚀 Installation & Setup

### Step 1: Install Frontend Dependencies

```bash
# Navigate to project root
cd real-estate-3d-main

# Install npm packages
npm install
```

**Expected time:** 2-5 minutes

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install npm packages
npm install

# Return to project root
cd ..
```

**Expected time:** 2-5 minutes

### Step 3: Configure Environment Variables

**Frontend (.env)**
```bash
# In project root, create or update .env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development
REACT_APP_ENABLE_ANALYTICS=true
```

**Backend (backend/.env)**
```bash
# In backend directory, create or update .env
PORT=5000
NODE_ENV=development
HOST=localhost
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=100000000
UPLOAD_DIR=./uploads/models
API_PREFIX=/api
LOG_LEVEL=info
```

## 🎯 Running the Application

### Option 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║     Real Estate 3D Scanner Backend API                    ║
║  📍 Server running on: http://localhost:5000              ║
║  🌍 CORS enabled for: http://localhost:3000
║  🔧 Environment: development
║  📚 API Docs: http://localhost:5000/api
║  ❤️  Health Check: http://localhost:5000/health
║  Ready to receive 3D models! 🚀                          ║
╚════════════════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend Application:**
```bash
# From project root
npm start
```

Expected output:
```
Compiled successfully!

You can now view real-estate-3d in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Option 2: Single Terminal with npm-run-all

```bash
# Install globally or locally
npm install --save-dev npm-run-all

# Add to package.json scripts:
"dev": "npm-run-all --parallel dev:backend dev:frontend",
"dev:backend": "cd backend && npm run dev",
"dev:frontend": "react-scripts start"

# Then run:
npm run dev
```

## ✅ Verify Installation

### 1. Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2024-12-17T10:30:00.000Z"
}
```

### 2. Frontend Loading
Visit `http://localhost:3000` in your browser. You should see:
- Real Estate 3D Scanner header
- Property gallery with sample properties
- Analytics Dashboard (if accessible)

### 3. API Endpoints Test
```bash
curl http://localhost:5000/api
```

Expected response:
```json
{
  "success": true,
  "message": "Real Estate 3D Scanner API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

## 🧪 Testing Features

### Test 1: View Properties
1. Open frontend at `http://localhost:3000`
2. Scroll through property gallery
3. Click "View 3D" on any property
4. Expected: 3D model viewer loads

### Test 2: Check Analytics Tracking
1. Open browser DevTools (F12)
2. Go to Console tab
3. Interact with 3D model (rotate, zoom, pan)
4. Watch for console logs with 📊 emoji:
   ```
   📊 Analytics: Started viewing Modern Beach House
   📊 Analytics: Rotate interaction - count: 1
   ```

### Test 3: Access Analytics Dashboard
1. Look for "Analytics" link in app header
2. Click to open Dashboard
3. Check if metrics load (may show "No data yet" on first visit)
4. Click "Refresh" to load real data

### Test 4: Test Upload Feature (if implemented)
1. Find upload section in app
2. Select a `.glb`, `.gltf`, or `.ply` file
3. Fill in property details (title, address, etc.)
4. Click upload button
5. Monitor progress bar
6. Expected: File uploaded successfully

### Test 5: Check Storage API
In browser Console, type:
```javascript
window.storage.get('analyticsBuffer')
```

Expected: Array of tracked events

## 📊 Database Management

### View Models Database
```bash
cat backend/data/models.json
```

### Clear Database
```bash
# Clear all models (keep structure)
echo '[]' > backend/data/models.json

# Or delete and let it regenerate
rm backend/data/models.json
```

### Clear Uploaded Files
```bash
# Remove all uploaded models
rm -rf backend/uploads/models/*

# Recreate directory
mkdir -p backend/uploads/models
```

## 🔍 Troubleshooting

### Issue: "Port 5000 is already in use"

**Solution:** Change port in backend/.env
```env
PORT=5001
```

Then update frontend .env:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

### Issue: "CORS error" in console

**Solution:** Verify frontend URL matches CORS_ORIGIN in backend/.env
```env
CORS_ORIGIN=http://localhost:3000
```

### Issue: "Models not loading"

**Solution:** 
1. Check backend is running: `curl http://localhost:5000/api/models`
2. Check models.json exists: `ls backend/data/models.json`
3. Check API URL in frontend .env: `REACT_APP_API_URL=http://localhost:5000/api`

### Issue: "Upload fails"

**Solution:**
1. Check file format is supported (.glb, .gltf, .ply, .obj, .fbx)
2. Verify file size < 100MB (or update MAX_FILE_SIZE in backend/.env)
3. Ensure uploads/models directory exists: `mkdir -p backend/uploads/models`

### Issue: "Analytics not tracking"

**Solution:**
1. Check storage API initialized: `window.storage` exists in console
2. Check console for errors (F12)
3. Verify REACT_APP_ENABLE_ANALYTICS=true in frontend .env

## 📦 npm Scripts Reference

### Frontend (package.json)
```bash
npm start          # Start React dev server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # (don't use, permanent change)
```

### Backend (backend/package.json)
```bash
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run tests
```

## 🌐 API Quick Reference

### Common Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Check server status |
| `GET` | `/api` | View API documentation |
| `GET` | `/api/models` | List all models |
| `GET` | `/api/models/:id` | Get specific model |
| `POST` | `/api/upload` | Upload 3D file |
| `POST` | `/api/models/:id/views` | Track view |
| `GET` | `/api/models/stats/summary` | Get statistics |

See [backend/README.md](backend/README.md) for complete API documentation.

## 🔐 Security Notes for Development

- **CORS:** Currently set to `http://localhost:3000` for development
- **File Uploads:** Limited to 100MB by default
- **Database:** Using simple JSON file (replace with proper DB for production)
- **No Authentication:** Currently no login system (add for production)
- **No HTTPS:** Use HTTP in development (add HTTPS for production)

## 🚀 Production Deployment

### Before Deploying

- [ ] Build frontend: `npm run build`
- [ ] Test build: `npm start` (serves static build)
- [ ] Update CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Use production database (MongoDB, PostgreSQL, etc.)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure proper file storage (S3, Azure Blob, etc.)
- [ ] Add authentication & authorization
- [ ] Set up monitoring & logging
- [ ] Create backups strategy

### Deployment Platforms

**Frontend:**
- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

**Backend:**
- Heroku
- Railway
- Render
- AWS EC2
- Azure App Service
- DigitalOcean

## 📚 Documentation Files

- **[ANALYTICS_TRACKING.md](ANALYTICS_TRACKING.md)** - Analytics tracking details
- **[ENHANCED_ANALYTICS_SUMMARY.md](ENHANCED_ANALYTICS_SUMMARY.md)** - Analytics features overview
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)** - Integration guide

## 🆘 Getting Help

1. Check relevant documentation file
2. Review console errors (F12 in browser)
3. Check server terminal output
4. Verify .env configuration
5. Test endpoints with curl
6. Check network tab in browser DevTools

## 📝 Common Tasks

### Add a New Property
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@model.glb" \
  -F "title=My Property" \
  -F "address=123 Main St" \
  -F "type=Residential" \
  -F "price=500000"
```

### Update Property Details
```bash
curl -X PUT http://localhost:5000/api/models/MODEL_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "price": 550000
  }'
```

### Delete a Property
```bash
curl -X DELETE http://localhost:5000/api/models/MODEL_ID
```

### Export Analytics
1. Open Analytics Dashboard in browser
2. Click "CSV Report" or "JSON Report"
3. File downloads automatically

## ✨ Next Steps

1. **Upload Sample Models** - Add your own .glb/.gltf files
2. **Customize Styling** - Update CSS in src/components
3. **Extend Features** - Add more functionality as needed
4. **Set Up Production** - Deploy to cloud platform
5. **Add Authentication** - Implement user login system
6. **Database Migration** - Replace JSON with proper database
7. **CDN Setup** - Optimize file delivery

---

**Setup Complete!** 🎉

Your application is ready for development. Frontend running on `http://localhost:3000` and API on `http://localhost:5000`.

For questions or issues, refer to the documentation files or troubleshooting section above.

**Last Updated:** December 17, 2025  
**Version:** 1.0.0
