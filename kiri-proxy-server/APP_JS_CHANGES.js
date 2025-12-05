// ============================================================
// UPDATED KIRI ENGINE FUNCTIONS FOR App.js
// Replace the existing Kiri functions (lines ~495-681) with these
// ============================================================

// Add this constant at the top of your component (after the state declarations)
const PROXY_URL = 'http://localhost:3001';

// Replace the existing uploadToKiriEngine function with this:
const uploadToKiriEngine = async () => {
  if (!kiriApiKey) {
    alert('Please set your Kiri Engine API key in Settings first!');
    setShowSettingsModal(true);
    return;
  }

  if (capturedFrames.length < 20) {
    alert('Please capture at least 20 images for Kiri Engine processing!');
    return;
  }

  try {
    setIsProcessingKiri(true);
    setKiriStatus('Uploading images to Kiri Engine...');
    setKiriProgress(10);

    // Create FormData for our proxy server
    const formData = new FormData();
    formData.append('isMesh', '1');
    formData.append('isMask', '0');
    formData.append('fileFormat', 'glb');

    // Convert dataURL frames to blobs and append to formData
    for (let i = 0; i < capturedFrames.length; i++) {
      const response = await fetch(capturedFrames[i]);
      const blob = await response.blob();
      formData.append('images', blob, `image_${i}.jpg`);
    }

    // Send to our proxy server (not directly to Kiri)
    const uploadResponse = await fetch(`${PROXY_URL}/api/kiri/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kiriApiKey}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.msg || 'Failed to upload images');
    }

    const data = await uploadResponse.json();
    
    if (data.ok && data.data.serialize) {
      setKiriStatus('Upload successful! Processing started...');
      setKiriProgress(30);
      pollKiriStatus(data.data.serialize);
    } else {
      throw new Error(data.msg || 'Invalid response from Kiri Engine');
    }
  } catch (error) {
    console.error('Kiri Engine upload error:', error);
    alert(`Upload failed: ${error.message}`);
    setIsProcessingKiri(false);
    setKiriStatus('');
    setKiriProgress(0);
  }
};

// Replace the existing pollKiriStatus function with this:
const pollKiriStatus = async (serialNumber) => {
  const maxAttempts = 120;
  let attempts = 0;

  const checkStatus = async () => {
    try {
      // Use proxy server instead of direct Kiri API
      const response = await fetch(
        `${PROXY_URL}/api/kiri/status/${serialNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kiriApiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const data = await response.json();
      
      if (data.ok && data.data) {
        const status = data.data.status;
        
        switch (status) {
          case 0:
            setKiriStatus('Queued for processing...');
            setKiriProgress(35);
            break;
          case 1:
            setKiriStatus('Processing 3D model...');
            setKiriProgress(50 + (attempts * 0.3));
            break;
          case 2:
            setKiriStatus('Processing complete! Downloading...');
            setKiriProgress(90);
            await downloadKiriModel(serialNumber);
            return;
          case 3:
            throw new Error('Processing failed');
          default:
            setKiriStatus('Unknown status');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          throw new Error('Processing timeout');
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      setKiriStatus(`Error: ${error.message}`);
      setIsProcessingKiri(false);
      alert(`Processing failed: ${error.message}`);
    }
  };

  checkStatus();
};

// Replace the existing downloadKiriModel function with this:
const downloadKiriModel = async (serialNumber) => {
  try {
    // Use proxy server instead of direct Kiri API
    const response = await fetch(
      `${PROXY_URL}/api/kiri/download/${serialNumber}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kiriApiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get download link');
    }

    const data = await response.json();
    
    if (data.ok && data.data && data.data.downloadUrl) {
      setKiriProgress(95);
      setKiriStatus('Downloading model file...');
      
      // Download the actual model file
      const modelResponse = await fetch(data.data.downloadUrl);
      const blob = await modelResponse.blob();
      
      const newProperty = {
        id: Date.now(),
        title: `Kiri Scanned Property ${properties.length + 1}`,
        location: 'Location TBD',
        price: 'Price TBD',
        image: capturedFrames[0],
        type: 'kiri-scan',
        beds: 0,
        baths: 0,
        sqft: 'N/A',
        modelUrl: URL.createObjectURL(blob),
        fileType: 'gltf',
        serialNumber: serialNumber
      };
      
      setProperties([newProperty, ...properties]);
      
      setKiriProgress(100);
      setKiriStatus('Complete!');
      
      setTimeout(() => {
        setIsProcessingKiri(false);
        setKiriStatus('');
        setKiriProgress(0);
        setShowScanModal(false);
        stopCamera();
        setCapturedFrames([]);
        alert('3D model created successfully with Kiri Engine!');
      }, 1500);
    } else {
      throw new Error('No download URL in response');
    }
  } catch (error) {
    console.error('Download error:', error);
    alert(`Download failed: ${error.message}`);
    setIsProcessingKiri(false);
    setKiriStatus('');
    setKiriProgress(0);
  }
};


// ============================================================
// ALSO UPDATE: Change totalFrames from 15 to 25
// Find this line (around line 449):
//   const totalFrames = 15;
// Change it to:
//   const totalFrames = 25;
// ============================================================
