// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  // En producción (Kubernetes), usa siempre el proxy de Nginx
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT en cada petición
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Lee el token desde localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Lo añade como Bearer token
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ✅ Interceptor para manejar errores globalmente (opcional pero recomendable)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Puedes manejar errores comunes
      if (error.response.status === 401) {
        console.warn('No autorizado, posiblemente el token expiró.');
        // Ejemplo: redirigir al login o eliminar el token
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      } else if (error.response.status === 403) {
        console.warn('Acceso denegado');
      } else if (error.response.status >= 500) {
        console.error('Error en el servidor');
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor.');
    } else {
      console.error('Error al configurar la petición:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;


