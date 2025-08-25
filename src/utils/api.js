// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export const api = {
  post: async (endpoint, body, options = {}) => {
    const headers = options.headers || {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...options,
    });

    return response.json().then(data => ({
      status: response.status,
      ok: response.ok,
      data,
    }));
  },

  postForm: async (endpoint, formData, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      ...options,
    });

    return response.json().then(data => ({
      status: response.status,
      ok: response.ok,
      data,
    }));
  },
};
