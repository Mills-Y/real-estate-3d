# Analytics Data Flow Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REAL ESTATE 3D APP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FRONTEND (React)                 BACKEND (Express)              │
│  ─────────────────                ─────────────────              │
│                                                                   │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │   Upload Component   │        │   Upload Route       │       │
│  │                      │──POST──▶│  (POST /api/upload)  │       │
│  │  - Select File       │/upload  │                      │       │
│  │  - Add Metadata      │         │  - Extract FileType  │       │
│  │  - Show Progress     │         │  - Calculate Size    │       │
│  └──────────────────────┘         │  - Store Metadata    │       │
│           │                       │  - Return Analytics  │       │
│           │                       └──────────────────────┘       │
│           │                              │                       │
│           └──────────────────────────────┴──────────────────────▶ models.json │
│                                                                   │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │  Model Viewer        │        │   Models Route       │       │
│  │                      │──POST──▶│ (POST /api/models/:id/views)│
│  │  - Open Model        │/views   │                      │       │
│  │  - Track Interaction │         │  - Increment Views   │       │
│  │  - Record Duration   │         │  - Record Timestamp  │       │
│  │  - Record Scan       │         │  - Update lastViewed │       │
│  │  - Close Model       │         └──────────────────────┘       │
│  └──────────────────────┘                │                       │
│           │                              │                       │
│           │ trackModelViewReal()          │                       │
│           │ trackScanCompletion()         │                       │
│           │                    ┌──────────┘                       │
│           │                    │                                  │
│           │                    ▼                                  │
│           │         ┌──────────────────────┐                     │
│           │         │  Scans Endpoint      │                     │
│           │         │ (POST /api/models/:id/scans)              │
│           │         │                      │                     │
│           │         │  - Record Duration   │                     │
│           │         │  - Record Type       │                     │
│           │         │  - Track Timestamp   │                     │
│           │         │  - Update Counters   │                     │
│           │         └──────────────────────┘                     │
│           │                    │                                  │
│           │                    └──────────────────────────────────▶ models.json │
│           │                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │  Analytics Dashboard │        │  Stats Summary Route │       │
│  │                      │──GET───▶│ (GET /api/models/    │       │
│  │  - Display Metrics   │/summary │  stats/summary)      │       │
│  │  - Show Top Models   │         │                      │       │
│  │  - File Type Stats   │         │  - Calculate Totals  │       │
│  │  - Recent Uploads    │         │  - Aggregate Data    │       │
│  │  - Auto-Refresh 30s  │         │  - Build Response    │       │
│  │  - Real-Time Updates │         │  - Return All Stats  │       │
│  └──────────────────────┘         └──────────────────────┘       │
│           ▲                              ▲                       │
│           │                              │                       │
│           └──────────────────────────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │   models.json   │
                      │                 │
                      │  [              │
                      │    {            │
                      │      id: "...",  │
                      │      title: "...",│
                      │      fileType: "GLB",
                      │      fileSize: 1024000,
                      │      uploadedAt: "ISO-date",
                      │      views: 42,
                      │      viewTimestamps: [...],
                      │      totalScans: 23,
                      │      scanTimestamps: [{...}],
                      │      ...
                      │    }
                      │  ]
                      └─────────────────┘
```

---

## Data Flow: Upload Sequence

```
User Clicks Upload
    │
    ▼
┌─────────────────────────────────┐
│ Frontend: Select File            │
│ - Validate extension             │
│ - Check file size                │
│ - Add metadata (title, address)  │
└─────────────────────────────────┘
    │
    ▼
POST /api/upload (with form data)
    │
    ▼
┌─────────────────────────────────┐
│ Backend: Upload Handler          │
│ - Receive file                   │
│ - Extract fileName               │
│ - Get fileSize (bytes)           │
│ - Get fileType from extension    │
│ - Generate UUID                  │
│ - Create thumbnail path          │
│ - Build model object             │
│ - Add to models.json             │
└─────────────────────────────────┘
    │
    ▼
Return JSON Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileType": "GLB",
    "fileSize": 1024000,
    "fileSizeMB": "1.00",
    "uploadedAt": "2025-12-17T11:48:45.804Z",
    ...
  },
  "analytics": {
    "fileType": "GLB",
    "fileSize": 1024000,
    "fileSizeMB": "1.00"
  }
}
    │
    ▼
┌─────────────────────────────────┐
│ Frontend: Handle Response        │
│ - Update UI                      │
│ - Display file info              │
│ - Show analytics                 │
│ - Close upload modal             │
└─────────────────────────────────┘
    │
    ▼
File Available in Gallery with Metadata
```

---

## Data Flow: View Tracking Sequence

```
User Opens Model in Gallery
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: ModelViewer Mount      │
│ - Reset duration timer           │
│ - Reset interaction counter      │
│ - Call trackModelViewReal(id)    │
└──────────────────────────────────┘
    │
    ▼
POST /api/models/:id/views
    │
    ▼
┌──────────────────────────────────┐
│ Backend: View Handler            │
│ - Increment views counter        │
│ - Record current timestamp       │
│ - Add to viewTimestamps array    │
│ - Trim to last 100 timestamps    │
│ - Update lastViewedAt            │
│ - Write to models.json           │
└──────────────────────────────────┘
    │
    ▼
Return Response:
{
  "success": true,
  "views": 42,
  "lastViewedAt": "2025-12-17T14:30:22.123Z"
}
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: View Tracked           │
│ - Local state updated            │
│ - Display shown in UI            │
│ - User interacts with model      │
└──────────────────────────────────┘
```

---

## Data Flow: Scan Tracking Sequence

```
User Closes Model Viewer
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: ModelViewer Unmount    │
│ - Calculate duration (ms)        │
│ - Get interaction count          │
│ - Determine scan type:           │
│   - if interactions >= 5         │
│     then "detailed"              │
│     else "standard"              │
│ - Call trackScanCompletion()    │
└──────────────────────────────────┘
    │
    ▼
POST /api/models/:id/scans
Body: {
  "duration": 5000,
  "scanType": "detailed"
}
    │
    ▼
┌──────────────────────────────────┐
│ Backend: Scan Handler            │
│ - Increment totalScans counter   │
│ - Record scan object:            │
│   {                              │
│     timestamp: "ISO-date",       │
│     duration: 5000,              │
│     type: "detailed"             │
│   }                              │
│ - Add to scanTimestamps array    │
│ - Trim to last 50 scans          │
│ - Update lastScanAt              │
│ - Write to models.json           │
└──────────────────────────────────┘
    │
    ▼
Return Response:
{
  "success": true,
  "totalScans": 23,
  "lastScanAt": "2025-12-17T14:32:10.456Z"
}
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: Scan Recorded          │
│ - Tracked event created          │
│ - Analytics logged               │
│ - Backend verified               │
└──────────────────────────────────┘
```

---

## Data Flow: Analytics Dashboard Sequence

```
User Opens Dashboard
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: Dashboard Mount        │
│ - Call fetchRealAnalytics()     │
│ - Set auto-refresh interval (30s)│
└──────────────────────────────────┘
    │
    ▼
GET /api/models/stats/summary
    │
    ▼
┌──────────────────────────────────┐
│ Backend: Stats Calculator        │
│ 1. Load models.json              │
│ 2. Iterate all models:           │
│    - Sum views                   │
│    - Sum scans                   │
│    - Average engagement          │
│    - Count by file type          │
│    - Count by property type      │
│ 3. Identify top 5 models         │
│ 4. Get recent 5 uploads          │
│ 5. Calculate averages            │
│ 6. Build response object         │
└──────────────────────────────────┘
    │
    ▼
Return Response:
{
  "success": true,
  "data": {
    "totalModels": 15,
    "totalViews": 342,
    "totalScans": 87,
    "averageViews": "22.8",
    "averageScans": "5.8",
    "avgEngagement": "72.5",
    "fileTypeStats": {
      "GLB": {...},
      "GLTF": {...}
    },
    "propertyTypeStats": {
      "Residential": {...},
      "Commercial": {...}
    },
    "topModels": [{...}, ...],
    "recentUploads": [{...}, ...]
  }
}
    │
    ▼
┌──────────────────────────────────┐
│ Frontend: Dashboard Display      │
│ - MetricsGrid shows totals       │
│ - TopModels table populated      │
│ - FileTypeStats visualized       │
│ - RecentUploads listed           │
│ - Charts updated                 │
└──────────────────────────────────┘
    │
    ▼
Refresh Every 30 Seconds
    │
    ├─────────────────────────────┐
    │ GET /api/models/stats/summary│
    │         │                    │
    │         ▼                    │
    │    Update UI with             │
    │    fresh data                 │
    │                               │
    └─────────────────────────────┘
         (repeats)
```

---

## Data Persistence

```
┌────────────────────────────────────────┐
│         models.json Structure          │
├────────────────────────────────────────┤
│                                        │
│  [                                     │
│    {                                   │
│      "id": "uuid",                     │
│      "title": "Model Name",            │
│      "description": "...",             │
│      "address": "...",                 │
│      "price": 0,                       │
│      "type": "Residential",            │
│                                        │
│      ► UPLOAD ANALYTICS:               │
│      "fileType": "GLB",                │
│      "fileSize": 1024000,              │
│      "fileSizeMB": "1.00",             │
│      "uploadedAt": "ISO-date",         │
│      "uploadedAtTimestamp": 1765972...,│
│      "uploadedBy": "user-id",          │
│      "uploadStatus": "completed",      │
│      "thumbnail": "/path/thumb.png",   │
│                                        │
│      ► VIEW ANALYTICS:                 │
│      "views": 42,                      │
│      "viewTimestamps": [               │
│        "2025-12-17T14:30:22.123Z",     │
│        "2025-12-17T14:35:15.456Z",     │
│        ...                             │
│      ],                                │
│      "lastViewedAt": "ISO-date",       │
│                                        │
│      ► SCAN ANALYTICS:                 │
│      "totalScans": 23,                 │
│      "scanTimestamps": [               │
│        {                               │
│          "timestamp": "ISO-date",      │
│          "duration": 5000,             │
│          "type": "detailed"            │
│        },                              │
│        ...                             │
│      ],                                │
│      "lastScanAt": "ISO-date",         │
│                                        │
│      ► OTHER FIELDS:                   │
│      "engagementScore": 72,            │
│      ...                               │
│    },                                  │
│    {...},                              │
│    ...                                 │
│  ]                                     │
│                                        │
└────────────────────────────────────────┘
```

---

## API Response Examples

### Upload Response
```json
{
  "success": true,
  "message": "Model uploaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Modern Office",
    "fileType": "GLB",
    "fileSize": 2560000,
    "fileSizeMB": "2.44",
    "uploadedAt": "2025-12-17T11:48:45.804Z",
    "uploadedAtTimestamp": 1765972125804,
    "uploadedBy": "user-123",
    "views": 0,
    "totalScans": 0,
    "thumbnail": "/uploads/thumbnails/550e8400-e29b-41d4-a716-446655440000_thumb.png"
  },
  "analytics": {
    "fileType": "GLB",
    "fileSize": 2560000,
    "fileSizeMB": "2.44",
    "uploadedAt": "2025-12-17T11:48:45.804Z"
  }
}
```

### View Track Response
```json
{
  "success": true,
  "message": "View count updated",
  "views": 42,
  "lastViewedAt": "2025-12-17T14:30:22.123Z"
}
```

### Scan Record Response
```json
{
  "success": true,
  "message": "Scan recorded successfully",
  "totalScans": 23,
  "lastScanAt": "2025-12-17T14:32:10.456Z"
}
```

### Stats Summary Response
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
      }
    },
    "topModels": [
      {
        "id": "uuid",
        "title": "Modern Office",
        "views": 56,
        "scans": 15,
        "engagement": 85
      }
    ],
    "recentUploads": [
      {
        "id": "uuid",
        "title": "Modern Office",
        "uploadedAt": "2025-12-17T14:00:00.000Z",
        "fileType": "GLB",
        "fileSize": "2.44",
        "views": 8,
        "scans": 2
      }
    ]
  }
}
```

---

## Summary

✅ All user interactions are tracked in real-time
✅ Data is persisted to backend (models.json)
✅ Dashboard shows real metrics
✅ Auto-refresh keeps data current
✅ File types and sizes are recorded
✅ View and scan timestamps captured
✅ Scan type determined by interaction level
✅ Ready for thumbnail generation

