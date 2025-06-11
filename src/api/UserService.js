// src/api/UserService.js
import axiosClient from './axiosClient';

const UserService = {
  getAll: () => axiosClient.get('/users'),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post('/users', data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
};

export default UserService;
