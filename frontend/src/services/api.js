const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper: Ambil token JWT dari localStorage
 */
const getToken = () => localStorage.getItem('sepoto_token');

/**
 * Base fetch wrapper dengan auto JWT header
 */
export async function fetchApi(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Tambahkan Authorization header jika token ada
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return { success: false, message: 'Gagal terhubung ke server backend.' };
  }
}

/**
 * Fetch tanpa Content-Type header (untuk FormData/multipart uploads)
 */
export async function fetchApiMultipart(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return { success: false, message: 'Gagal terhubung ke server backend.' };
  }
}

export const api = {
  // ─── Auth API ──────────────────────────────────────────────────────────
  loginUser: (name, bibNumber) =>
    fetchApi('/auth/login-user', {
      method: 'POST',
      body: JSON.stringify({ name, bibNumber }),
    }),

  loginAdmin: (username, password) =>
    fetchApi('/auth/login-admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  loginPhotographer: (username, password) =>
    fetchApi('/auth/login-photographer', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => fetchApi('/auth/me'),

  getAllUsers: () => fetchApi('/auth/users'),

  createUser: (data) =>
    fetchApi('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id, data) =>
    fetchApi(`/auth/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id) =>
    fetchApi(`/auth/users/${id}`, {
      method: 'DELETE',
    }),

  // ─── Photos API ────────────────────────────────────────────────────────
  getPhotos: (bib = '') => fetchApi(`/photos${bib ? `?bib=${encodeURIComponent(bib)}` : ''}`),

  getMyPhotos: () => fetchApi('/photos/my'),

  uploadPhotos: (formData) =>
    fetchApiMultipart('/photos/upload', {
      method: 'POST',
      body: formData,
    }),

  updatePhotoPrice: (photoId, price) =>
    fetchApi(`/photos/${photoId}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ price }),
    }),

  deletePhoto: (photoId) =>
    fetchApi(`/photos/${photoId}`, {
      method: 'DELETE',
    }),

  // ─── Events API ────────────────────────────────────────────────────────
  getActiveEvent: () => fetchApi('/events/active'),

  updateEvent: (id, data) =>
    fetchApi(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleEventActive: (id, isActive) =>
    fetchApi(`/events/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // ─── Transactions API ──────────────────────────────────────────────────
  createTransaction: (data) =>
    fetchApi('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTransactions: () => fetchApi('/transactions'),

  getMyTransactions: () => fetchApi('/transactions/my'),

  updateTransactionStatus: (id, status) =>
    fetchApi(`/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getDownloadUrl: (transactionId, photoId) =>
    fetchApi(`/transactions/${transactionId}/download/${photoId}`),
};
