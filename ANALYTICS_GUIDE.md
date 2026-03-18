# Real Estate 3D Scanner - Enhanced with Analytics

A modern web application for scanning, uploading, and analyzing 3D real estate models with comprehensive analytics and engagement tracking.

## 🎯 Recent Enhancements

### Analytics Platform
The application now includes a complete analytics dashboard with:

- **Real-time Metrics**: Live user engagement and model statistics
- **Engagement Tracking**: Interaction metrics (rotations, zooms, pans)
- **Heatmap Visualization**: User interaction density mapping
- **Export Analytics**: Track model export formats and history
- **Engagement Trends**: Historical data and trend analysis

### Project Structure

```
src/
├── components/
│   ├── common/
│   │   └── Header.jsx              [ENHANCED] Analytics button added
│   ├── features/
│   │   ├── Analytics/              [NEW] Complete analytics dashboard
│   │   │   ├── Dashboard.jsx       Main dashboard with tabbed interface
│   │   │   ├── MetricsGrid.jsx     Key performance metrics display
│   │   │   ├── EngagementChart.jsx Trend visualization with Recharts
│   │   │   ├── HeatmapViewer.jsx   Interactive heatmap canvas
│   │   │   ├── RealTimeStats.jsx   Live engagement statistics
│   │   │   └── ExportPanel.jsx     Export tracking and history
│   │   ├── Scanner/                [KEPT] Property scanning
│   │   ├── Upload/                 [KEPT] Model upload
│   │   ├── Viewer/                 [KEPT] 3D model viewer
│   │   └── Gallery/                [KEPT] Property gallery
│   └── settings/                   [KEPT] API configuration
│
├── hooks/
│   ├── useThreeScene.js            [KEPT] Scene management
│   ├── useCameraStream.js          [KEPT] Camera access
│   ├── useKiriAPI.js               [KEPT] Kiri API integration
│   ├── useAnalytics.js             [NEW] Event tracking
│   ├── useModelTracking.js         [NEW] Interaction tracking
│   └── useStorage.js               [NEW] Enhanced storage management
│
├── services/
│   ├── threeRenderer.js            [KEPT] Three.js utilities
│   ├── modelLoader.js              [KEPT] Model loading
│   ├── kiriEngine.js               [ENHANCED] Mock mode support added
│   ├── storageService.js           [ENHANCED] Improved with error handling
│   ├── analyticsService.js         [NEW] Core event tracking
│   └── eventLogger.js              [NEW] Event capture and logging
│
├── utils/
│   ├── constants.js                [KEPT] Sample data
│   ├── validators.js               [KEPT] Input validation
│   └── analyticsHelpers.js         [NEW] Metric calculations
│
├── data/                           [NEW] Mock data for development
│   ├── mockModels.js              3D model data
│   ├── mockAnalytics.js           Analytics metrics data
│   └── sampleProperties.js        Property examples
│
├── styles/                         CSS utilities
└── App.jsx                         [ENHANCED] Analytics integration
```

## 📊 Analytics Features

### Dashboard Components

#### MetricsGrid
Displays four key metrics:
- **Total Scans**: Cumulative scan count
- **Active Models**: Currently available models
- **Average Engagement**: Overall engagement score (0-100%)
- **Monthly Growth**: Month-over-month percentage change

#### EngagementChart
Line chart showing trends over 30 days:
- Scans per day
- Views per day
- Exports per day

Uses Recharts for responsive visualization.

#### HeatmapViewer
Canvas-based heatmap showing:
- User interaction distribution in 3D space
- Intensity mapping (cool to warm colors)
- Real-time coordinate visualization

#### RealTimeStats
Live metrics that update every 5 seconds:
- Users currently online
- Active models being viewed
- Average session time
- Peak hour view count

#### ExportPanel
Export tracking with:
- Format breakdown (GLB, GLTF, PLY)
- Recent exports list
- File size information
- Export timestamp

### Event Tracking

The application tracks user interactions at multiple levels:

#### Analytics Service
High-level event tracking:
```javascript
trackEvent(eventName, properties)
trackModelView(modelId, modelName, duration)
trackModelInteraction(modelId, type, details)
trackScanCreated(scanId, type, duration)
trackExport(modelId, format, size)
```

#### Event Logger
Low-level event capture with subscriber pattern:
```javascript
logEvent(type, data)
onEvent(eventType, callback)  // Subscribe to events
```

Event types:
- `model:load` - Model loaded
- `model:rotate` - User rotated model
- `model:zoom` - User zoomed
- `model:pan` - User panned
- `scan:start/complete/cancel` - Scan lifecycle
- `upload:start/complete/error` - Upload lifecycle
- `export:start/complete` - Export lifecycle

### Hooks for Analytics

#### useAnalytics
Main hook for tracking events:
```javascript
const { 
  track,              // Generic event tracking
  trackView,          // Model view tracking
  trackInteraction,   // Interaction tracking
  trackScan,          // Scan event tracking
  trackExportEvent,   // Export event tracking
  getMetrics          // Get session metrics
} = useAnalytics();
```

#### useModelTracking
Track 3D model interactions:
```javascript
const {
  trackRotation,      // Track rotation (deltaX, deltaY)
  trackZoom,          // Track zoom (direction, level)
  trackPan,           // Track pan (deltaX, deltaY)
  getViewTime,        // Get total view time
  getEngagementScore, // Calculate engagement 0-100
  trackingData        // Current tracking data
} = useModelTracking(modelId, modelName);
```

#### useStorage
Enhanced localStorage management:
```javascript
const [value, setValue, removeValue] = useStorage(key, initialValue);
```

## 🛠 Development Features

### Mock Mode for Kiri Engine
The Kiri Engine API can be used in mock mode for development:

Set environment variable:
```bash
REACT_APP_USE_MOCK_KIRI=true
```

Mock features:
- Simulates image upload
- Generates mock serial numbers
- Simulates processing stages (queued → processing → complete)
- Returns mock model URLs

### Data Structures

#### Model Data
```javascript
{
  id: 'model-001',
  name: 'Modern Office Space',
  url: '/models/office-space.glb',
  type: 'gltf',           // 'gltf' or 'ply'
  fileSize: 2.4,          // MB
  vertices: 125000,
  polygons: 62500,
  createdAt: Date,
  scanDate: Date
}
```

#### Analytics Data
```javascript
{
  totalScans: 156,
  activeModels: 42,
  averageEngagement: 78.5,
  monthlyGrowth: 12.3,
  dailyMetrics: [],       // Array of day metrics
  engagementByModel: [],  // Model engagement data
  heatmapData: [],        // Heatmap points
  realTimeStats: {},      // Current stats
  exportStats: {}         // Export tracking
}
```

## 📈 Utility Functions

### analyticsHelpers

Metric calculations and data transformations:

```javascript
calculateEngagementScore(interactions, viewTimeSeconds)    // 0-100
calculateAverageMetrics(metrics)                           // Average across dataset
formatNumber(num)                                          // Format 1234 → 1.2K
calculateGrowthRate(current, previous)                     // Percentage change
getTimePeriodLabel(date)                                   // "5h ago"
calculatePercentile(value, values)                         // Percentile rank
groupByTimePeriod(data, period)                            // Group by time
calculateTrend(values)                                     // Trend direction
```

## 🔧 API Integration

### Kiri Engine Service

**Real Mode** (with API key):
```javascript
const serialNumber = await uploadToKiriEngine(frames, apiKey);
const status = await checkKiriStatus(serialNumber, apiKey);
const modelUrl = await downloadKiriModel(serialNumber, apiKey);
```

**Mock Mode** (for development):
- Returns mock serial numbers
- Simulates processing delays
- Provides test model URLs

## 📊 Storage

Analytics data is persisted using enhanced localStorage:

```javascript
// Save analytics
analyticsService.persistAnalyticsBuffer();

// Export for analysis
const data = analyticsService.exportAnalytics();

// Clear data
analyticsService.clearAnalytics();
```

Storage quota management:
- Keeps last 1000 events maximum
- Auto-clears old events
- Error handling for storage limits

## 🎨 UI Components

### Responsive Design
- Mobile-first approach
- Tailwind CSS utilities
- Glassmorphism effects
- Dark theme with blue/purple accents

### Color Palette
- Primary: Blue (`#3b82f6`)
- Secondary: Purple (`#8b5cf6`)
- Accent: Green (`#10b981`)
- Danger: Red (`#ef4444`)
- Background: Slate (`#0f172a`, `#1e293b`)

## 🚀 Performance

### Build Size
```
Main bundle: 333.18 KB (gzipped)
Chunk: 1.76 KB
CSS: 263 B
```

### Optimization Features
- Code splitting via React lazy loading
- Event debouncing for tracking
- Efficient re-renders with React hooks
- LocalStorage caching for analytics

## 🔐 Configuration

### Environment Variables
```
REACT_APP_USE_MOCK_KIRI=true|false    # Use mock Kiri Engine
REACT_APP_KIRI_API_KEY=your_api_key   # Kiri Engine API key
```

## 📝 Usage Examples

### Track a Model View
```javascript
const { trackView } = useAnalytics();

const handlePropertyClick = (property) => {
  trackView(property.id, property.title, 0);
  // Show 3D viewer...
};
```

### Track Interactions
```javascript
const { trackRotation, trackZoom } = useModelTracking(modelId, modelName);

// In your model viewer
const handleRotate = (deltaX, deltaY) => {
  trackRotation(deltaX, deltaY);
  // Update model rotation...
};
```

### Export Analytics
```javascript
const { track, getMetrics } = useAnalytics();

const handleExport = () => {
  const metrics = getMetrics();
  console.log('Session metrics:', metrics);
  // Download metrics JSON...
};
```

## 📦 Dependencies

Key dependencies added for analytics:
- `recharts`: Chart visualizations
- `lucide-react`: Icons

## 🎯 Future Enhancements

Planned features:
- Database backend for persistent analytics
- Real-time WebSocket updates
- Advanced filtering and segmentation
- Custom report generation
- A/B testing framework
- Machine learning predictions

## 📄 License

MIT

---

**Last Updated**: December 17, 2025
**Version**: 2.0.0 (Analytics Enhanced)
