# Analytics Overlay - Visual Architecture & Flow Diagrams

## 1. Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      ModelViewerWithAnalytics               │
│  (Main Container - Fixed Position, Full Screen)             │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
      ┌────▼────────┐  ┌────▼────────┐  ┌───▼─────┐
      │   Header    │  │   Content   │  │  Style  │
      │             │  │   Area      │  │ & State │
      └─────────────┘  └────────────┘  └─────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
     ┌────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
     │  Model    │    │  Sidebar   │    │ Floating   │
     │  Viewer   │    │ Analytics  │    │  Widget    │
     │ (Three.js)│    │(Dashboard) │    │            │
     └───────────┘    └────────────┘    └────────────┘
          │                │                  │
          │            ┌────┴────┐            │
          │            │ Tabs:   │            │
          │            ├─Overview├────┐       │
          │            ├─Engage. │    │       │
          │            ├─Heatmap │    │       │
          │            └─Exports │    │       │
          │                      │    │       │
          │                  ┌───▼────▼───┐   │
          │                  │PropertyData │   │
          │                  │Panel        │   │
          │                  └─────────────┘   │
          │                                    │
          └────────────────┬───────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼──────┐          ┌──────▼─────┐
         │ Engagement│          │  useModel  │
         │ Tracking  │          │ Tracking   │
         └───────────┘          └────────────┘
```

## 2. User Interaction Flow

```
┌──────────────────┐
│ User Clicks on   │
│   Property       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ App.js:                      │
│ setShowViewer(true)          │
│ setSelectedProperty(property) │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ModelViewerWithAnalytics      │
│ - Opens with sidebar mode    │
│ - Loads property data        │
│ - Initiates analytics        │
└────────┬─────────────────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌────────────────────┐
│3D Model Viewer  │      │Dashboard (Sidebar) │
│ - Initializes   │      │ - Shows Overview   │
│ - Renders model │      │ - Charts & metrics │
└────────┬────────┘      └──────────┬─────────┘
         │                          │
         │   ◄──────────────────────┘
         │   (Property ID & Title)
         │
         ▼
┌──────────────────────────────┐
│ User Interacts with Model:   │
│ • Rotates (left-click drag)  │
│ • Pans (right-click drag)    │
│ • Zooms (scroll wheel)       │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ trackInteraction() called    │
│ Throttled to 100ms           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ useModelTracking Hook:       │
│ • Tracks rotation/zoom/pan   │
│ • Updates engagement score   │
│ • Sends to backend           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ updateEngagementScore()      │
│ Calculates: interactions +   │
│ duration + interaction type  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Display in Header:           │
│ "📊 Engagement: 75%"         │
└──────────────────────────────┘


Auto-Refresh Every 30 Seconds:
         │
         ▼
┌──────────────────────────────┐
│ Dashboard refreshAnalytics() │
│ • Fetches real data          │
│ • Updates all tabs           │
│ • Shows updated metrics      │
└──────────────────────────────┘
```

## 3. Display Mode Toggle Flow

```
Initial State: Sidebar Mode
┌─────────────────────────────────────────────┐
│         Model Viewer (70%)                  │ ┌──Analytics (30%)
│                                             │ │
│                                             │ │
│         [3D Model Here]                    │ │Dashboard
│                                             │ │
│                                             │ │
└─────────────────────────────────────────────┘ │
                                                │
                          User clicks          │
                          Wind Icon            │
                             │
                             ▼
Transition to: Floating Widget Mode
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│         Model Viewer (100%)                │
│                                             │
│         [3D Model Here]                    │
│                                          ┌──────────────┐
│                                          │  Analytics   │
│                                          │  Widget      │
│                                          │  (Floating)  │
│                                          └──────────────┘
└─────────────────────────────────────────────┘

                          User clicks
                      LayoutSidebar Icon
                             │
                             ▼
Back to: Sidebar Mode
```

## 4. Analytics Panel Resize Flow

```
Initial State
┌────────────────────────┐  ╱─Resize
│    Model (60%)         │ │ Handle  Analytics (40%)
│                        │╱│         ┌──────────────┐
│     [3D Model]        ║  │         │Dashboard     │
│                        │╲│         └──────────────┘
│                        │ ╲
└────────────────────────┘   ╲

User Drags Left
         │
         ▼
┌──────────────────────────┐   Analytics (35%)
│    Model (65%)           │╱  ┌─────────────┐
│                          ║   │Dashboard    │
│     [3D Model]          ║   └─────────────┘
│                          ║
│                          │
└──────────────────────────┘

User Drags Right
         │
         ▼
┌──────────────────┐          Analytics (50%)
│  Model (50%)     │╱         ┌──────────────┐
│                  ║          │Dashboard     │
│ [3D Model]      ║          └──────────────┘
│                  ║
│                  │
└──────────────────┘

Constraints: Min width 250px, Max width 600px
```

## 5. State Machine

```
                    ┌──────────────────┐
                    │  Initial State   │
                    │ showAnalytics: F │
                    │ mode: 'sidebar'  │
                    └────────┬─────────┘
                             │
                   Toggle Analytics Button
                             │
                    ┌────────▼────────┐
                    │ showAnalytics: T│
                    │ Analytics is ON │
                    │ Sidebar Visible │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   Convert to Floating   Collapse/Expand   Toggle Off
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────────┐   ┌──────────────┐   ┌──────────┐
    │ mode:       │   │View Same but │   │Analytics │
    │ 'floating'  │   │sidebar hidden│   │Hidden    │
    │ showAnalytics│  └──────┬───────┘   └─────┬────┘
    │ still True  │         │                   │
    └─────┬───────┘    Expand Again         Toggle On
          │         ┌────────┘     ┌──┐
          │         │          (return to)
          │         ▼              │
          │     ┌──────────────┐   │
    Back to  │Sidebar Visible │   │
    Sidebar  └─────────────────┘   │
          │                        │
          └────────────┬───────────┘
```

## 6. Real-Time Engagement Scoring

```
User Action Detected
      │
      ▼
┌──────────────────────────┐
│ Throttle Check (100ms)   │
└──────┬────────┬──────────┘
       │        │
      OK     Too Soon (Skip)
       │
       ▼
┌─────────────────────────────────┐
│ Identify Action Type:           │
│ • Rotate, Zoom, or Pan          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ trackRotation/Zoom/Pan()        │
│ Updates action history          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ getEngagementScore()            │
│ Formula:                        │
│ • Base: interaction count × 5   │
│ • Bonus: time duration factor   │
│ • Normalize: 0-100%             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Update engagementScore state    │
│ Trigger re-render               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Display in Header:              │
│ "📊 Engagement Score: [XX]%"    │
└─────────────────────────────────┘
```

## 7. Data Flow Diagram

```
Frontend                          Backend
┌─────────────┐
│  3D Model   │
│  Interaction│
└────┬────────┘
     │
     ▼
┌──────────────────┐
│ useModelTracking │──► POST /api/analytics/track/rotation
│ Hook             │──► POST /api/analytics/track/zoom
│                  │──► POST /api/analytics/track/pan
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Engagement      │
│ Calculator      │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐                ┌─────────────────┐
│ Display in      │                │ 30s Auto        │
│ ModelViewer     │                │ Refresh Timer   │
│ Header          │                └────┬────────────┘
└─────────────────┘                     │
                                        ▼
┌──────────────────┐            ┌───────────────────┐
│ Dashboard       │◄───────────│ fetchRealAnalytics()
│ Component       │            │ GET /api/analytics/real
│                 │            └───────────────────┘
│ Menu Tabs:      │                    │
│ • Overview      │◄───────────────────┘
│ • Engagement    │
│ • Heatmap       │
│ • Exports       │
└─────────────────┘

Property-Specific Data (Optional)
┌──────────────────────┐
│ PropertyAnalyticsPanel
│                      │
│ • Views             │◄──── Property Context
│ • Scans             │
│ • Engagement        │
│ • Session Time      │
│ • Trends            │
│ • AI Insights       │
└──────────────────────┘
```

## 8. Header Controls Map

```
┌─────────────────────────────────────────────────────────┐
│  Model Title          │  [Control Buttons]        [Close]│
│  Location & Engagement│  ▲         ▲            ▲        │
│                       │  │         │            │        │
└───────────────────────┼──┴─────────┴────────────┴────────┘
                        │
        Mode Switcher ◄─┘  Analytics Toggle
        (Wind / LayoutSidebar)  (BarChart3)

When Sidebar Mode:
  Wind Icon = Switch to Floating
  
When Floating Mode:
  LayoutSidebar Icon = Switch to Sidebar
  
In Either State:
  BarChart3 = Toggle Analytics On/Off
  Close (X) = Close Viewer
```

## 9. Responsive Behavior

```
Desktop (1920px+)
┌────────────────────────────────────────────┐
│ Header with all controls visible          │
├─────────────────────┬──────────────────────┤
│                     │                      │
│  Model (70%)        │  Analytics (30%)    │
│                     │  Resizable handles  │
│                     │  Auto-refresh       │
│                     │                      │
└─────────────────────┴──────────────────────┘

Tablet (1024px)
┌────────────────────────────────────────────┐
│ Header with essential controls             │
├─────────────────────┬──────────────────────┤
│                     │                      │
│  Model (65%)        │  Analytics (35%)    │
│                     │  Compact view       │
│                     │                      │
└─────────────────────┴──────────────────────┘

Mobile (600px)
┌────────────────────────────────────────────┐
│ Header (Controls)                          │
├────────────────────────────────────────────┤
│                                            │
│  Model (100%)                             │
│  with Floating Widget                     │
│  (Minimized Analytics)                    │
│                                            │
└────────────────────────────────────────────┘
Floating widget appears over model
```

---

These diagrams provide a visual understanding of:
- How components are organized
- How user interactions flow through the system
- State transitions and data changes
- Real-time engagement calculation
- Display mode switching
- Interface layout and responsive behavior

For detailed implementation, refer to the source code in:
- `src/components/features/Viewer/ModelViewerWithAnalytics.jsx`
- `src/components/features/Analytics/Dashboard.jsx`
- `src/components/features/Analytics/PropertyAnalyticsPanel.jsx`
- `src/components/features/Analytics/FloatingAnalyticsWidget.jsx`
