const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

function normalizeBaseUrl(baseUrl) {
  const raw = String(baseUrl || '').trim();
  if (!raw) return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function joinUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return path;
  const p = String(path || '');
  if (!p) return base;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
}

function apiUrl(path) {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'http://127.0.0.1:5000' : '');
  return joinUrl(apiBaseUrl, path);
}

// Hand a Blob to the browser as a file download.
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// GET a file endpoint (e.g. a CSV report) and return it as a Blob. Failures still come back
// as the JSON envelope, so their message is thrown like apiRequest's.
export async function apiDownload(path, { token, timeoutMs = 60000 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), Math.max(0, Number(timeoutMs) || 0));
  try {
    const res = await fetch(apiUrl(path), { headers, signal: ac.signal });
    if (!res.ok) {
      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      const error = new Error(json?.message || `Download failed (${res.status})`);
      error.status = res.status;
      error.details = json;
      throw error;
    }
    return await res.blob();
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('Download timed out');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest(path, { token, method = 'GET', body, timeoutMs = 15000 } = {}) {
  const headers = { ...DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = apiUrl(path);

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), Math.max(0, Number(timeoutMs) || 0));

  let res;
  try {
    res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.details = json;
    throw error;
  }

  // API uses { success, message, data }
  if (json && typeof json === 'object' && 'success' in json) {
    if (!json.success) {
      const error = new Error(json.message || 'Request failed');
      error.status = res.status;
      error.details = json;
      throw error;
    }
    return json.data;
  }

  return json;
}
