const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const headers = { ...DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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
