# 📊 Analytics Tracking Implementation Guide

## Overview

This document explains the comprehensive analytics tracking system integrated into the Real Estate 3D Scanner application. All tracking uses the `window.storage` API for data persistence and never directly uses localStorage.

---

## 🔧 Storage API Architecture

### Window Storage API

The application initializes a custom `window.storage` API that provides:

```javascript
window.storage.get(key, defaultValue)      // Get stored value
window.storage.set(key, value)             // Set stored value
window.storage.delete(key)                 // Delete stored value
window.storage.exists(key)                 // Check if key exists
window.storage.list(prefix)                // List all keys with prefix
window.storage.getAll(prefix)              // Get all values with prefix
window.storage.clear(prefix)               // Clear storage (all or by prefix)
window.storage.getSize()                   // Get storage statistics
```

**Initialization:**
```javascript
// In src/services/storageInitializer.js
import { initializeStorageAPI } from './services/storageInitializer';
initializeStorageAPI(); // Called in App.js on startup
```

---

## 📈 Tracked Events

### 1. Gallery Events

#### `gallery_opened`
Fired when user opens the Property Gallery view.

**Properties:**
- `totalProperties` (number) - Total count of properties
- `scannedCount` (number) - Count of 3D scanned properties
- `uploadedCount` (number) - Count of uploaded properties
- `timestamp` (ISO string) - When event occurred

**Location:** `PropertyGallery.jsx` - `useEffect` on mount

---

#### `gallery_tab_changed`
Fired when user switches between gallery tabs (All Properties / My Uploads).

**Properties:**
- `activeTab` (string) - Tab name: 'gallery' or 'myuploads'
- `totalProperties` (number) - Total property count at time of change
- `timestamp` (ISO string) - When event occurred

**Location:** `PropertyGallery.jsx` - `handleTabChange` function

---

### 2. Property Card Events

#### `property_card_viewed`
Fired when a property card appears in the viewport (impression).

**Properties:**
- `propertyId` (number) - Property ID
- `propertyTitle` (string) - Property name
- `propertyType` (string) - 'scan' or 'upload'
- `timestamp` (ISO string) - When event occurred

**Location:** `PropertyCard.jsx` - `useEffect` on mount

---

#### `property_card_clicked`
Fired when user clicks "View 3D" button on a property card.

**Properties:**
- `propertyId` (number) - Property ID
- `propertyTitle` (string) - Property name
- `action` (string) - Always 'view'
- `timestamp` (ISO string) - When event occurred

**Location:** `PropertyCard.jsx` - `handleView` function

---

#### `property_card_deleted`
Fired when user clicks the delete button on a property card.

**Properties:**
- `propertyId` (number) - Property ID
- `propertyTitle` (string) - Property name
- `action` (string) - Always 'delete'
- `timestamp` (ISO string) - When event occurred

**Location:** `PropertyCard.jsx` - `handleDelete` function

---

### 3. Model Viewer Events

#### `model_view_started`
Fired when user opens a 3D model viewer.

**Properties:**
- `propertyId` (number) - Property ID
- `propertyTitle` (string) - Property name
- `timestamp` (ISO string) - When event occurred

**Location:** `ModelViewer.jsx` - `useEffect` on open

---

#### `model_view_ended`
Fired when user closes the 3D model viewer. Includes comprehensive metrics.

**Properties:**
- `propertyId` (number) - Property ID
- `propertyTitle` (string) - Property name
- `durationMs` (number) - View duration in milliseconds
- `durationSeconds` (number) - View duration in seconds
- `interactionCount` (number) - Total interaction count
- `engagementScore` (number) - Calculated engagement score (0-100)
- `timestamp` (ISO string) - When event occurred

**Location:** `ModelViewer.jsx` - Cleanup effect on close

**Engagement Score Calculation:**
```
score = (interactions × 10) / min(time_in_minutes, 2)
capped at 100
```

---

#### `model_rotate`
Fired when user rotates the 3D model (throttled to 100ms).

**Properties:**
- `propertyId` (number) - Property ID
- `interactionCount` (number) - Cumulative interaction count
- `deltaX` (number) - X-axis rotation delta
- `deltaY` (number) - Y-axis rotation delta

**Location:** `ModelViewer.jsx` - `trackInteraction('rotate')` method

---

#### `model_zoom`
Fired when user zooms on the 3D model (throttled to 100ms).

**Properties:**
- `propertyId` (number) - Property ID
- `interactionCount` (number) - Cumulative interaction count
- `direction` (string) - 'in' or 'out'

**Location:** `ModelViewer.jsx` - `trackInteraction('zoom')` method

---

#### `model_pan`
Fired when user pans on the 3D model (throttled to 100ms).

**Properties:**
- `propertyId` (number) - Property ID
- `interactionCount` (number) - Cumulative interaction count
- `deltaX` (number) - X-axis pan delta
- `deltaY` (number) - Y-axis pan delta

**Location:** `ModelViewer.jsx` - `trackInteraction('pan')` method

---

## 🪝 Analytics Hooks

### `useAnalytics()`

Main hook for event tracking and session metrics.

```javascript
import { useAnalytics } from './hooks/useAnalytics';

const { trackView, trackInteraction, getMetrics, sessionMetrics } = useAnalytics();

// Track events
trackView(modelId, modelName, duration);
trackInteraction(modelId, type, details);

// Get metrics
const metrics = getMetrics();
```

---

### `useModelTracking(propertyId, propertyTitle)`

Specialized hook for tracking 3D model interactions with engagement scoring.

```javascript
import { useModelTracking } from './hooks/useModelTracking';

const { trackRotation, trackZoom, trackPan, getEngagementScore } = useModelTracking(id, title);

trackRotation(deltaX, deltaY);
trackZoom(direction, level); // direction: 1=in, -1=out
trackPan(deltaX, deltaY);

const score = getEngagementScore(); // 0-100
```

---

## 📊 Analytics Services

### `analyticsService.js`

Core service for event tracking and persistence.

**Key Functions:**

```javascript
// Event tracking
trackEvent(eventName, properties)           // Log event with properties
trackModelView(modelId, title, duration)    // Track model view
trackModelInteraction(modelId, type, details) // Track interaction
trackScanCreated(scanId, type, duration)    // Track scan
trackExport(modelId, format, size)          // Track export

// Session management
initializeAnalytics()                       // Initialize session
getSessionMetrics()                         // Get current session metrics
persistAnalyticsBuffer()                    // Force persist events

// Data export
exportAnalytics()                           // Export as JSON
exportAnalyticsAsCSV()                      // Export as CSV
downloadAnalyticsCSV(filename)              // Download CSV file
downloadAnalyticsJSON(filename)             // Download JSON file

// Summary and analysis
getAnalyticsSummary()                       // Get summary statistics
clearAnalytics()                            // Clear all analytics
```

---

### `storageService.js`

Enhanced wrapper around window.storage API.

```javascript
// Basic operations
saveToLocalStorage(key, value)              // Save value
getFromLocalStorage(key, defaultValue)      // Get value
removeFromLocalStorage(key)                 // Delete value
clearLocalStorage(prefix)                   // Clear storage

// Utilities
getStorageKeys(prefix)                      // List keys
getStorageUsage()                           // Get size info
```

---

## 🧮 Analytics Helper Functions

Located in `utils/analyticsHelpers.js`:

### Engagement Scoring

```javascript
calculateEngagementScore(interactions, viewTimeSeconds)
// Returns: 0-100 score based on interaction frequency and duration

calculateAdvancedEngagementScore(interactions)
// Returns: 0-100 score with multiple factors:
//   - Interaction frequency (0-30 points)
//   - Session duration (0-30 points)
//   - Interaction variety (0-20 points)
//   - Recency bonus (0-20 points)
```

### Heatmap Generation

```javascript
generateHeatmapZones(interactions, gridSize = 10)
// Returns: Array of heatmap points with intensity values
// Used to visualize interaction hotspots in 3D model space
```

### Property Metrics

```javascript
calculatePropertyMetrics(interactions)
// Returns: Object with per-property statistics:
//   - viewCount
//   - totalDuration
//   - totalInteractions
//   - rotations/zooms/pans
//   - avgEngagementScore
```

### Formatting and Transforms

```javascript
formatNumber(num)                           // "1.2M", "5.3K", "42"
calculateGrowthRate(current, previous)      // Percentage change
getTimePeriodLabel(date)                    // "5h ago", "2d ago"
calculatePercentile(value, values)          // 0-100 percentile
groupByTimePeriod(data, period)             // Group by hour/day/week/month
calculateTrend(values)                      // Direction and magnitude
```

---

## 📱 Dashboard

The Analytics Dashboard displays:

### Overview Tab
- **Metrics Grid**: Total scans, active models, average engagement, monthly growth
- **Real-time Stats**: Live user count, active models, session time
- **Top Properties**: Ranked by engagement score with interaction counts

### Engagement Tab
- **Trend Chart**: 30-day scans/views/exports trends using Recharts

### Heatmap Tab
- **Interaction Heatmap**: Canvas visualization of model interaction zones
  - Cool (blue) zones: Low interaction
  - Hot (red) zones: High interaction
  - Color intensity indicates interaction density

### Exports Tab
- **Format Breakdown**: GLB, GLTF, PLY distribution
- **Recent Exports**: History of exported models
- **CSV/JSON Downloads**: Export reports for external analysis

---

## 💾 Data Storage Details

### Storage Location
All analytics data stored in browser's localStorage via `window.storage` API.

### Key Structure
```
analyticsBuffer          // Main event log (JSON array, max 1000 events)
```

### Event Structure
```javascript
{
  name: string,          // Event name (e.g., "model_view_ended")
  timestamp: number,     // Unix timestamp
  sessionId: string,     // Session identifier
  properties: {          // Event-specific data
    propertyId: number,
    propertyTitle: string,
    // ... event-specific properties
  }
}
```

### Retention Policy
- Events buffered in memory until 10 events accumulated
- Buffer automatically persisted to storage
- Maximum 1000 events stored (older events discarded)
- Manual export recommended for long-term archival

---

## 🔐 Privacy & Data

### What's Tracked
- User interactions (clicks, rotations, zooms, pans)
- Duration metrics (time spent viewing models)
- Property engagement scores
- Navigation patterns
- Export statistics

### What's NOT Tracked
- Personal identification
- IP addresses
- Device fingerprints
- User authentication data
- Sensitive property information

### Data Lifecycle
1. Events generated and buffered in memory
2. Persisted to localStorage every 10 events
3. Searchable via Analytics Dashboard
4. Exportable as CSV/JSON for analysis
5. Clearable on-demand via Dashboard

---

## 🧪 Testing Analytics

### View Console Logs
Open browser DevTools (F12) and look for logs:
```
📊 Analytics: Property card impression - Modern Beach House
📊 Analytics: Property card clicked - Modern Beach House
📊 Analytics: Started viewing Modern Beach House
📊 Analytics: Ended viewing Modern Beach House | Duration: 15s | Interactions: 23 | Engagement: 75%
```

### Check Stored Data
In DevTools Console:
```javascript
// View all analytics
window.storage.get('analyticsBuffer')

// View storage size
window.storage.getSize()

// Clear analytics
window.storage.delete('analyticsBuffer')
```

### Export and Analyze
1. Open Analytics Dashboard (Analytics button in header)
2. Go to Exports tab
3. Click "CSV Report" or "JSON Report"
4. Analyze in spreadsheet or JSON viewer

---

## 📖 Integration Examples

### Track Custom Event
```javascript
import { trackEvent } from './services/analyticsService';

trackEvent('custom_action', {
  userId: 123,
  action: 'export_model',
  format: 'glb',
  duration: 5000,
});
```

### Get Session Metrics
```javascript
import { useAnalytics } from './hooks/useAnalytics';

export function MyComponent() {
  const { getMetrics } = useAnalytics();
  
  const handleExport = () => {
    const metrics = getMetrics();
    console.log(`Session ${metrics.sessionId} has ${metrics.eventCount} events`);
  };
}
```

### Analyze Property Performance
```javascript
import { getAnalyticsSummary } from './services/analyticsService';

const summary = getAnalyticsSummary();
console.log('Top property:', summary.topProperty);
console.log('All properties:', summary.properties);
```

---

## 🚀 Production Deployment

### Before Going Live

1. **Review Data Retention**: Adjust 1000-event limit if needed
2. **Configure Export Schedule**: Set up regular CSV exports
3. **Privacy Policy**: Update to reflect analytics tracking
4. **User Consent**: Add opt-in/opt-out if required
5. **Backend Integration**: Connect to your analytics service (future)

### Example Backend Integration
```javascript
// Future enhancement - send analytics to server
export const sendAnalyticsToBackend = async () => {
  const data = exportAnalytics();
  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};
```

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Real-time event tracking
- ✅ window.storage API instead of direct localStorage
- ✅ Engagement scoring algorithm
- ✅ Heatmap visualization
- ✅ CSV/JSON export
- ✅ Component-level tracking (ModelViewer, PropertyCard, PropertyGallery)
- ✅ Advanced analytics helpers

### Future Enhancements
- Backend persistence
- User segmentation
- Predictive analytics
- Real-time dashboards
- Mobile analytics
- A/B testing framework

---

**Last Updated:** December 17, 2025
**Status:** Production Ready ✅
