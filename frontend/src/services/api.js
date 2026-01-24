import { API_BASE } from '../utils/constants';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password
      })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
    
    return response.json();
  }
};

export const applicationsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/applications/`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }
    
    return response.json();
  },

  create: async (appData) => {
    const response = await fetch(`${API_BASE}/applications/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create application');
    }
    
    return response.json();
  },

  delete: async (appId) => {
    const response = await fetch(`${API_BASE}/applications/${appId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete application');
    }
    
    // 204 No Content returns empty body, so only parse JSON if there's content
    if (response.status === 204) {
      return { success: true };
    }
    
    return response.json();
  }
};


export const metricsAPI = {
  getLatest: async (appId) => {
    const response = await fetch(`${API_BASE}/metrics/${appId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
