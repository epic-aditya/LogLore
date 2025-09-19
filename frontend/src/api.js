import axios from 'axios';

const API_BASE_URL = 'https://loglore-backend.onrender.com';

export const aiTroubleshoot = async (logText, metadata = {}, mode = 'beginner') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai_troubleshoot`, {
      text: logText,
      metadata,
      mode
    });
    return response.data;
  } catch (error) {
    throw new Error(`API Error: ${error.response?.data?.detail || error.message}`);
  }
};
