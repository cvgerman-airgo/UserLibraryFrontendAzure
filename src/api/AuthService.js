// src/api/AuthService.js
import axiosClient from './axiosClient';

const AuthService = {
  login: (credentials) => axiosClient.post('/users/login', credentials),
  register: (data) => axiosClient.post('/users/register', data),
  verifyEmail: (token) => axiosClient.get(`/users/verify-email?token=${token}`),
  forgotPassword: (data) => axiosClient.post('/users/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/users/reset-password', data),
  };

export default AuthService;
