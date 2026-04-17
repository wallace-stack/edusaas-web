import axios from 'axios';
import Cookies from 'js-cookie';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE,
});

// Instância dedicada para /auth/register e /auth/login — timeout maior porque o Render free
// pode demorar até 50s para acordar do cold start.
export const registerApi = axios.create({
  baseURL: BASE,
  timeout: 60_000,
});

// registerApi também dispara o banner de slow (mesmo mecanismo de api)
registerApi.interceptors.request.use((config) => {
  (config as any)._startTime = Date.now();
  const timer = setTimeout(() => dispatchSlowApi(true), 8_000);
  (config as any)._slowTimer = timer;
  return config;
});

registerApi.interceptors.response.use(
  (response) => {
    clearTimeout((response.config as any)._slowTimer);
    dispatchSlowApi(false);
    return response;
  },
  (error) => {
    clearTimeout((error.config as any)?._slowTimer);
    dispatchSlowApi(false);
    return Promise.reject(error);
  },
);

// Adiciona o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  console.log('[API] token presente:', !!token, '| primeiros chars:', token?.substring(0, 20));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Marca o início e agenda banner de "conectando..." após 8s sem resposta
  (config as any)._startTime = Date.now();
  const timer = setTimeout(() => dispatchSlowApi(true), 8_000);
  (config as any)._slowTimer = timer;
  return config;
});

// Despacha evento customizado para o banner de "conectando..."
function dispatchSlowApi(slow: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('api:slow', { detail: { slow } }));
}

// Somente faz logout em 401 REAL — nunca em timeout ou sem resposta
// (timeout = ECONNABORTED, sem resposta = !error.response)
api.interceptors.response.use(
  (response) => {
    clearTimeout((response.config as any)._slowTimer);
    dispatchSlowApi(false);
    return response;
  },
  (error) => {
    clearTimeout((error.config as any)?._slowTimer);
    dispatchSlowApi(false);

    // Timeout ou API dormindo (Render cold start) — NÃO limpa sessão
    if (!error.response || error.code === 'ECONNABORTED') {
      return Promise.reject(error);
    }

    // 401 real → sessão expirada, redireciona para login
    if (error.response.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Trial expirado
    if (error.response.status === 403 &&
        error.response?.data?.code === 'TRIAL_EXPIRED') {
      if (typeof window !== 'undefined') {
        window.location.href = '/planos?expired=true';
      }
      return Promise.reject(error);
    }

    if (error.response.status === 402) {
      if (typeof window !== 'undefined') {
        window.location.href = '/planos';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
