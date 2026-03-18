# Real Analytics Data Tracking Implementation

## Overview
Enhanced the analytics system to track real data with timestamps, file types, views, and total scans. Implemented thumbnail support and real-time data synchronization between frontend and backend.

---

## Changes Made

### 1. **Backend: Enhanced Upload Route** (`backend/routes/upload.js`)

**New fields added to model data:**
- `fileType` - File format (GLB, GLTF, PLY, etc.)
- `fileSize` - Size in bytes
- `fileSizeMB` - Size in megabytes (calculated)
- `uploadedAtTimestamp` - Unix timestamp for sorting
- `thumbnail` - Path to thumbnail image
- `uploadedBy` - User who uploaded the model
- `uploadStatus` - Current upload status
- `viewTimestamps` - Array of view timestamps
- `scanTimestamps` - Array of scan metadata
- `totalScans` - Total scan count
- `lastViewedAt` - Last view timestamp
- `lastScanAt` - Last scan timestamp

**Response includes analytics data:**
```json
{
  "analytics": {
    "fileType": "GLB",
    "fileSize": 1024000,
    "fileSizeMB": "1.00",
    "uploadedAt": "2025-12-17T11:48:45.804Z",
    "uploadDuration": "calculated-by-frontend"
  }
}
```

---

### 2. **Backend: Enhanced View Tracking** (`backend/routes/models.js`)

**POST `/api/models/:id/views`**
- Now tracks timestamp for each view
- Keeps last 100 view timestamps
- Updates `lastViewedAt` field
- Returns view count and timestamp

**Response:**
```json
{
  "success": true,
  "message": "View count updated",
  "views": 42,
  "lastViewedAt": "2025-12-17T14:30:22.123Z"
}
```

---

### 3. **Backend: New Scan Tracking Endpoint**

**POST `/api/models/:id/scans`**
- Records scan completion with metadata
- Tracks duration and scan type (standard/detailed)
- Stores last 50 scan records
- Updates `totalScans` counter
- Updates `lastScanAt` timestamp

**Request Body:**
```json
{
  "duration": 5000,
  "scanType": "detailed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scan recorded successfully",
  "totalScans": 23,
  "lastScanAt": "2025-12-17T14:32:10.456Z"
}
```

---

### 4. **Backend: Enhanced Analytics Stats Endpoint**

**GET `/api/models/stats/summary`**

Returns comprehensive real analytics with:
- **Total metrics**: Models, views, scans, engagement
- **Average metrics**: Views per model, scans per model
- **File type breakdown**: Count, size, views, scans per format
- **Property type breakdown**: Count, views, scans per type
- **Top models**: 5 models with highest views
- **Recent uploads**: 5 most recent uploads with details

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-17T14:35:00.000Z",
    "totalModels": 15,
    "totalViews": 342,
    "totalScans": 87,
    "averageViews": "22.8",
    "averageScans": "5.8",
    "avgEngagement": "72.5",
    "fileTypeStats": {
      "GLB": {
        "count": 10,
        "totalSize": 25600000,
        "totalViews": 250,
        "totalScans": 65
      },
      "GLTF": {
        "count": 5,
        "totalSize": 15000000,
        "totalViews": 92,
        "totalScans": 22
      }
    },
    "propertyTypeStats": {
      "Residential": {
        "count": 8,
        "totalViews": 180,
        "totalScans": 45
      },
      "Commercial": {
        "count": 7,
        "totalViews": 162,
        "totalScans": 42
      }
    },
    "topModels": [
      {
        "id": "model-001",
        "title": "Modern Office",
        "views": 56,
        "scans": 15,
        "engagement": 85
      }
    ],
    "recentUploads": [
      {
        "id": "model-001",
        "title": "Modern Office",
        "uploadedAt": "2025-12-17T14:00:00.000Z",
        "fileType": "GLB",
        "fileSize": "2.5",
        "views": 8,
        "scans": 2
      }
    ]
  }
}
```

---

### 5. **Frontend: Enhanced Analytics Service** (`src/services/analyticsService.js`)

**New Functions:**

#### `fetchRealAnalytics()`
Fetches real analytics data from backend
```javascript
const data = await fetchRealAnalytics();
```

#### `trackScanCompletion(modelId, duration, scanType)`
Records scan completion with duration and type
```javascript
await trackScanCompletion('model-123', 5000, 'detailed');
```

#### `trackModelViewReal(modelId)`
Tracks model views in backend
```javascript
await trackModelViewReal('model-123');
```

#### `getDashboardAnalytics()`
Returns formatted analytics data for dashboard display
```javascript
const dashboardData = await getDashboardAnalytics();
```

#### `exportRealAnalyticsData()`
Exports real analytics data for reporting
```javascript
const exportData = await exportRealAnalyticsData();
```

---

### 6. **Frontend: Updated Dashboard Component** (`src/components/features/Analytics/Dashboard.jsx`)

**Enhancements:**
- Fetches real data from backend on mount
- Auto-refreshes every 30 seconds for real-time updates
- Displays actual file type breakdown with counts
- Shows recent uploads with file types and sizes
- Real-time metrics: total views, scans, engagement
- Top models based on actual view data
- Property type statistics

**Data Flow:**
```
Backend API → fetchRealAnalytics() → Dashboard State → Display Components
                                  ↓ (every 30s)
                              Auto-refresh
```

---

### 7. **Frontend: Updated Model Viewer** (`src/components/features/Viewer/ModelViewer.jsx`)

**New Tracking:**
- Calls `trackModelViewReal()` when opening a model
- Records scan completion with `trackScanCompletion()` when closing
- Determines scan type based on interaction count
  - `detailed` scan: 5+ interactions
  - `standard` scan: <5 interactions

**Flow:**
```
Model Opened → trackModelViewReal(id) → Backend records view
    ↓
Model Viewed with Interactions
    ↓
Model Closed → trackScanCompletion(id, duration, type) → Backend records scan
```

---

## Data Model Changes

### Model Document Structure

**Before:**
```json
{
  "id": "uuid",
  "title": "Model",
  "modelFile": "filename",
  "uploadedAt": "ISO-date",
  "views": 0,
  "engagementScore": 0
}
```

**After:**
```json
{
  "id": "uuid",
  "title": "Model",
  "modelFile": "filename",
  
  "fileType": "GLB",
  "fileSize": 1024000,
  "fileSizeMB": "1.00",
  
  "uploadedAt": "2025-12-17T11:48:45.804Z",
  "uploadedAtTimestamp": 1765972125804,
  "uploadedBy": "user-id",
  "uploadStatus": "completed",
  
  "views": 0,
  "viewTimestamps": [],
  "lastViewedAt": null,
  
  "totalScans": 0,
  "scanTimestamps": [],
  "lastScanAt": null,
  
  "thumbnail": "/uploads/thumbnails/model-id_thumb.png",
  "engagementScore": 0
}
```

---

## Analytics Workflow

### 1. **Upload Flow**
```
User uploads file
    ↓
Backend calculates file type, size
    ↓
Store in models.json with metadata
    ↓
Return analytics data to frontend
    ↓
Frontend displays file info
```

### 2. **View Tracking Flow**
```
User opens model in viewer
    ↓
frontend → POST /api/models/:id/views
    ↓
Backend increments views, records timestamp
    ↓
Frontend updates local state
```

### 3. **Scan Tracking Flow**
```
User closes model viewer
    ↓
Frontend calculates duration & interaction count
    ↓
Frontend → POST /api/models/:id/scans with metadata
    ↓
Backend records scan with timestamp
    ↓
Updates totalScans counter
```

### 4. **Analytics Display Flow**
```
Dashboard mounts
    ↓
Fetches GET /api/models/stats/summary
    ↓
Receives real data with all metrics
    ↓
Displays in widgets, charts, tables
    ↓
Auto-refreshes every 30 seconds
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/api/upload` | Upload 3D model | Model data + analytics |
| GET | `/api/models` | List all models | Models array |
| GET | `/api/models/:id` | Get specific model | Single model with stats |
| POST | `/api/models/:id/views` | Track view | View count + timestamp |
| POST | `/api/models/:id/scans` | Record scan | Scan count + timestamp |
| GET | `/api/models/stats/summary` | Get analytics | Real-time statistics |

---

## Frontend-Backend Communication

### Real-Time Analytics Updates
- Dashboard automatically fetches latest stats every 30 seconds
- View and scan data syncs to backend immediately
- File type and size tracked at upload time
- Timestamp data preserved for historical analysis

### Data Persistence
- Backend stores all data in `models.json`
- Maintains view timestamps (last 100)
- Maintains scan records (last 50)
- Aggregates statistics on-the-fly

---

## Usage Examples

### Track a View
```javascript
import { trackModelViewReal } from './services/analyticsService';

// When opening a model
await trackModelViewReal('model-uuid');
```

### Track a Scan
```javascript
import { trackScanCompletion } from './services/analyticsService';

// When closing a model after viewing
await trackScanCompletion('model-uuid', 5000, 'detailed');
```

### Get Dashboard Analytics
```javascript
import { getDashboardAnalytics } from './services/analyticsService';

// In Dashboard component
const data = await getDashboardAnalytics();
// Returns: {
//   totalModels, totalViews, totalScans,
//   topModels, recentUploads, fileTypeStats
// }
```

### Export Analytics
```javascript
import { exportRealAnalyticsData } from './services/analyticsService';

const exportData = await exportRealAnalyticsData();
// Contains full analytics snapshot with timestamp
```

---

## Benefits

✅ **Real Data Tracking** - All metrics are actual user interactions
✅ **Detailed Timestamps** - Every action is timestamped for analysis
✅ **File Information** - Track file types and sizes for storage insights
✅ **Scan Quality** - Determine scan type based on user interaction
✅ **Real-Time Updates** - Dashboard updates automatically
✅ **Historical Data** - Keep records of last 100 views and 50 scans
✅ **Comprehensive Statistics** - File type, property type, top models breakdown
✅ **Thumbnail Support** - Ready for thumbnail generation and display

---

## Next Steps (Optional Enhancements)

1. **Thumbnail Generation**
   - Extract thumbnails from GLB files using Three.js
   - Generate PNG files on upload
   - Store in `/uploads/thumbnails/`

2. **Advanced Filtering**
   - Filter analytics by date range
   - Filter by file type, property type
   - User-specific analytics

3. **Export Options**
   - Export analytics to CSV/Excel
   - Generate PDF reports
   - Schedule automated reports

4. **Performance Optimization**
   - Move to database (MongoDB/PostgreSQL)
   - Implement pagination for large datasets
   - Add caching layer

5. **Mobile Support**
   - Responsive analytics dashboard
   - Mobile-friendly charts and tables
   - Touch-optimized controls

---

## Configuration

No additional configuration needed. The system works with existing setup:

- Backend runs on: `http://localhost:5000`
- API prefix: `/api`
- Frontend fetches from: `process.env.REACT_APP_API_URL`
- Auto-refresh interval: 30 seconds (configurable)

---

## Testing the Implementation

### 1. Upload a Model
```
POST /api/upload with file
Check models.json for fileType, fileSize fields
```

### 2. View the Model
```
Open model in viewer
Check backend logs for view recorded
```

### 3. Close and Check Stats
```
Close model viewer
Check backend for scan recorded
Visit dashboard to see updated stats
```

### 4. Check Analytics Endpoint
```
GET /api/models/stats/summary
Verify real data is being aggregated
```

---

## Troubleshooting

**Issue: Views not being tracked**
- Check if `trackModelViewReal()` is being called
- Verify backend is running on correct port
- Check browser console for fetch errors

**Issue: Scans not recorded**
- Ensure `trackScanCompletion()` is called on model close
- Check network requests in DevTools
- Verify models.json is writable

**Issue: Analytics showing old data**
- Click refresh button on dashboard
- Clear browser cache
- Restart backend server

---

