import axios from 'axios';

const API_BASE_URL = 'https://loglore-backend.onrender.com';

export const aiTroubleshoot = async (logText, metadata = {}, mode = 'beginner') => {
  console.log('API Call to:', `${API_BASE_URL}/ai_troubleshoot`);
  console.log('Payload:', { text: logText, metadata, mode });
  
  try {
    const response = await axios.post(`${API_BASE_URL}/ai_troubleshoot`, {
      text: logText,
      metadata,
      mode
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error Details:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    }
    if (error.response?.status === 0) {
      throw new Error('Network Error: Cannot connect to server');
    }
    throw new Error(`API Error: ${error.response?.data?.detail || error.message}`);
  }
};
