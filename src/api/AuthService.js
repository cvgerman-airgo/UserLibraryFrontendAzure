// src/api/AuthService.js
import axiosClient from './axiosClient';

const AuthService = {
  login: (credentials) => axiosClient.post('/users/login', credentials),
  register: (data) => axiosClient.post('/users/register', data),
//  verifyEmailGet: (token) => axiosClient.get(`/users/verify-email?token=${token}`)
   verifyEmail: (token) => axiosClient.post('/users/verify-email', { token })
};

export default AuthService;
