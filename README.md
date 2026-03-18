# 🏠 Real Estate 3D Scanner

A complete real estate platform with 3D model viewing, real-time analytics, and file management capabilities.

## ⭐ Quick Start

**Get running in 5 minutes:**
→ Read [QUICKSTART.md](QUICKSTART.md)

```bash
# Install & run
npm install && cd backend && npm install && cd ..

# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
npm start
```

Visit: **http://localhost:3000**

## 📚 Documentation Index

| Document | Purpose | Time |
|----------|---------|------|
| **[QUICKSTART.md](QUICKSTART.md)** ⭐ | Get running fast | 5 min |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Complete setup | 20 min |
| **[backend/README.md](backend/README.md)** | API reference | Reference |
| **[FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)** | Connect frontend/backend | 30 min |
| **[ANALYTICS_TRACKING.md](ANALYTICS_TRACKING.md)** | Tracking details | Reference |
| **[ENHANCED_ANALYTICS_SUMMARY.md](ENHANCED_ANALYTICS_SUMMARY.md)** | Features overview | Reference |

## 🎯 Features

✅ **3D Model Viewer** - Interactive Babylon.js viewer
✅ **File Upload** - Support for GLB, GLTF, PLY, OBJ, FBX
✅ **Real-time Analytics** - Event tracking & engagement scoring
✅ **Dashboard** - Visual analytics with charts & heatmaps
✅ **Data Export** - CSV and JSON report downloads
✅ **Property Management** - CRUD operations for properties
✅ **REST API** - Production-ready Express backend
✅ **CORS Enabled** - Ready for cross-origin requests

## 🏗️ Architecture

```
Frontend (React)          Backend (Express)       Database
   ↓                          ↓                      ↓
- 3D Viewer          - API Routes          - JSON File
- Gallery            - File Upload         - Model Storage
- Analytics          - CRUD Ops            - Metadata
- Dashboard          - Middleware
```

## 🚀 Scripts

### Frontend
```bash
npm start      # Start development server (port 3000)
npm build      # Create production build
npm test       # Run tests
```

### Backend
```bash
cd backend
npm start      # Start server (port 5000)
npm run dev    # Start with auto-reload
```

## 📊 API Endpoints

```
GET     /api/models              List all models
GET     /api/models/:id          Get specific model
POST    /api/upload              Upload 3D file
PUT     /api/models/:id          Update metadata
DELETE  /api/models/:id          Delete model
POST    /api/models/:id/views    Track view
GET     /api/models/stats/summary Get statistics
```

Full reference: [backend/README.md](backend/README.md)

## 🔗 Integration

Connect frontend to backend:
→ See [FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)

## 📈 Analytics

- 11+ tracked events
- Real-time engagement scoring
- Heat map visualization
- CSV/JSON export
- Browser-based persistence

Details: [ANALYTICS_TRACKING.md](ANALYTICS_TRACKING.md)

## 🔒 Security

- CORS configured for frontend
- File type validation
- Input sanitization
- Error handling
- No sensitive data exposure

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change PORT in .env |
| CORS error | Check CORS_ORIGIN in backend/.env |
| Models won't load | Verify backend is running |
| Upload fails | Check file type & size |

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

## 📦 Tech Stack

- **Frontend:** React 18+, Babylon.js, Recharts, CSS3
- **Backend:** Node.js, Express 4.18+, Multer, UUID
- **Database:** JSON (development), ready for MongoDB
- **Analytics:** Window Storage API, custom tracking

## 🚢 Deployment

See [SETUP_GUIDE.md](SETUP_GUIDE.md#-production-deployment) for production checklist and deployment guides.

## 📚 Project Structure

```
real-estate-3d-main/
├── src/                    # React frontend
├── backend/               # Express API
├── public/                # Static assets
├── QUICKSTART.md          # 5-min setup
├── SETUP_GUIDE.md         # Full setup
├── ANALYTICS_TRACKING.md  # Tracking ref
└── ... (other docs)
```

## 🆘 Need Help?

1. Check relevant documentation file
2. Review console errors (F12)
3. Test endpoints with curl
4. Check .env configuration
5. See troubleshooting sections

## 📝 Available Scripts

In the project directory, you can run:

### `npm start`
Runs the frontend in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## 🎓 Getting Started

1. **New to this project?**
   → Start with [QUICKSTART.md](QUICKSTART.md)

2. **Setting up for development?**
   → Read [SETUP_GUIDE.md](SETUP_GUIDE.md)

3. **Want to understand the API?**
   → See [backend/README.md](backend/README.md)

4. **Need to integrate frontend & backend?**
   → Check [FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)

5. **Interested in analytics?**
   → Review [ANALYTICS_TRACKING.md](ANALYTICS_TRACKING.md)

## ✨ Version

**v1.0.0** - December 17, 2025

## 📄 Learn More

See documentation files for detailed information on:
- Installation & setup
- API endpoints
- Analytics tracking
- Frontend-backend integration
- Deployment strategies
- Troubleshooting

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
