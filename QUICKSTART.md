# 🚀 Quick Start - Real Estate 3D Scanner

Get the application running in **5 minutes**.

## ⚡ Quick Setup

### 1. Install Dependencies (2 minutes)

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Start Both Servers (1 minute)

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
npm start
```

### 3. Open in Browser (1 minute)

Visit: **http://localhost:3000**

✅ **Done!** You should see the Real Estate 3D Scanner with:
- Property gallery
- 3D model viewer
- Analytics dashboard

---

## 🎮 Try It Out

### View a Property in 3D
1. Click "View 3D" on any property card
2. Rotate the model with mouse
3. Zoom with scroll wheel
4. Pan with middle mouse button

### Check Analytics
1. Click "Analytics" in header
2. View tracking metrics
3. See engagement scores
4. Try downloading CSV report

### Upload a Model (Optional)
1. Find upload section in app
2. Select a `.glb` or `.gltf` file
3. Fill in property details
4. Click upload

---

## 🔧 Environment Setup

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENABLE_ANALYTICS=true
```

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 What's Included

✅ **Frontend**
- React 3D viewer (Babylon.js)
- Property gallery with search
- Real-time analytics dashboard
- CSV/JSON export
- Heatmap visualization

✅ **Backend**
- Express API server
- File upload handling
- CRUD operations
- Statistics & analytics endpoints
- CORS enabled

✅ **Analytics**
- Real-time event tracking
- Engagement scoring
- Storage persistence
- Data export
- Dashboard visualization

---

## 🆘 Common Issues

### Port Already in Use?
```bash
# Change port in backend/.env
PORT=5001
```

### CORS Error?
Make sure `CORS_ORIGIN=http://localhost:3000` in backend/.env

### Models Not Loading?
Check if backend is running: 
```bash
curl http://localhost:5000/health
```

---

## 📚 Full Documentation

- **Setup Details:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Backend API:** [backend/README.md](backend/README.md)
- **Analytics:** [ANALYTICS_TRACKING.md](ANALYTICS_TRACKING.md)
- **Integration:** [FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)

---

## 💡 Tips

- **Auto-reload:** Backend uses nodemon, just save files to reload
- **Debug Analytics:** Open DevTools console to see tracking logs
- **Test API:** Use `curl` or Postman to test endpoints
- **Check Storage:** Type `window.storage.getSize()` in console

---

## 🎯 Next Steps

1. ✅ Get app running
2. 📤 Upload your first 3D model
3. 📊 View analytics
4. 🚀 Deploy to production
5. 🔐 Add authentication
6. 💾 Switch to real database

---

**Happy building! 🎉**

For more details, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

Last Updated: December 17, 2025
