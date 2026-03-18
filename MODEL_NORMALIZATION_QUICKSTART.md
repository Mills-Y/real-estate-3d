# Model Normalization - Quick Reference & Implementation Checklist

## 🚀 Quick Start (5 Minutes)

### The Three Files Your App Created:

1. **`src/services/modelNormalizer.js`** - Core normalization logic
2. **`src/services/fileValidator.js`** - File validation before upload
3. **`backend/utils/modelValidator.js`** - Backend file validation

### Already Integrated:
- ✅ `src/services/modelLoader.js` - Updated to use normalizer

## 📋 Implementation Checklist

### Phase 1: Basic Integration (Already Done ✅)
- [x] Create modelNormalizer.js service
- [x] Create fileValidator.js service
- [x] Create backend modelValidator.js
- [x] Update modelLoader.js to use normalizer
- [x] Models automatically centered and scaled on load

### Phase 2: Optional - Frontend Validation UI
Add these to your upload component:

```jsx
// In UploadModal.jsx or similar
import { validateModelFile } from '../services/fileValidator';

// Add to file select handler
const onFileSelect = async (file) => {
  const validation = await validateModelFile(file);
  
  if (validation.warnings.length > 0) {
    setWarnings(validation.warnings);
  }
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  // Safe to upload
  handleUpload(file);
};
```

### Phase 3: Optional - Backend Integration
Add validation to upload route:

```javascript
// In backend/routes/upload.js
import { validateUploadedModel } from '../utils/modelValidator.js';

// After file received
const validation = await validateUploadedModel(req.file.path, fileType);

if (!validation.isValid) {
  await fs.unlink(req.file.path);
  return res.status(400).json({ 
    success: false, 
    error: 'Model validation failed',
    details: validation.errors 
  });
}
```

## 📚 What Each Function Does

### Model Normalization (modelNormalizer.js)

| Function | What It Does | Use Case |
|----------|--------------|----------|
| `validateModel()` | Checks if model has valid dimensions | Before loading in 3D view |
| `normalizeModel()` | Centers model at (0,0,0) and scales if needed | Load any user model |
| `centerModel()` | Just centers without scaling | When you want to preserve original scale |
| `getModelMetrics()` | Gets size, center, volume info | Debugging, UI display |
| `optimizeModel()` | Runs full pipeline: validate → normalize → metrics | Complete model prep |

### File Validation (fileValidator.js)

| Function | What It Does | Use Case |
|----------|--------------|----------|
| `validateFilePreUpload()` | Checks file size, extension | Before sending to server |
| `validateFileHeader()` | Reads first bytes to verify format | Detect corrupted files |
| `validateModelFile()` | Complete validation | Pre-upload check |
| `formatFileSize()` | Converts bytes to readable format | UI display |
| `createValidationMessage()` | Creates error/warning message | Show to user |

### Backend Validation (modelValidator.js)

| Function | What It Does | Use Case |
|----------|--------------|----------|
| `validateUploadedModel()` | Full server-side validation | In upload endpoint |
| `validateFileSignature()` | Checks file magic bytes | Detect format mismatches |
| `validateFileSize()` | Checks against size limits | Enforce limits |
| `validateGLBStructure()` | GLB-specific validation | GLB files |
| `extractPLYMetadata()` | Parse PLY header | PLY files |

## 🔧 Common Customizations

### Change Model Size Limits

```javascript
// In modelNormalizer.js, modify NORMALIZATION_CONFIG:

NORMALIZATION_CONFIG = {
  MIN_MODEL_SIZE: 0.1,  // Allow smaller models
  MAX_MODEL_SIZE: 200,  // Allow larger models
  TARGET_MODEL_SIZE: 20, // Scale to 20 units instead of 10
  // ...
};
```

### Change Spawn Height

```javascript
// In modelNormalizer.js:
SPAWN_HEIGHT_ABOVE_GRID: 1.0,  // Position 1 unit above grid (was 0.1)
```

### Disable Auto-Scaling

```javascript
// When normalizing:
const config = { AUTO_SCALE_EXTREME_MODELS: false };
normalizeModel(model, config);
```

### Disable Validation

```javascript
// To skip validation:
const config = { VALIDATE_ON_UPLOAD: false };
optimizeModel(model, config);
```

### Increase File Size Limit

```javascript
// In fileValidator.js:
FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE_MB: 1000, // Allow up to 1 GB
};
```

## 🎯 Usage Patterns

### Pattern 1: Load and Display Model
```javascript
// Already happens in modelLoader.js, but here's the concept:
const result = await loadGLTFModel(url, scene, camera);
console.log('Model normalized:', result.normalization);
console.log('Validation passed:', result.validation.isValid);
```

### Pattern 2: Validate File Before Upload
```javascript
// Use in upload component:
const file = event.target.files[0];
const validation = await validateModelFile(file);
if (validation.isValid) {
  uploadToServer(file);
}
```

### Pattern 3: Validate on Server
```javascript
// Use in express route:
const validation = await validateUploadedModel(filepath, 'GLB');
if (validation.isValid) {
  saveToDatabase(filepath, validation.metadata);
}
```

### Pattern 4: Get Model Info for UI
```javascript
// Display in info panel:
const metrics = getModelMetrics(model);
console.log(`Size: ${metrics.maxDim.toFixed(2)} units`);
console.log(`Center: (${metrics.center.x}, ${metrics.center.y}, ${metrics.center.z})`);
```

## 📊 Default Behavior

### What Happens When You Load a Model:

1. **Validation** - Model is checked for valid geometry
2. **Normalization** - Model is centered at (0, 0, 0)
3. **Scaling** - If very large/small, auto-scaled to ~10 units
4. **Positioning** - Placed 0.1 units above grid to avoid z-fighting
5. **Camera** - Automatically positioned to view entire model

### What Gets Logged:

```
✅ PLY model loaded successfully
Has colors: Yes
Vertex count: 1000

📊 PLY Model Normalization: {
  scale: 2.5,
  normalized: true,
  originalSize: { x: 50, y: 30, z: 40 },
  newSize: { x: 20, y: 12, z: 16 }
}
```

## ⚠️ Warnings You Might See

| Warning | Meaning | What to Do |
|---------|---------|-----------|
| "Model is very small" | Diameter < 0.5 units | Auto-scaled by 10x-100x |
| "Model is large" | Diameter > 150 units | Check if intentional |
| "Model appears very flat" | Thickness << width | Verify file loaded correctly |
| "File header does not match GLB" | File might be corrupted | Re-export from source |
| "Large file (250 MB)" | Upload takes time | Consider optimization |

## 🚫 Errors That Block Upload

| Error | Cause | Solution |
|-------|-------|----------|
| "Model geometry invalid" | Corrupted or empty file | Verify file integrity |
| "Model exceeds maximum size" | > 500 units | Scale down in 3D software |
| "File exceeds maximum size" | > 500 MB | Compress or optimize model |
| "Unsupported file format" | Not .glb/.gltf/.ply | Use correct format |
| "File too small" | < 1 KB | Verify file wasn't truncated |

## 🔍 Debugging Tips

### See All Details About a Model:
```javascript
import { optimizeModel, generateNormalizationReport } from './services/modelNormalizer';

const result = optimizeModel(model);
console.log(generateNormalizationReport(result));
```

### See Validation Details:
```javascript
import { validateModelFile, generateFileValidationReport } from './services/fileValidator';

const validation = await validateModelFile(file);
const report = generateFileValidationReport(validation, file.name);
console.log(report);
```

### See Backend Validation:
```javascript
// In your server logs, check upload errors and validation reports
console.log(createValidationReport(result, filename));
```

## 📋 Testing Checklist

- [ ] Upload a normal-sized model → Should work fine
- [ ] Upload a very small model (< 1 MB) → Auto-scaled up
- [ ] Upload a very large model (> 500 MB) → Should be rejected
- [ ] Upload a corrupted file → Should show error
- [ ] Check console → Should see normalization logs
- [ ] Open Model Viewer → Model should be centered
- [ ] Check model dimensions → Should be in reasonable range
- [ ] Test GLB, GLTF, and PLY files → All should work

## 🎓 Key Concepts

### Bounding Box
The invisible box that tightly fits around your model. Used to:
- Calculate center point
- Determine size
- Set spawn height

### Auto-Scaling
When a model is detected as:
- **Too small** (< 0.5 units) → Scaled UP
- **Too large** (> 500 units) → Scaled DOWN
- To target of ~10 units diagonal

### Spawn Point
Height where model appears:
- Default: 0.1 units above grid
- Prevents z-fighting (visual artifacts)
- Ensures model appears "on" the ground

### Normalization
The complete process:
1. Center at (0, 0, 0)
2. Apply scaling if needed
3. Set spawn height
4. Make model "ready" for viewing

## 📞 Quick Troubleshooting

**Q: Model loads but appears tiny**
A: Model was very small, auto-scaled by normalizer (10-100x)

**Q: Model won't upload**
A: Check console for validation error, file might be corrupted

**Q: Model position looks wrong**
A: Ensure normalizeModel() was called (automatic in loadGLTFModel)

**Q: Upload shows warnings but still uploads**
A: Warnings don't block upload, just inform user

**Q: Want to disable normalization**
A: Set `AUTO_SCALE_EXTREME_MODELS: false` in config, but not recommended

## 💡 Pro Tips

1. **Always validate before upload** - Catches issues early
2. **Check console logs** - See detailed normalization info
3. **Use metrics for UI** - Display model size, center info
4. **Keep validation enabled** - Prevents corrupted models in DB
5. **Test with real files** - Different sources may have different properties

## 📞 Need More Info?

See **MODEL_NORMALIZATION_GUIDE.md** for:
- Detailed API reference
- Integration examples
- Configuration options
- Workflow diagrams
- Common use cases
