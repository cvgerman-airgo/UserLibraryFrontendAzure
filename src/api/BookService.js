import axiosClient from './axiosClient';
import axios from "axios";


// Ajusta la ruta '/books/my' según tu backend
const BookService = {
  getMyBooks: () => axiosClient.get('/books/my'),
  getBookById: (id) => axiosClient.get(`/books/${id}`),
  searchGoogleBooks: (params) =>
    axiosClient.get('/books/googlebooks/search', { params }),
  uploadCover: (imageUrl, isbn) =>
    axiosClient.post('/books/upload-cover', {
      imageUrl,
      isbn,
    }),

};

export default BookService;