import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookService from '../BookService';
import GoogleBooksSearch from "../components/GoogleBooksSearch";

// Función para traducir el estado numérico a texto y estilos
function getReadingStatus(status) {
  const num = Number(status);
  switch (num) {
    case 2: return { text: "Leído", icon: "✅", color: "bg-green-100 text-green-700" };
    case 1: return { text: "Leyendo", icon: "📖", color: "bg-yellow-100 text-yellow-700" };
    case 0: return { text: "No leído", icon: "⏳", color: "bg-gray-200 text-gray-700" };
    case 3: return { text: "No terminado", icon: "❌", color: "bg-red-100 text-red-700" };
    default: return { text: "Desconocido", icon: "❓", color: "bg-gray-200 text-gray-700" };
  }
}

// Normalizar texto eliminando tildes para comparar
const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const UserBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [filters, setFilters] = useState({ title: "", author: "", status: "", publisher: "", isbn: "" });
  const [sortFields, setSortFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddByIsbn, setShowAddByIsbn] = useState(false);
  const [showGoogleBooksSearch, setShowGoogleBooksSearch] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [language, setLanguage] = useState("es");
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await BookService.getMyBooks();
        setBooks(res.data);
        setFilteredBooks(res.data);
      } catch {
        setError("No se pudieron cargar tus libros.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    let result = [...books];
    const { title, author, status, publisher, isbn } = filters;
    if (title) result = result.filter(b => normalize(b.title).includes(normalize(title)));
    if (author) result = result.filter(b => normalize(b.author).includes(normalize(author)));
    if (status !== "") result = result.filter(b => b.status?.toString() === status);
    if (publisher) result = result.filter(b => normalize(b.publisher).includes(normalize(publisher)));
    if (isbn) result = result.filter(b => b.isbn?.includes(isbn));
    setFilteredBooks(result);
  }, [books, filters]);

  const clearFilters = () => setFilters({ title: "", author: "", status: "", publisher: "", isbn: "" });

  const handleSort = (field) => {
    setSortFields((prev) => {
      const existing = prev.find(f => f.field === field);
      return existing
        ? prev.map(f => f.field === field ? { ...f, direction: f.direction === "asc" ? "desc" : "asc" } : f)
        : [...prev, { field, direction: "asc" }];
    });
  };

  const toggleSortField = (field) => {
    setSortFields(prev => {
      const existing = prev.find(f => f.field === field);
      if (!existing) {
        return [...prev, { field, direction: "asc" }];
      }
      if (existing.direction === "asc") {
        return prev.map(f => f.field === field ? { ...f, direction: "desc" } : f);
      }
      // Si ya está en desc, lo quitamos
      return prev.filter(f => f.field !== field);
    });
  };

  const removeSortField = (field) => {
  setSortFields(prev => prev.filter(f => f.field !== field));
};

  const applySorting = (data) => {
    return [...data].sort((a, b) => {
      for (let { field, direction } of sortFields) {
        const aVal = normalize((a[field] || "").toString());
        const bVal = normalize((b[field] || "").toString());
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleImportByIsbn = async () => {
    setImportLoading(true);
    setImportError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/books/import-from-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ isbn, language }),
      });
      if (!res.ok) throw new Error("No se pudo importar el libro");
      const book = await res.json();
      setBooks(prev => [book, ...prev]);
      setShowAddByIsbn(false);
      setIsbn("");
      navigate(`/mis-libros/${book.id}`);
    } catch (err) {
      setImportError("No se pudo importar el libro. ¿El ISBN es correcto?");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <h1 className="text-3xl font-extrabold mb-4 text-purple-700 text-center">Mis Libros</h1>

      {/* Botón para añadir libro por ISBN y buscar en Google Books */}
      <div className="flex justify-center mb-8 gap-4">
        <button className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition" onClick={() => setShowAddByIsbn(true)}>Añadir libro por ISBN</button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" onClick={() => setShowGoogleBooksSearch(true)}>Buscar libro en Internet</button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-purple-700 mb-4">Filtrar libros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="text" placeholder="Título" value={filters.title} onChange={e => setFilters({ ...filters, title: e.target.value })} className="px-3 py-2 border rounded" />
          <input type="text" placeholder="Autor" value={filters.author} onChange={e => setFilters({ ...filters, author: e.target.value })} className="px-3 py-2 border rounded" />
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border rounded">
            <option value="">Estado</option>
            <option value="0">No leído</option>
            <option value="1">Leyendo</option>
            <option value="2">Leído</option>
            <option value="3">No terminado</option>
          </select>
          <input type="text" placeholder="Editorial" value={filters.publisher} onChange={e => setFilters({ ...filters, publisher: e.target.value })} className="px-3 py-2 border rounded" />
          <input type="text" placeholder="ISBN" value={filters.isbn} onChange={e => setFilters({ ...filters, isbn: e.target.value })} className="px-3 py-2 border rounded" />
        </div>
        <div className="mt-4 text-right">
          <button onClick={clearFilters} className="text-sm text-purple-600 hover:underline">Limpiar filtros</button>
        </div>
      </div>
      {/* Botones de ordenación */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {[
          { field: "title", label: "Título" },
          { field: "author", label: "Autor" },
          { field: "publisher", label: "Editorial" },
          { field: "isbn", label: "ISBN" },
          { field: "status", label: "Estado" },
        ].map(({ field, label }) => {
          const active = sortFields.find(f => f.field === field);
          const direction = active?.direction;
          return (
            <button
              key={field}
              className={`px-4 py-1 rounded border transition font-medium
                ${active
                  ? "bg-purple-600 text-white border-purple-700"
                  : "bg-white text-purple-700 border-purple-300 hover:bg-purple-100"}`}
              onClick={() => toggleSortField(field)}
            >
              {label} {direction === "asc" ? "↑" : direction === "desc" ? "↓" : ""}
            </button>
          );
        })}
      </div>
      {/* Orden actual */}
      {sortFields.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="font-medium text-gray-700">Orden actual:</span>
          {sortFields.map(({ field, direction }) => {
            const labels = {
              title: "Título",
              author: "Autor",
              publisher: "Editorial",
              isbn: "ISBN",
              status: "Estado",
            };
            return (
              <div
                key={field}
                className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {labels[field]} {direction === "asc" ? "↑" : "↓"}
                <button
                  onClick={() => removeSortField(field)}
                  className="ml-2 text-purple-500 hover:text-purple-800"
                  title="Quitar este orden"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}  
      {/* Libros */}
      {loading ? (
        <div className="text-center text-lg">Cargando...</div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No se encontraron libros.</div>
      ) : (

        
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", display: "grid" }}>
          {applySorting(filteredBooks).map(book => {
            const status = getReadingStatus(book.status);
            return (
              <div
                key={book.id}
                onClick={() => navigate(`/mis-libros/${book.id}`)}
                className="cursor-pointer bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition"
              >
                <div className="w-full h-60 bg-white flex items-center justify-center overflow-hidden rounded">
                  <img
                    src={
                      book.coverUrl?.startsWith("http")
                        ? book.coverUrl
                        : `/covers/${book.coverUrl?.split("/").pop()}?v=${Date.now()}`
                    }
                    alt={book.title}
                    className="h-48 w-full object-contain rounded"
                  />
                </div>
                <h2 className="text-lg font-bold mt-2">{book.title}</h2>
                <p className="text-sm text-gray-600">{book.author}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${status.color}`}
                >
                  {status.icon} {status.text}
                </span>
              </div>

            );
          })}
        </div>
      )}

      {/* Modal Añadir por ISBN */}
      {showAddByIsbn && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600" onClick={() => setShowAddByIsbn(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-purple-700">Añadir libro por ISBN</h2>
            <input type="text" placeholder="Introduce el ISBN" value={isbn} onChange={e => setIsbn(e.target.value)} className="w-full mb-4 px-4 py-2 border rounded" />
            <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full mb-4 px-4 py-2 border rounded">
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="ca">Catalán</option>
              <option value="">Cualquier idioma</option>
            </select>
            <button onClick={handleImportByIsbn} disabled={importLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition">
              {importLoading ? "Buscando..." : "Importar"}
            </button>
            {importError && <div className="text-red-500 mt-2">{importError}</div>}
          </div>
        </div>
      )}

      {/* Modal Buscar en Google Books */}
      {showGoogleBooksSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto max-h-screen">
            <button className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600" onClick={() => setShowGoogleBooksSearch(false)}>&times;</button>
            <GoogleBooksSearch onImport={item => {
              const isbnFound = item.volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13" || id.type === "ISBN_10")?.identifier;
              if (!isbnFound) return alert("No se encontró ISBN para este libro.");
              setIsbn(isbnFound);
              setShowAddByIsbn(true);
              setShowGoogleBooksSearch(false);
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBooksPage;
