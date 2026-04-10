import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Adiciona o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  console.log('[API] token presente:', !!token, '| primeiros chars:', token?.substring(0, 20));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se retornar 401 ou 402, redireciona para login ou planos
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 402) {
      window.location.href = '/planos';
    }
    return Promise.reject(error);
  },
);

export default api;