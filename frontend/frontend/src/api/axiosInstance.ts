
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1', 
});

axiosInstance.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    const { token } = JSON.parse(authData);
    config.headers.Authorization = token;
  }
  return config;
});

export default axiosInstance;