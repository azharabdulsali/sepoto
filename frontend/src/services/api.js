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
  loginUnified: (username, password, eventId = null) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, eventId }),
    }),

  // Legacy login endpoints (kept for backward compatibility)
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

  getAllUsers: (eventId = '') => fetchApi(`/auth/users${eventId ? `?eventId=${eventId}` : ''}`),

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
  getPhotos: (bib = '', eventId = '') => {
    const params = new URLSearchParams();
    if (bib) params.append('bib', bib);
    if (eventId) params.append('eventId', eventId);
    const queryString = params.toString();
    return fetchApi(`/photos${queryString ? `?${queryString}` : ''}`);
  },

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

  updatePhoto: (photoId, data) =>
    fetchApi(`/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePhoto: (photoId) =>
    fetchApi(`/photos/${photoId}`, {
      method: 'DELETE',
    }),

  getAdminPhotos: (eventId = '') => fetchApi(`/photos/admin${eventId ? `?eventId=${eventId}` : ''}`),

  updatePhotoAdmin: (photoId, data) =>
    fetchApi(`/photos/admin/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  bulkUpdatePhotosAdmin: (data) =>
    fetchApi('/photos/admin/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePhotoAdmin: (photoId) =>
    fetchApi(`/photos/admin/${photoId}`, {
      method: 'DELETE',
    }),

  // ─── Events API ────────────────────────────────────────────────────────
  getActiveEvent: (eventId = '') => fetchApi(`/events/active${eventId ? `?eventId=${eventId}` : ''}`),

  getAllEvents: () => fetchApi('/events'),

  createEvent: (data) =>
    fetchApi('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (id, data) =>
    fetchApi(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadQrisImage: (eventId, file) => {
    const formData = new FormData();
    formData.append('qrisImage', file);

    const token = localStorage.getItem('sepoto_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/events/${eventId}/qris`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal unggah QRIS.');
      return data;
    });
  },

  toggleEventActive: (id, isActive) =>
    fetchApi(`/events/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // ─── Transactions API ──────────────────────────────────────────────────
  getNextOrderNumber: (eventId = '') => fetchApi(`/transactions/next-order-number${eventId ? `?eventId=${eventId}` : ''}`),

  createTransaction: (data) =>
    fetchApi('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTransactions: (eventId = '') => fetchApi(`/transactions${eventId ? `?eventId=${eventId}` : ''}`),

  getMyTransactions: () => fetchApi('/transactions/my'),
  getUserTransactions: () => fetchApi('/transactions/my'),

  updateTransactionStatus: (id, status) =>
    fetchApi(`/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  uploadPaymentProof: (transactionId, file) => {
    const formData = new FormData();
    formData.append('proof', file);

    const token = localStorage.getItem('sepoto_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}/transactions/${transactionId}/proof`, {
      method: 'PATCH',
      headers,
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal upload bukti pembayaran.');
      return data;
    });
  },

  getDownloadUrl: (transactionId, photoId) =>
    fetchApi(`/transactions/${transactionId}/download/${photoId}`),
};
