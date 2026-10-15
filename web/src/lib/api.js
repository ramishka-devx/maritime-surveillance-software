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

export async function apiRequest(path, { token, method = 'GET', body, timeoutMs = 15000 } = {}) {
  const headers = { ...DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'http://127.0.0.1:5000' : '');
  const url = joinUrl(apiBaseUrl, path);

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
