import axiosClient from './axiosClient';
import axios from "axios";
import { downloadImageAsBytes, base64ToBytes } from '../utils/imageUtils';

// Ajusta la ruta '/books/my' según tu backend
const BookService = {
  getMyBooks: () => axiosClient.get('/books/my'),
  getBookById: (id) => axiosClient.get(`/books/${id}`),
  searchGoogleBooks: (params) =>
    axiosClient.get('/books/googlebooks/search', { params }),
  
  // Método actualizado para subir imagen como array de bytes
  uploadCover: async (imageSource, isbn) => {
    try {
      let imageBytes;
      
      if (typeof imageSource === 'string') {
        if (imageSource.startsWith('http')) {
          // Es una URL - descargar la imagen
          const { bytes } = await downloadImageAsBytes(imageSource);
          imageBytes = Array.from(bytes);
        } else {
          // Es base64 - convertir a bytes
          const bytes = base64ToBytes(imageSource);
          imageBytes = Array.from(bytes);
        }
      } else if (imageSource instanceof File) {
        // Es un File - convertir a bytes
        const arrayBuffer = await imageSource.arrayBuffer();
        imageBytes = Array.from(new Uint8Array(arrayBuffer));
      } else if (Array.isArray(imageSource) || imageSource instanceof Uint8Array) {
        // Ya es array de bytes
        imageBytes = Array.from(imageSource);
      } else {
        throw new Error('Tipo de imagen no soportado');
      }
      
      return axiosClient.post('/books/upload-cover', {
        coverImage: imageBytes, // Array de bytes
        isbn: isbn || 'unknown'
      });
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      throw error;
    }
  },

  // Método para actualizar libro con imagen como bytes
  updateBook: async (id, bookData) => {
    // Si hay coverImage como array de bytes, enviarla tal como está
    return axiosClient.put(`/books/${id}`, bookData);
  },

};

export default BookService;