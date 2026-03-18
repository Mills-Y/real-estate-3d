# Analytics Overlay Integration Guide

## Overview

The analytics overlay feature seamlessly integrates real-time analytics data with the 3D model viewer, allowing users to monitor engagement metrics while viewing properties. This eliminates the need to switch between separate views.

## Features

### 1. **Dual Display Modes**

#### Side Panel Mode (Default)
- Analytics displayed in a resizable right-side panel
- Drag the divider to adjust panel width (250px - 600px)
- Provides full dashboard with multiple tabs:
  - **Overview**: Key metrics and top properties
  - **Engagement**: Historical engagement charts
  - **Heatmap**: Visual heatmap data
  - **Exports**: File export statistics
- Ideal for detailed analysis while viewing models

#### Floating Widget Mode
- Compact analytics widget that floats over the model viewer
- Minimizable to save screen space
- Shows property-specific metrics
- Perfect for users who want an unobstructed 3D view
- Includes quick insights and recommendations

### 2. **Property-Specific Analytics**

When viewing a specific property, the analytics panel automatically shows:
- **View Statistics**: Total views and engagement rate
- **Scan Data**: Number of detailed scans completed
- **Session Metrics**: Average session duration and interaction rate
- **Performance Trends**: Real-time metrics with trend indicators
- **AI Insights**: Automatic recommendations based on engagement

### 3. **Interactive Controls**

#### Header Controls
- **Analytics Toggle Button** (BarChart3 icon): Toggle analytics visibility
- **Mode Switcher**: Switch between side panel and floating widget
  - Side Panel Icon (LayoutSidebar): Switch to side panel
  - Wind Icon: Switch to floating widget
- **Close Button** (X): Close the entire viewer

#### Model Viewer Controls
- **Rotate**: Left-click and drag
- **Pan**: Right-click and drag
- **Zoom**: Mouse scroll wheel
- **Quick Toggle**: Right-side button to collapse/expand analytics panel

#### Analytics Panel Controls
- **Refresh Button**: Manually refresh data (30-second auto-refresh)
- **Tab Navigation**: Switch between different analytics views
- **Resize Handle**: Drag the divider to adjust panel width

### 4. **Real-Time Engagement Tracking**

As users interact with the model, the engagement score automatically updates based on:
- Number of interactions (rotations, pans, zooms)
- Duration of viewing session
- Type of interactions performed
- Engagement calculation formula

The engagement score is displayed prominently in the header for instant feedback.

## Component Architecture

### New Components Created

1. **ModelViewerWithAnalytics.jsx**
   - Main integrated component combining viewer and analytics
   - Manages state for both display modes
   - Handles panel resizing
   - Tracks user interactions and engagement

2. **FloatingAnalyticsWidget.jsx**
   - Compact floating widget component
   - Minimizable interface
   - Shows property-specific metrics
   - Movable to different screen positions

3. **PropertyAnalyticsPanel.jsx**
   - Displays property-specific metrics
   - Shows engagement scores and trends
   - Provides quick insights and recommendations
   - Metric cards with visual indicators

### Integration Points

The analytics overlay integrates with existing components:
- **Dashboard.jsx**: Updated to support property-specific data and panel mode
- **App.js**: Updated to use ModelViewerWithAnalytics instead of ModelViewer
- **useModelTracking Hook**: Provides engagement scoring
- **analyticsService**: Backend analytics API integration

## Usage

### Default Behavior
When a user clicks on a property to view:
1. ModelViewerWithAnalytics opens with the 3D model on the left
2. Analytics panel is displayed on the right side by default
3. Property-specific data is automatically loaded
4. Engagement score updates in real-time as user interacts

### Switching Display Modes
1. Click the mode switcher button in the header
2. Wind icon → floating widget mode
3. LayoutSidebar icon → side panel mode

### Collapsing the Panel
- Click the collapse button (>) on the right side of the model viewer
- Or toggle the analytics button in the header
- Model viewer expands to use full width when panel is hidden

### Resizing the Panel (Side Mode)
1. Position cursor on the divider between model and panel
2. Drag left to reduce panel width
3. Drag right to expand panel width
4. Minimum width: 250px, Maximum width: 600px

### Minimizing the Widget (Floating Mode)
1. Click the chevron button in the widget header
2. Widget collapses to just show the header
3. Click again to expand

## Data Display

### Overview Tab
- **Metrics Grid**: Total scans, active models, engagement, growth rate
- **Top Properties**: List of properties by engagement with engagement score
- **Real-Time Stats**: Current user activity and session information

### Engagement Tab
- Historical engagement trends
- Daily metrics visualization
- Peak engagement periods

### Heatmap Tab
- Visual representation of user interaction points
- Interaction density mapping
- Hotspot identification

### Exports Tab
- File export history
- Format breakdown statistics
- Recent upload information

## Styling & Theming

- **Dark Mode**: Uses slate and gray color palette for eye comfort
- **Glass Morphism**: Backdrop blur effects for modern look
- **Responsive**: Adapts to different screen sizes
- **Smooth Transitions**: All interactions have smooth animations
- **Color Coding**: 
  - Blue: Primary actions and active states
  - Green: Positive trends and increases
  - Red: Negative trends and decreases
  - Amber: Warnings and insights

## Technical Details

### State Management
- `showAnalytics`: Boolean to toggle analytics visibility
- `analyticsMode`: 'sidebar' or 'floating' for display mode
- `analyticsPanelWidth`: Dynamic panel width (250-600px)
- `engagementScore`: Real-time engagement percentage
- `isResizing`: Flag for panel resize tracking

### Event Tracking
Every interaction in the model viewer is tracked:
- `model_view_started`: When viewer opens
- `model_view_ended`: When viewer closes
- `model_rotate/zoom/pan`: Interaction events
- Property-specific engagement metrics

### Performance Considerations
- Analytics refresh every 30 seconds automatically
- Manual refresh button for immediate updates
- Lazy-loaded components for better performance
- Efficient state updates to prevent unnecessary re-renders

## Keyboard Shortcuts (Future Enhancement)

Potential keyboard shortcuts to implement:
- `A`: Toggle analytics
- `M`: Switch display mode
- `R`: Refresh analytics data
- `ESC`: Close viewer

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Limited support (responsive layout)

## Troubleshooting

### Analytics Not Updating
- Click the refresh button to manually refresh
- Check backend connection status
- Wait for automatic 30-second refresh cycle

### Panel Not Resizing
- Ensure cursor is on the divider line
- Check that the width is within 250-600px range
- Try refreshing the page

### Floating Widget Appears Off-Screen
- Use the close button to hide
- Re-enable analytics to reset position

### Engagement Score Shows Zero
- Interact with the model (rotate, pan, zoom)
- Score updates only on interactions
- Wait a moment for calculation

## Future Enhancements

Potential improvements:
1. **Customizable Metrics**: Allow users to select which metrics to display
2. **Export Reports**: Generate PDF reports with engagement data
3. **Comparison View**: Compare current session with historical averages
4. **Custom Alerts**: Set thresholds for engagement metrics
5. **Annotation Tools**: Mark interesting areas on the model
6. **Multi-Property Comparison**: View analytics for multiple properties side-by-side
7. **Advanced Filters**: Filter engagement data by user type, time period, etc.
8. **Real-Time Collaboration**: Show when other users are viewing the same property

## Support & Feedback

For issues or feature requests related to the analytics overlay:
1. Check this documentation first
2. Review the component source code
3. Contact the development team with specific use cases
