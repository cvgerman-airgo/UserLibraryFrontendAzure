import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookService from "../BookService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await BookService.getBookById(id);
        setBook(res.data);
      } catch (err) {
        setError("No se pudo cargar el libro.");
      }
    };
    fetchBook();
  }, [id]);

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!book) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col md:flex-row items-start gap-10 max-w-4xl w-full">
        <img
          src={
            book.coverUrl
              ? `${API_URL}${book.coverUrl.startsWith("/") ? "" : "/"}${book.coverUrl}`
              : "https://via.placeholder.com/192x288?text=Sin+Portada"
          }
          alt={book.title}
          className="w-48 h-72 object-cover rounded-lg shadow-md mb-6 md:mb-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold mb-4 text-purple-800">{book.title}</h2>
          <p className="mb-2 text-gray-600"><b>Autor:</b> {book.author}</p>
          {book.series && (
            <p className="mb-2 text-gray-600"><b>Serie:</b> {book.series}</p>
          )}
          <p className="mb-2 text-gray-600"><b>Editorial:</b> {book.publisher}</p>
          <p className="mb-2 text-gray-600"><b>Género:</b> {book.genre}</p>
          <p className="mb-2 text-gray-600"><b>ISBN:</b> {book.isbn}</p>
          {book.publicationDate && (
            <p className="mb-2 text-gray-600"><b>Fecha publicación:</b> {formatDate(book.publicationDate)}</p>
          )}
          {book.pageCount > 0 && (
            <p className="mb-2 text-gray-600"><b>Páginas:</b> {book.pageCount}</p>
          )}
          <p className="mb-2 text-gray-600"><b>Fecha de alta:</b> {formatDate(book.addedDate)}</p>
          {book.startReadingDate && (
            <p className="mb-2 text-gray-600"><b>Inicio lectura:</b> {formatDate(book.startReadingDate)}</p>
          )}
          {book.endReadingDate && (
            <p className="mb-2 text-gray-600"><b>Fin lectura:</b> {formatDate(book.endReadingDate)}</p>
          )}
          {book.lentTo && (
            <p className="mb-2 text-gray-600"><b>Prestado a:</b> {book.lentTo}</p>
          )}
          <div className="mb-2">
            <b className="text-gray-600">Resumen:</b>
            <div className="bg-gray-100 rounded p-4 mt-1 text-gray-700 max-h-80 overflow-y-auto whitespace-pre-line">
              {book.summary}
            </div>
          </div>
          <button
            className="mt-6 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;