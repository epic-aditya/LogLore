import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://loglore-backend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const aiTroubleshoot = async (logText, metadata = {}, mode = 'beginner') => {
  try {
    const response = await api.post('/ai_troubleshoot', {
      text: logText,
      metadata,
      mode
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    }
    if (error.response?.status === 0) {
      throw new Error('Network Error: Cannot connect to server');
    }
    throw new Error(error.response?.data?.detail || error.message);
  }
};
