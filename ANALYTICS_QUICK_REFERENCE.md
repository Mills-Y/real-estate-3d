# Analytics Implementation - Quick Reference

## What Was Added

### Real Data Tracking
- ✅ **Upload Date/Time** - ISO timestamp + Unix timestamp
- ✅ **File Type** - Automatically detected (GLB, GLTF, PLY, etc.)
- ✅ **File Size** - In bytes and MB
- ✅ **View Count** - Tracked with timestamps
- ✅ **Total Scans** - Counted per model
- ✅ **Scan Duration** - Time spent viewing each model
- ✅ **Scan Type** - Detailed vs Standard based on interactions
- ✅ **Thumbnails** - Ready for generation (path stored)

---

## New API Endpoints

### 1. Track a View
```
POST /api/models/:id/views
Response: { views: 42, lastViewedAt: "2025-12-17T14:30:22.123Z" }
```

### 2. Record a Scan
```
POST /api/models/:id/scans
Body: { duration: 5000, scanType: "detailed" }
Response: { totalScans: 23, lastScanAt: "2025-12-17T14:32:10.456Z" }
```

### 3. Get Analytics Summary
```
GET /api/models/stats/summary
Response: {
  totalModels: 15,
  totalViews: 342,
  totalScans: 87,
  topModels: [...],
  recentUploads: [...],
  fileTypeStats: {...}
}
```

---

## New Frontend Functions

```javascript
// Track a view
import { trackModelViewReal } from './services/analyticsService';
await trackModelViewReal('model-id');

// Record a scan
import { trackScanCompletion } from './services/analyticsService';
await trackScanCompletion('model-id', 5000, 'detailed');

// Fetch dashboard data
import { getDashboardAnalytics } from './services/analyticsService';
const data = await getDashboardAnalytics();

// Export analytics
import { exportRealAnalyticsData } from './services/analyticsService';
const export = await exportRealAnalyticsData();
```

---

## Data Tracked Per Model

```json
{
  "fileType": "GLB",
  "fileSize": 1024000,
  "fileSizeMB": "1.00",
  "uploadedAt": "2025-12-17T11:48:45.804Z",
  "uploadedBy": "user-123",
  "uploadStatus": "completed",
  
  "views": 42,
  "viewTimestamps": ["2025-12-17T14:30:22.123Z", ...],
  "lastViewedAt": "2025-12-17T14:30:22.123Z",
  
  "totalScans": 23,
  "scanTimestamps": [
    {
      "timestamp": "2025-12-17T14:32:10.456Z",
      "duration": 5000,
      "type": "detailed"
    },
    ...
  ],
  "lastScanAt": "2025-12-17T14:32:10.456Z",
  
  "thumbnail": "/uploads/thumbnails/model-id_thumb.png"
}
```

---

## Dashboard Shows

- **Total Models** - Count of all uploaded models
- **Total Views** - Sum of all views across all models
- **Total Scans** - Sum of all scans completed
- **Average Engagement** - Calculated from interactions and duration
- **Top Models** - Ranked by views
- **Recent Uploads** - Latest 5 uploads with file info
- **File Type Breakdown** - Count, size, views, scans by type
- **Property Type Stats** - Count, views, scans by property type

---

## How It Works

### Upload
```
Upload File → Extract Type & Size → Store Metadata → Return Analytics
```

### View
```
Open Model → Send View to Backend → Record Timestamp → Display Count
```

### Scan
```
Close Model → Calculate Duration & Interactions → Record Scan → Update Counters
```

### Analytics
```
Dashboard Mounts → Fetch /api/models/stats/summary → Display Real Data → Refresh Every 30s
```

---

## Modified Files

| File | Changes |
|------|---------|
| `backend/routes/upload.js` | Added file type, size, metadata tracking |
| `backend/routes/models.js` | Enhanced views, added scans endpoint, stats endpoint |
| `src/services/analyticsService.js` | Added backend fetch functions |
| `src/components/features/Analytics/Dashboard.jsx` | Now uses real data from backend |
| `src/components/features/Viewer/ModelViewer.jsx` | Tracks views and scans in backend |

---

## Testing Checklist

- [ ] Upload a model → Check file type and size in models.json
- [ ] Open model in viewer → Check views tracked in backend
- [ ] Close model → Check scan recorded with duration
- [ ] Open Dashboard → See real metrics displayed
- [ ] Click Refresh → Verify data updates
- [ ] Check stats endpoint → Verify aggregated data
- [ ] View recent uploads → See file info displayed
- [ ] Check file type stats → Verify breakdown calculation

---

## Notes

- Views: Last 100 timestamps kept (older ones removed)
- Scans: Last 50 records kept (older ones removed)
- Thumbnail path is stored but generation not yet implemented
- Dashboard auto-refreshes every 30 seconds
- All timestamps are ISO format with timezone
- File size calculated in MB with 2 decimal places
- Scan type determined by interaction count (5+ = detailed)

---

## Future Enhancements

1. Generate actual thumbnails from GLB files
2. Move to database (currently JSON files)
3. Add date range filtering
4. Generate PDF analytics reports
5. Mobile-responsive dashboard
6. Export to CSV/Excel
7. Real-time notifications
8. User-specific analytics

---

