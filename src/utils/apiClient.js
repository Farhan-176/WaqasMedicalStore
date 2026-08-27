/**
 * Centralized API Fetch Client with Automatic JWT Injection and 401/403 Eviction
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const savedUser = localStorage.getItem('wms_admin_user');
  let token = null;
  if (savedUser) {
    try {
      token = JSON.parse(savedUser)?.token;
    } catch (e) {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Central HTTP 401 Unauthorized or 403 Forbidden Interceptor
    if (response.status === 401 || response.status === 403) {
      if (token) {
        console.warn('Authentication token expired or rejected by server. Clearing cached credentials.');
        localStorage.removeItem('wms_admin_user');
        // Dispatch custom event for UI reactivity
        window.dispatchEvent(new CustomEvent('wms:auth-invalidated'));
      }
    }

    return response;
  } catch (error) {
    console.error(`API Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export default apiClient;
