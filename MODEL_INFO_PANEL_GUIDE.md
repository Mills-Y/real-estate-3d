# Model Information Panel - User Guide

## Overview
The Model Information Panel displays detailed technical information about the 3D model you're viewing, including dimensions, file properties, bounding box data, and performance metrics.

## Features

### 1. **Panel Controls**
The analytics panel now includes full control options:

- **Minimize Button** (⊟): Collapses the panel to a thin sidebar tab
  - Click to minimize and maximize screen space for the 3D viewer
  - Click the maximize button (⊞) on the collapsed tab to expand again
  
- **Close Button** (×): Completely closes the analytics panel
  - Removes the panel from view
  - Click the analytics button in the header to show again

### 2. **Model-Specific Information**

#### **Basic Information** (Expanded by default)
- **File Format**: Shows the 3D model file type (GLTF, GLB, OBJ, etc.)
- **File Size**: Displays the size of the model file in MB/KB
- **Upload Date**: Shows when the model was uploaded
- **Upload Time**: Displays the specific time of upload

#### **3D Model Properties** (Collapsible)
- **Dimensions**: 
  - Width, Height, and Depth in meters
  - Displayed in a clear 3-column grid
  
- **Bounding Box**:
  - Min position (x, y, z coordinates)
  - Max position (x, y, z coordinates)
  - Shows the 3D space occupied by the model
  
- **Polygon Count**: Number of polygons in the model
- **Vertex Count**: Total number of vertices
- **Texture Count**: Number of textures applied to the model

#### **Performance Metrics** (Collapsible)
- **Load Time**: How long it took to load the model
- **Render Time**: Time required to render the initial view
- **Memory Usage**: Current memory consumption of the model

### 3. **Quick Actions**
Two action buttons for model management:
- **Export Model Data**: Download technical specifications
- **View Full Technical Details**: Opens detailed model information

### 4. **Current Session Stats**
Real-time tracking displayed at the bottom:
- **Views in this session**: Number of times viewed
- **Time viewing**: Duration of current viewing session

## User Interface

### Panel States

#### **1. Expanded State** (Default)
```
┌─────────────────────────────────┐
│ [Info Icon] Model Information   │
│                    [⊟] [×]      │
├─────────────────────────────────┤
│                                 │
│  [Sections with data...]        │
│                                 │
└─────────────────────────────────┘
```
- Full width (350px default, resizable 250-600px)
- All information visible
- Collapsible sections

#### **2. Collapsed State**
```
┃ ⊞
┃
┃ M
┃ O
┃ D
┃ E
┃ L
┃
┃ I
┃ N
┃ F
┃ O
┃
┃ ×
┃
```
- Minimal width (50px)
- Vertical "MODEL INFO" text
- Maximize and close buttons
- Maximizes viewer space

#### **3. Closed State**
- Panel completely hidden
- Full screen available for 3D viewer
- Toggle with analytics button in header

### Collapsible Sections

Each information section can be independently expanded or collapsed:

**Expanded Section:**
```
┌─ [Icon] Section Title [▲] ─────┐
│                                 │
│   Information displayed here    │
│                                 │
└─────────────────────────────────┘
```

**Collapsed Section:**
```
┌─ [Icon] Section Title [▼] ─────┐
└─────────────────────────────────┘
```

## How to Use

### Opening the Panel
1. Open a 3D model viewer
2. The analytics panel appears on the right side by default
3. If closed, click the **Analytics button** (📊) in the header

### Minimizing the Panel
1. Click the **Minimize button** (⊟) in the panel header
2. The panel collapses to a 50px vertical tab
3. Click the **Maximize button** (⊞) on the tab to expand

### Closing the Panel
1. Click the **Close button** (×) in the panel header
2. Or click the **Analytics button** in the main header to toggle off

### Resizing the Panel
1. When expanded, hover over the left edge of the panel
2. The resize handle will highlight in blue
3. Click and drag left/right to resize (250-600px range)
4. Release to set the width

### Exploring Sections
1. Click on any section header to expand/collapse it
2. Sections remember their state during your viewing session
3. Default expanded: **Basic Information**
4. Default collapsed: **3D Model Properties**, **Performance Metrics**

## Display Modes

### Sidebar Mode (Default)
- Panel docked to the right side
- Resizable width
- Supports minimize/maximize
- Resize handle on left edge

### Floating Mode
- Compact floating widget
- Positioned in bottom-right corner
- Can be minimized
- Click the **Wind icon** (🌬️) in header to switch

Switch between modes using the header buttons:
- **Wind icon**: Switch to floating mode
- **Layout icon**: Switch to sidebar mode

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close viewer and return to dashboard |

## Technical Details

### Data Sources
- **File information**: Retrieved from property metadata
- **Dimensions & Bounding Box**: Calculated from 3D model geometry
- **Polygon/Vertex counts**: Extracted from Three.js scene
- **Performance metrics**: Measured during load and render

### Real-time Updates
- Model statistics are calculated when the component mounts
- Session stats update in real-time as you interact with the model
- Engagement score updates every 30 seconds

### Responsive Design
- Panel fully scrollable on smaller screens
- Minimum width: 250px
- Maximum width: 600px
- Collapsed width: 50px

## Tips & Best Practices

1. **Minimize when needed**: Use minimize instead of close to keep quick access
2. **Check dimensions**: Review bounding box before exporting models
3. **Monitor performance**: Large vertex/polygon counts may impact performance
4. **Export data**: Save technical specifications for documentation

## Integration with Analytics

The Model Information Panel replaces the general Dashboard when viewing individual models:

- **Dashboard**: Shows property-level analytics (views, scans, engagement)
- **Model Info Panel**: Shows model-specific technical details

Switch back to Dashboard by clicking "Back to Dashboard" button.

## Future Enhancements

Planned features for future releases:
- Real-time geometry analysis from Three.js scene
- Model health indicators (geometry quality, optimization suggestions)
- Texture resolution details
- Material information
- Animation data (if present)
- Comparison with other models

## Troubleshooting

### Panel won't resize
- Ensure you're dragging the resize handle (left edge)
- Check that the panel is in expanded state (not collapsed)
- Try clicking and dragging slowly

### Information not displaying
- Verify the model has loaded completely
- Check browser console for errors
- Refresh the page and try again

### Collapse/Expand not working
- Ensure JavaScript is enabled
- Check for browser compatibility (modern browsers required)
- Clear cache and reload

## Technical Notes for Developers

### Component Location
```
src/components/features/Analytics/ModelInfoPanel.jsx
```

### Props
```javascript
{
  property: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
    modelFile: PropTypes.string,
    createdAt: PropTypes.string,
    uploadedAt: PropTypes.string,
    fileSize: PropTypes.number,
    textureCount: PropTypes.number,
    loadTime: PropTypes.string,
    renderTime: PropTypes.string,
  }),
  mountRef: PropTypes.object, // Ref to Three.js scene container
}
```

### State Management
- Uses React hooks (useState, useEffect)
- Maintains section expansion state internally
- Calculates model statistics on mount

### Styling
- Tailwind CSS utility classes
- Dark theme (slate/gray colors)
- Blue/purple accent colors
- Responsive design

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Component**: ModelInfoPanel.jsx  
**Integration**: ModelViewerWithAnalytics.jsx
