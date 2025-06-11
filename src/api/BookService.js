import axiosClient from './axiosClient';
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Ajusta la ruta '/books/my' según tu backend
const BookService = {
  getMyBooks: () => axiosClient.get('/books/my'),
  getBookById: (id) => axios.get(`${API_URL}/api/books/${id}`),
  // Puedes agregar más métodos aquí si lo necesitas
};

export default BookService;