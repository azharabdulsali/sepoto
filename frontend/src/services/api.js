const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

    if (res.status === 503 && data.maintenance) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/maintenance') &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/maintenance';
      }
    }

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
  loginUnified: (payload, password = null, eventId = null) => {
    let bodyObj = {};
    if (typeof payload === 'object' && payload !== null) {
      bodyObj = payload;
    } else {
      bodyObj = { username: payload, password, eventId };
    }
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(bodyObj),
    });
  },

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

  getAllUsers: (eventId = '', page = null, limit = null) => {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    const q = params.toString();
    return fetchApi(`/auth/users${q ? `?${q}` : ''}`);
  },

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

  bulkDeleteUsers: (ids) =>
    fetchApi('/auth/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  importParticipants: (data) =>
    fetchApi('/auth/users/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ─── Photos API ────────────────────────────────────────────────────────
  getPhotos: (bib = '', eventId = '', page = null, limit = null) => {
    const params = new URLSearchParams();
    if (bib) params.append('bib', bib);
    if (eventId) params.append('eventId', eventId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    const queryString = params.toString();
    return fetchApi(`/photos${queryString ? `?${queryString}` : ''}`);
  },

  getMyPhotos: (page = null, limit = null) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    const q = params.toString();
    return fetchApi(`/photos/my${q ? `?${q}` : ''}`);
  },

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

  getAdminPhotos: (eventId = '', page = null, limit = null) => {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    const q = params.toString();
    return fetchApi(`/photos/admin${q ? `?${q}` : ''}`);
  },

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

  deleteAllEventPhotos: (eventId, password, eventTitle) =>
    fetchApi(`/photos/admin/event/${eventId}/all`, {
      method: 'DELETE',
      body: JSON.stringify({ password, eventTitle }),
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

  uploadEventBanner: (eventId, file) => {
    const formData = new FormData();
    formData.append('bannerImage', file);

    const token = localStorage.getItem('sepoto_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/events/${eventId}/banner`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal unggah gambar event.');
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

  getTransactions: (eventId = '', page = null, limit = null) => {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    const q = params.toString();
    return fetchApi(`/transactions${q ? `?${q}` : ''}`);
  },

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

  downloadTransactionZipBlob: async (transactionId) => {
    const token = localStorage.getItem('sepoto_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/download-zip`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'Gagal mengunduh file ZIP.';
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errorMsg = errJson.message;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return await res.blob();
  },
};
