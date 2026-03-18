# Analytics Overlay - Implementation Quick Reference

## File Structure

```
src/components/features/
├── Analytics/
│   ├── Dashboard.jsx (Updated with property-specific support)
│   ├── PropertyAnalyticsPanel.jsx (NEW - Property-specific metrics)
│   ├── FloatingAnalyticsWidget.jsx (NEW - Floating widget mode)
│   ├── MetricsGrid.jsx
│   ├── EngagementChart.jsx
│   ├── HeatmapViewer.jsx
│   ├── ExportPanel.jsx
│   └── RealTimeStats.jsx
└── Viewer/
    ├── ModelViewerWithAnalytics.jsx (NEW - Main integrated component)
    ├── ModelViewer.jsx (Original, still available)
    └── ...

src/
├── App.js (Updated to use ModelViewerWithAnalytics)
└── ...
```

## Key Props and State

### ModelViewerWithAnalytics Props
```javascript
{
  isOpen: boolean,           // Viewer open/close state
  property: object,          // Property data { id, title, location }
  mountRef: ref,            // Three.js mount reference
  onClose: function,        // Close callback
  showAnalyticsByDefault: boolean // Show analytics on open (default: true)
}
```

### Analytics State Variables
```javascript
showAnalytics: boolean        // Toggles analytics visibility
analyticsMode: string         // 'sidebar' | 'floating'
analyticsPanelWidth: number   // 250-600px
engagementScore: number       // 0-100%
isResizing: boolean          // Panel resize tracking
```

## Component Communication

```
App.js
  └─ ModelViewerWithAnalytics
      ├─ Three.js Model (via mountRef)
      ├─ Analytics Toggle Button
      ├─ Mode Switcher Button
      └─ Conditional Render:
          ├─ Dashboard (sidebar mode)
          │   └─ Existing tabs: Overview, Engagement, Heatmap, Exports
          └─ FloatingAnalyticsWidget (floating mode)
              └─ PropertyAnalyticsPanel
```

## Event Flow

### User Opens Model
1. `setShowViewer(true)` in App.js
2. ModelViewerWithAnalytics renders
3. `trackModelViewReal()` called for analytics
4. Analytics panel loads (sidebar mode by default)
5. Dashboard fetches real analytics data

### User Interacts with Model
1. Mouse event detected on model
2. `trackInteraction(type, details)` called
3. Interaction tracked via `useModelTracking` hook
4. Engagement score recalculated and displayed
5. Analytics data refreshes every 30 seconds

### User Toggles Analytics
1. Click analytics button in header
2. `setShowAnalytics(!showAnalytics)`
3. Panel slides in/out with smooth transition
4. Model viewer expands to full width when hidden

### User Switches Display Mode
1. Click mode switcher button
2. `setAnalyticsMode('sidebar'|'floating')`
3. Analytics content re-renders in new layout
4. Previous state preserved

## Styling Notes

### CSS Classes Used
- Tailwind: `flex`, `absolute`, `rounded-lg`, `bg-gradient`, etc.
- Custom animations: `spin` (refresh button)
- Backdrop blur: `backdrop-blur-sm`, `backdrop-blur`

### Z-Index Layers
```
0-10:     Model content
10:       Controls overlay
20:       Quick toggle button
40:       Floating widget
50:       Resize handle
100:      Header
300:      Floating widgets (high)
1000:     Modal close button
9999:     Main container (highest)
```

### Color Palette
- Primary: `rgb(37, 99, 235)` (blue-600)
- Dark: `rgb(15, 23, 42)` (slate-900)
- Gray: `rgb(30, 41, 59)` - `rgb(71, 85, 105)`
- Accents: Green (trends), Red (issues), Amber (warnings)

## Modification Points

### To Change Default Mode
In ModelViewerWithAnalytics:
```javascript
const [analyticsMode, setAnalyticsMode] = useState('floating'); // Change to 'floating'
```

### To Change Default Width
```javascript
const [analyticsPanelWidth, setAnalyticsPanelWidth] = useState(400); // Change from 350
```

### To Adjust Refresh Interval
In Dashboard:
```javascript
const interval = setInterval(refreshAnalytics, 60000); // Change from 30000ms
```

### To Add New Analytics Tabs
1. Add tab object to `tabs` array in Dashboard
2. Add conditional rendering for new tab content
3. Create corresponding component

## Dependencies

### Hooks Used
- `useState`: State management
- `useEffect`: Lifecycle management
- `useRef`: Reference tracking, event throttling
- `useModelTracking`: Custom hook for engagement scoring

### External Libraries
- `lucide-react`: Icons (BarChart3, ChevronLeft, ChevronRight, etc.)
- `PropTypes`: Prop validation
- React Router: Navigation context

## Performance Optimizations

1. **Throttled Interactions**: 100ms throttle on interaction tracking
2. **Lazy Rendering**: Conditional rendering of sidebar/floating widget
3. **Memoization**: Use of useRef to avoid re-renders
4. **Event Delegation**: Single event handler for all interactions
5. **Auto-cleanup**: useEffect cleanup functions for event listeners

## Testing Checklist

- [ ] Analytics panel opens with model viewer
- [ ] Engagement score updates on interactions
- [ ] Panel can be toggled on/off
- [ ] Panel can be resized (sidebar mode)
- [ ] Mode can switch between sidebar and floating
- [ ] Floating widget minimizes/expands
- [ ] Data refreshes every 30 seconds
- [ ] Manual refresh works
- [ ] Property-specific data loads correctly
- [ ] Panel state doesn't interfere with 3D interactions
- [ ] Responsive on different screen sizes

## API Integration

### Backend Endpoints Used
- `GET /api/analytics/real`: Real analytics data
- `POST /api/analytics/track/view`: Track model view
- `POST /api/analytics/track/scan`: Track scan completion

### Analytics Service Methods
```javascript
fetchRealAnalytics()        // Get all analytics data
trackModelViewReal(propertyId)  // Track property view
trackScanCompletion(propertyId, duration, quality)  // Track scan
trackEvent(eventName, details)  // Generic event tracking
trackRotation/Zoom/Pan()   // Interaction tracking
```

## Browser DevTools Tips

### Check Analytics State
```javascript
// In console
const analyticsButton = document.querySelector('[title="Hide analytics"]');
// Click to toggle while inspecting
```

### Monitor Events
- Filter Performance tab for "Analytics"
- Watch Network tab for `/api/analytics/*` calls
- Check Console for tracking logs

### Element Inspector
- Right-click panel and select "Inspect"
- Look for `data-testid` attributes
- Check computed styles for position/width

## Known Limitations

1. Mobile support is limited (floating widget only)
2. Panel width doesn't persist between sessions
3. Analytics data is mocked until backend fully integrated
4. Heatmap feature requires specific tracking data
5. Real-time updates limited to 30-second intervals

## Future Integration Points

- WebSocket for real-time analytics without polling
- LocalStorage for panel width persistence
- Custom theme support
- Analytics export functionality
- Advanced filtering and date range selection
- Comparison with historical data
