/**
 * Kiri Engine API Service - 3D Model Processing
 * Proxy-first implementation with fallback support
 */

// Dynamic API base URL for production/development
const getKiriProxyBase = () => {
  const hostname = window.location.hostname;
  
  // Production: use Render backend
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    return 'https://realestate3d-backend.onrender.com/api/kiri';
  }
  
  // Development: use localhost or local network IP
  return `http://${hostname}:5000/api/kiri`;
};

const KIRI_API_BASE = 'https://api.kiriengine.app/api/v1/open';
const USE_MOCK_MODE = process.env.REACT_APP_USE_MOCK_KIRI === 'true';
const kiriJobContext = new Map();

const buildBaseVariants = () => {
  const variants = [KIRI_API_BASE];

  if (KIRI_API_BASE.endsWith('/open')) {
    variants.push(KIRI_API_BASE.replace(/\/open$/, ''));
  }

  if (KIRI_API_BASE.includes('/api/v1/open')) {
    variants.push(KIRI_API_BASE.replace('/api/v1/open', '/api/v1'));
  }

  return [...new Set(variants)];
};

const extractJobIdentifier = (payload) => {
  const data = payload?.data || {};
  return (
    data.serialize ||
    data.serialNumber ||
    data.serial ||
    data.taskId ||
    data.id ||
    payload?.serialize ||
    payload?.serialNumber ||
    payload?.serial ||
    payload?.taskId ||
    payload?.id ||
    null
  );
};

const saveJobContext = (jobId, payload) => {
  if (!jobId || !payload) return;
  const data = payload?.data || {};
  const previous = kiriJobContext.get(jobId) || {};

  kiriJobContext.set(jobId, {
    ...previous,
    statusUrl: data.statusUrl || data.status_url || data.queryUrl || null,
    downloadUrl: data.downloadUrl || data.download_url || null,
    statusRouteUnsupported: previous.statusRouteUnsupported || false,
    rejectedReadinessUrls: previous.rejectedReadinessUrls || [],
  });
};

const buildStatusCandidates = (serialNumber) => {
  const context = kiriJobContext.get(serialNumber) || {};
  if (context.statusRouteUnsupported) return [];

  const encodedSerial = encodeURIComponent(serialNumber);
  const candidateMap = new Map();

  const pushCandidate = (candidate) => {
    if (!candidate?.url) return;
    const method = (candidate.method || 'GET').toUpperCase();
    let bodyKey = '';
    if (typeof candidate.body === 'string') {
      bodyKey = candidate.body;
    } else if (candidate.body) {
      bodyKey = '[body]';
    }
    const key = `${method}:${candidate.url}:${bodyKey}`;
    if (!candidateMap.has(key)) {
      candidateMap.set(key, {
        method,
        url: candidate.url,
        body: candidate.body,
        headers: candidate.headers,
      });
    }
  };

  if (context.preferredStatusRequest?.url) {
    pushCandidate(context.preferredStatusRequest);
  }

  if (context.statusUrl) {
    pushCandidate({ url: context.statusUrl, method: 'GET' });
  }

  buildBaseVariants().forEach((base) => {
    pushCandidate({ url: `${base}/3dgs/model?serialize=${encodedSerial}`, method: 'GET' });
    pushCandidate({ url: `${base}/model?serialize=${encodedSerial}`, method: 'GET' });
    pushCandidate({ url: `${base}/3dgs/${serialNumber}`, method: 'GET' });
  });

  return [...candidateMap.values()];
};

const buildDownloadCandidates = (serialNumber, options = {}) => {
  const includeAggressive = options.includeAggressive !== false;
  const context = kiriJobContext.get(serialNumber) || {};
  const rejectedReadinessUrls = new Set(context.rejectedReadinessUrls || []);
  const encodedSerial = encodeURIComponent(serialNumber);

  const directCandidates = [
    context.preferredDownloadRequest?.url,
    context.downloadUrl,
    `${KIRI_API_BASE}/3dgs/model?serialize=${encodedSerial}`,
    `${KIRI_API_BASE}/model?serialize=${encodedSerial}`,
    ...(includeAggressive
      ? [
          `${KIRI_API_BASE}/3dgs/${serialNumber}/download`,
          `${KIRI_API_BASE}/3dgs/model/${serialNumber}/download`,
          `${KIRI_API_BASE}/model/${serialNumber}/download`,
        ]
      : []),
  ].filter(Boolean);

  const variantCandidates = buildBaseVariants().flatMap((base) => [
    `${base}/3dgs/model?serialize=${encodedSerial}`,
    `${base}/model?serialize=${encodedSerial}`,
    ...(includeAggressive
      ? [
          `${base}/3dgs/${serialNumber}/download`,
          `${base}/3dgs/model/${serialNumber}/download`,
          `${base}/model/${serialNumber}/download`,
        ]
      : []),
  ]);

  return [...new Set([...directCandidates, ...variantCandidates])].filter((url) => !rejectedReadinessUrls.has(url));
};

const parseResponseBody = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return { json: null, text: '' };
  }

  try {
    return { json: JSON.parse(rawText), text: rawText };
  } catch {
    return { json: null, text: rawText };
  }
};

const requestJsonWithFallback = async (candidates, apiKey, operationLabel) => {
  let lastError = null;
  let lastResponseText = '';

  const normalizedCandidates = (candidates || [])
    .map((candidate) => {
      if (typeof candidate === 'string') {
        return { method: 'GET', url: candidate };
      }

      return {
        method: (candidate.method || 'GET').toUpperCase(),
        url: candidate.url,
        body: candidate.body,
        headers: candidate.headers,
      };
    })
    .filter((candidate) => candidate.url);

  for (const candidate of normalizedCandidates) {
    const { method, url, body, headers: candidateHeaders } = candidate;

    try {
      const requestHeaders = {
        Authorization: `Bearer ${apiKey}`,
      };

      if (candidateHeaders) {
        Object.assign(requestHeaders, candidateHeaders);
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
      });

      const { json, text } = await parseResponseBody(response);
      const providerMessage = json?.msg || json?.message || json?.error || text || '';
      lastResponseText = providerMessage;

      if (response.ok) {
        return { url, data: json || { raw: text }, request: candidate };
      }

      const errorText = providerMessage || `${response.status} ${response.statusText}`;

      if ([401, 403].includes(response.status)) {
        throw new Error(`${operationLabel} auth failed: ${errorText}`);
      }

      const routeMissing = /no static resource|not found|cannot\s+get|method not allowed|unsupported/i.test(errorText);
      if (routeMissing || [404, 405, 500].includes(response.status)) {
        lastError = new Error(`${operationLabel} endpoint rejected (${response.status}): ${errorText}`);
        continue;
      }

      throw new Error(`${operationLabel} failed (${response.status}): ${errorText}`);
    } catch (error) {
      if (/auth failed/i.test(error.message)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (!lastError && lastResponseText) {
    throw new Error(`${operationLabel} failed: ${lastResponseText}`);
  }

  throw lastError || new Error(`${operationLabel} failed on all endpoint variants`);
};

const extractStatusFromPayload = (payload) => {
  const data = payload?.data || payload || {};
  const rawStatus = data.status ?? data.state ?? data.progressStatus;

  if (typeof rawStatus === 'number') return rawStatus;

  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.toLowerCase();
    if (['queued', 'pending', 'waiting'].includes(normalized)) return 0;
    if (['processing', 'running', 'in_progress'].includes(normalized)) return 1;
    if (['complete', 'completed', 'success', 'done', 'finished'].includes(normalized)) return 2;
    if (['failed', 'error'].includes(normalized)) return 3;
  }

  return null;
};

const extractProgressFromPayload = (payload) => {
  const data = payload?.data || payload || {};
  const progress = data.progress ?? data.percentage ?? data.percent;
  return typeof progress === 'number' ? progress : undefined;
};

const validateApiKey = (apiKey) => {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key is required. Please set it in Settings.');
  }

  if (apiKey.length < 20) {
    console.warn('[Kiri Engine] API key seems too short - verify it is correct');
  }

  return apiKey.trim();
};

const generateMockSerialNumber = () => {
  return `MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

export const uploadToKiriEngine = async (capturedFrames, apiKey) => {
  if (capturedFrames.length < 20) {
    throw new Error('Please capture at least 20 images for Kiri Engine processing');
  }

  if (USE_MOCK_MODE && !apiKey) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockSerialNumber());
      }, 1500);
    });
  }

  apiKey = validateApiKey(apiKey);

  const formData = new FormData();
  formData.append('isMesh', '1');
  formData.append('isMask', '0');
  formData.append('fileFormat', 'GLB');

  for (let i = 0; i < capturedFrames.length; i++) {
    const frame = capturedFrames[i];
    let blob;

    if (frame instanceof File || frame instanceof Blob) {
      blob = frame;
    } else if (typeof frame === 'string') {
      const response = await fetch(frame);
      blob = await response.blob();
    } else {
      throw new TypeError(`Invalid image format at index ${i}`);
    }

    if (!blob.size) {
      throw new Error(`Image ${i + 1} is empty (0 bytes)`);
    }

    formData.append('images', blob, `image_${i}.jpg`);
  }

  const KIRI_PROXY_BASE = getKiriProxyBase();

  const uploadResponse = await fetch(`${KIRI_PROXY_BASE}/upload`, {
    method: 'POST',
    headers: {
      'x-kiri-api-key': apiKey,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    let errorMessage = `Upload failed with status ${uploadResponse.status}`;
    try {
      const rawText = await uploadResponse.text();
      if (rawText) {
        try {
          const errorData = JSON.parse(rawText);
          errorMessage =
            errorData.error ||
            errorData.msg ||
            errorData.message ||
            errorData.details ||
            errorMessage;
        } catch {
          errorMessage = rawText.trim();
        }
      }
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  const data = await uploadResponse.json();
  const jobId = extractJobIdentifier(data);
  if (!jobId) {
    throw new Error('Invalid response from Kiri Engine - no serial number returned');
  }

  saveJobContext(jobId, data);
  return jobId;
};

export const checkKiriStatus = async (serialNumber, apiKey) => {
  if (serialNumber.startsWith('MOCK_') || (USE_MOCK_MODE && !apiKey)) {
    const mockStatuses = [0, 0, 0, 1, 1, 1, 2];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    const progress = randomStatus === 1 ? Math.floor(Math.random() * 100) : randomStatus === 2 ? 100 : 0;
    return { status: randomStatus, progress };
  }

  if (!apiKey) {
    throw new Error('API key is required for status check');
  }

  const KIRI_PROXY_BASE = getKiriProxyBase();

  const proxyResponse = await fetch(`${KIRI_PROXY_BASE}/status/${encodeURIComponent(serialNumber)}`, {
    method: 'GET',
    headers: {
      'x-kiri-api-key': apiKey,
    },
  });

  if (!proxyResponse.ok) {
    const proxyError = await proxyResponse.json().catch(() => ({}));
    throw new Error(proxyError?.error || `Status check failed with status ${proxyResponse.status}`);
  }

  const proxyData = await proxyResponse.json();
  const payload = proxyData?.data || proxyData;
  let status = extractStatusFromPayload(payload);
  const progress = extractProgressFromPayload(payload);

  if (status === null && (payload?.data?.downloadUrl || payload?.downloadUrl || payload?.data?.url || payload?.url)) {
    status = 2;
  }

  if (status === null) {
    const candidates = buildStatusCandidates(serialNumber);
    if (candidates.length === 0) {
      return { status: 1, progress };
    }
    return { status: 1, progress };
  }

  return { status, progress };
};

export const downloadKiriModel = async (serialNumber, apiKey) => {
  if (serialNumber.startsWith('MOCK_') || (USE_MOCK_MODE && !apiKey)) {
    throw new Error('Mock mode is active. Please enter your Kiri Engine API key in Settings to generate real 3D models.');
  }

  if (!apiKey) {
    throw new Error('API key is required for model download');
  }

  const KIRI_PROXY_BASE = getKiriProxyBase();

  const proxyDownloadResponse = await fetch(`${KIRI_PROXY_BASE}/download/${encodeURIComponent(serialNumber)}`, {
    method: 'GET',
    headers: {
      'x-kiri-api-key': apiKey,
    },
  });

  if (!proxyDownloadResponse.ok) {
    const proxyError = await proxyDownloadResponse.json().catch(() => ({}));
    throw new Error(proxyError?.error || 'Failed to download model via backend proxy');
  }

  const proxyBlob = await proxyDownloadResponse.blob();
  return URL.createObjectURL(proxyBlob);
};

export const testKiriConnection = async (apiKey) => {
  apiKey = validateApiKey(apiKey);

  const KIRI_PROXY_BASE = getKiriProxyBase();

  const proxyResponse = await fetch(`${KIRI_PROXY_BASE}/test`, {
    method: 'GET',
    headers: {
      'x-kiri-api-key': apiKey,
    },
  });

  const proxyData = await proxyResponse.json().catch(() => ({}));
  if (!proxyResponse.ok || proxyData?.success === false) {
    throw new Error(proxyData?.error || 'Unable to connect to Kiri Engine.');
  }

  return {
    success: true,
    message: proxyData?.message || 'Connected to Kiri Engine successfully.',
    endpoint: proxyData?.endpoint || `${KIRI_PROXY_BASE}/test`,
    details: proxyData,
  };
};
