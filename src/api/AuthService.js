// src/api/AuthService.js
import axiosClient from './axiosClient';
import axios from 'axios';

const AuthService = {
  login: (credentials) => axiosClient.post('/users/login', credentials),
  register: (data) => axiosClient.post('/users/register', data),
  verifyEmail: (token) => axiosClient.get(`/users/verify-email?token=${token}`),
  forgotPassword: (data) => axiosClient.post('/users/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/users/reset-password', data),
};

export default AuthService;

// ✅ Añade esta función y exportación nombrada
export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000; // en segundos
    return payload.exp && payload.exp > now;
  } catch (e) {
    console.error("Error al validar el token:", e);
    return false;
  }
};

