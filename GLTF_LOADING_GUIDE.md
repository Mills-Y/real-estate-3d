# GLTF Loading Issues - Troubleshooting Guide

## Problem: "GLTF Files Do Not Load"

GLTF files (.gltf) are **text-based JSON files** that reference **external resources** like:
- `.bin` files (binary geometry and material data)
- `.jpg`, `.png` texture images
- Other external data files

When you upload a GLTF file without its dependencies, **Three.js cannot load it** because it's looking for files that don't exist.

### Example: lieutenantHead.gltf

The `lieutenantHead.gltf` file contains:
```json
{
  "buffers": [
    { "uri": "lieutenantHead.bin" }  // ❌ This file is missing!
  ],
  "images": [
    { "uri": "Assets/Models/PBR/lieutenantHead/Textures/Lieutenant_head_diffuse.jpg" }  // ❌ Missing!
  ]
}
```

When the browser tries to load this, it fails because:
1. `lieutenantHead.bin` doesn't exist in `/uploads/models/`
2. The texture images aren't uploaded

---

## Solutions

### ✅ **Solution 1: Use .GLB Format (RECOMMENDED)**

**GLB (GL Transmission Format Binary)** is a **single-file format** that includes everything:
- Geometry (embedded)
- Materials (embedded)
- Textures (embedded)  
- Animations (embedded)

**Advantages:**
- ✅ No external dependencies
- ✅ Single file to upload
- ✅ Works immediately
- ✅ Smaller file transfer in many cases
- ✅ Best browser support

**How:** Export your 3D model as `.glb` instead of `.gltf` in your 3D software:
- Blender: File → Export → glTF Binary (.glb)
- Maya/3ds Max: Export as "glTF - Binary Format"
- Babylon.js: Use native GLB export
- Sketchfab: Download as GLB

**Current working models in your project:**
```
✅ 3DModel_1765972125718-409298307.glb
✅ Animated Pistol_1768725574721-282723665.glb
✅ Bar Table_1768725568615-652158057.glb
✅ Character Animated_1768725492767-63875929.glb
✅ Chicken_1768739505698-726057633.glb
✅ low-poly-pine_1765972209072-680781186.glb
✅ low-poly-shark_1765972264798-639821677.glb
```

All these work perfectly because they're `.glb` files!

---

### ✅ **Solution 2: Auto-Embedding (Implemented)**

The app now includes **automatic GLTF resource embedding**:

1. **First load attempt:** Normal GLTF loading
2. **If that fails:** Auto-detect external dependencies
3. **Download resources:** Fetch missing .bin and texture files
4. **Embed as data URIs:** Convert resources to base64 inline
5. **Retry loading:** Attempt load with embedded resources

**How it works:**
```javascript
// Original GLTF references external files
{ "uri": "lieutenantHead.bin" }

// Auto-converted to embedded format
{ "uri": "data:application/octet-stream;base64,AAECAwQF..." }
```

**Limitations:**
- ⚠️ Requires CORS headers on backend (✅ your backend has this)
- ⚠️ Only works if resources are in the same directory as GLTF
- ⚠️ Slower first-time load (must fetch and convert resources)
- ⚠️ Larger resulting file (base64 is ~33% larger than binary)

**Currently embedding resources for:**
- `lieutenantHead_1769174378986-233778341.gltf` → Will auto-embed `lieutenantHead.bin` + textures
- `scene_1769174530597-320565942.gltf` → Will auto-embed any external dependencies

---

### ✅ **Solution 3: Multi-File Upload (Future Enhancement)**

Allow users to upload `.zip` files containing:
```
model.zip
├── model.gltf
├── model.bin
├── texture1.jpg
├── texture2.png
└── ...
```

Implementation would:
1. Accept `.zip` uploads
2. Extract all files to same directory
3. Register all extracted files
4. Load GLTF normally

---

### ✅ **Solution 4: GLTF → GLB Conversion**

Automatically convert uploaded GLTF to GLB server-side:
- Reads GLTF JSON
- Loads all external resources
- Packages as single GLB file
- No user effort required

---

## Troubleshooting Steps

### If GLTF still won't load:

1. **Check browser console** (F12 → Console):
   ```
   ✅ Shows "✅ 3D model loaded successfully" = Working
   ❌ Shows "Error loading GLB/GLTF model" = Not working
   ```

2. **Check Network tab** (F12 → Network):
   - Does the GLTF file load? (Status 200?)
   - Are external files requested? (Check for .bin files)
   - Do they return 404 or 200?

3. **Check resource links in GLTF**:
   ```bash
   # Open the .gltf file in VS Code and search for "uri"
   # You'll see what files it's looking for
   ```

4. **Verify file structure**:
   ```
   /uploads/models/
   ├── mymodel.gltf
   ├── mymodel.bin           ← Must exist!
   └── textures/
       ├── diffuse.jpg       ← Must exist!
       └── normal.jpg        ← Must exist!
   ```

---

## Current State

### ❌ Failing GLTF Files:
- `lieutenantHead_1769174378986-233778341.gltf` - Missing `lieutenantHead.bin`
- `scene_1769174530597-320565942.gltf` - Missing dependencies

### ✅ Working Formats:
- `.glb` files (all current models)
- `.ply` point clouds
- Procedurally generated models

### 🟡 Auto-Embedding:
- Now active in `modelLoader.js`
- Will attempt to fetch and embed missing resources
- Falls back with helpful error message if resources can't be found

---

## User Guidance for Uploads

### ✅ Recommended for Users:

1. **Export as GLB** (easiest)
   - Single file
   - Everything included
   - Works immediately

2. **Export as GLTF**
   - Keep all generated files together
   - Upload same folder contents
   - Or use as .zip

3. **Avoid:**
   - ❌ .gltf without .bin files
   - ❌ .gltf with missing textures
   - ❌ Broken reference paths in GLTF

### In Upload UI:
```
"Upload a 3D model (GLB, GLTF, or PLY)

💡 Tip: GLB format recommended
  - Single file with everything
  - Fastest to load
  
If uploading GLTF:
  - Include .bin and texture files
  - Or export as GLB instead"
```

---

## Technical Details

### GLTF Converter Service

New service: `src/services/gltfConverter.js` provides:

```javascript
// Check what resources a GLTF needs
const deps = checkGltfDependencies(gltfJson);
// → { hasDependencies: true, dependencies: ['model.bin', 'texture.jpg'] }

// Extract all referenced files
const resources = extractRequiredResources(gltfJson);
// → Map of filename → URL pairs

// Embed resources as data URIs
const embedded = await embedGltfResourcesFromUrl(gltfJson, baseUrl);
// → Self-contained GLTF that doesn't need external files
```

### Model Loader Integration

Updated: `src/services/modelLoader.js`

The `loadGLTFModel()` function now:
1. Tries normal load
2. On error, checks for missing dependencies
3. Attempts to fetch and embed them
4. Retries with embedded version
5. Provides helpful error message if all else fails

---

## Performance Impact

### Extra Time (first GLTF load only):
- Check dependencies: ~1ms
- Fetch resources: Variable (network latency)
- Convert to base64: ~10-100ms
- Load converted GLTF: Normal

### File Size:
- Original: `lieutenantHead.gltf` (33KB) + `lieutenantHead.bin` (~500KB)
- Auto-embedded: ~670KB (base64 encoding adds ~33%)
- Recommendation: Use GLB format (more efficient)

---

## See Also

- [MODEL_NORMALIZATION_GUIDE.md](MODEL_NORMALIZATION_GUIDE.md) - Model loading and positioning
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Backend/frontend setup
- [Three.js GLTFLoader docs](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
