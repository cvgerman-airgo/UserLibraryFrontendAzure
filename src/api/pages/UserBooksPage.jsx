import React, { useEffect, useState } from 'react';
import BookService from '../BookService';
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Función para traducir el estado numérico a texto y emoji
function getReadingStatus(status) {
  const num = Number(status);
  switch (num) {
    case 2:
      return { text: "Leído", icon: "✅", color: "bg-green-100 text-green-700" };
    case 1:
      return { text: "Leyendo", icon: "📖", color: "bg-yellow-100 text-yellow-700" };
    case 0:
      return { text: "No leído", icon: "⏳", color: "bg-gray-200 text-gray-700" };
    case 3:
      return { text: "No terminado", icon: "⏳", color: "bg-gray-200 text-gray-700" };
    default:
      return { text: "Desconocido", icon: "❓", color: "bg-gray-200 text-gray-700" };
  }
}

const UserBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estado para añadir por ISBN
  const [showAddByIsbn, setShowAddByIsbn] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await BookService.getMyBooks();
        setBooks(res.data);
      } catch (err) {
        setError('No se pudieron cargar tus libros.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Función para importar libro por ISBN
  const handleImportByIsbn = async () => {
    setImportLoading(true);
    setImportError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/books/import-from-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ isbn }),
      });
      if (!res.ok) throw new Error("No se pudo importar el libro");
      const book = await res.json();
      // Espera breve y reintenta obtener el libro
      let loaded = false;
      for (let i = 0; i < 5; i++) {
        try {
          const detailRes = await BookService.getBookById(book.id);
          if (detailRes.data) {
            loaded = true;
            break;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 300)); // espera 300ms
      }

      setShowAddByIsbn(false);
      setIsbn("");
      // Opcional: recarga la lista de libros
      setBooks(prev => [book, ...prev]);
      // Navega al detalle del libro recién importado
      navigate(`/mis-libros/${book.id}`);
    } catch (err) {
      setImportError("No se pudo importar el libro. ¿El ISBN es correcto?");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <h1 className="text-3xl font-extrabold mb-8 text-purple-700 text-center drop-shadow">Mis Libros</h1>

      {/* Botón para añadir libro por ISBN */}
      <div className="flex justify-center mb-8">
        <button
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          onClick={() => setShowAddByIsbn(true)}
        >
          Añadir libro por ISBN
        </button>
      </div>

      {/* Modal para añadir libro por ISBN */}
      {showAddByIsbn && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600"
              onClick={() => setShowAddByIsbn(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-purple-700">Añadir libro por ISBN</h2>
            <input
              type="text"
              placeholder="Introduce el ISBN"
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition"
              onClick={handleImportByIsbn}
              disabled={importLoading}
            >
              {importLoading ? "Buscando..." : "Importar"}
            </button>
            {importError && <div className="text-red-500 mt-2">{importError}</div>}
          </div>
        </div>
      )}

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center mt-16">
          <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="Sin libros" className="w-32 mb-4 opacity-70" />
          <p className="text-gray-600 text-lg">¡Aún no tienes libros en tu biblioteca!</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
            {books.map((book) => {
              const status = getReadingStatus(book.status);
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl shadow-xl p-5 flex flex-row items-center gap-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-purple-100 cursor-pointer"
                  onClick={() => navigate(`/mis-libros/${book.id}`)}
                >
                  <img
                    src={
                      book.coverUrl
                        ? `${API_URL}${book.coverUrl.startsWith('/') ? '' : '/'}${book.coverUrl}`
                        : 'https://via.placeholder.com/128x192?text=Sin+Portada'
                    }
                    alt={book.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg mb-1 text-purple-800">{book.title}</h2>
                    {book.author && (
                      <p className="text-sm text-gray-500 mb-2">de {book.author}</p>
                    )}
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 ${status.color}`}>
                      <span>{status.icon}</span>
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserBooksPage;