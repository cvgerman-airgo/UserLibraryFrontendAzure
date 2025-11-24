import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookService from '../BookService';
import axiosClient from '../axiosClient';
import GoogleBooksSearch from "../components/GoogleBooksSearch";
import StatisticsPage from "./StatisticsPage";
import "../../Estilos/BookDetailPage.css";
import "../../Estilos/UserBooksPage.css";
import IsbnScanner from "../../components/IsbnScanner";
import { bytesToDataUrl } from "../../utils/imageUtils";


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

// Helper para obtener la URL de la imagen desde los datos del libro
function getBookImageUrl(book) {
  if (!book || !book.coverImage) {
    return "https://via.placeholder.com/192x288?text=Sin+Portada";
  }
  // Si es array de bytes
  if (Array.isArray(book.coverImage) && book.coverImage.length > 0) {
    return bytesToDataUrl(book.coverImage, 'image/jpeg');
  }
  // Si es string base64
  if (typeof book.coverImage === 'string' && book.coverImage.length > 0) {
    try {
      const binary = atob(book.coverImage);
      const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
      return bytesToDataUrl(Array.from(bytes), 'image/jpeg');
    } catch (e) {
      return "https://via.placeholder.com/192x288?text=Sin+Portada";
    }
  }
  return "https://via.placeholder.com/192x288?text=Sin+Portada";
}

// Normalizar texto eliminando tildes para comparar
const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const UserBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("filters")) || { title: "", author: "", status: "", publisher: "", isbn: "" };
    } catch {
      return { title: "", author: "", status: "", publisher: "", isbn: "" };
    }
  });

  const [sortFields, setSortFields] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sortFields")) || [];
    } catch {
      return [];
    }
  });


  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddByIsbn, setShowAddByIsbn] = useState(false);
  const [showGoogleBooksSearch, setShowGoogleBooksSearch] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [language, setLanguage] = useState("es");
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [showIsbnScanner, setShowIsbnScanner] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await BookService.getMyBooks();
        setBooks(res.data);
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

  // Guardar filtros en localStorage
  useEffect(() => {
    localStorage.setItem("filters", JSON.stringify(filters));
  }, [filters]);

  // Guardar orden en localStorage
  useEffect(() => {
    localStorage.setItem("sortFields", JSON.stringify(sortFields));
  }, [sortFields]);

  const clearFilters = () => setFilters({ title: "", author: "", status: "", publisher: "", isbn: "" });

  const toggleSortField = (field) => {
    setSortFields(prev => {
      const existing = prev.find(f => f.field === field);
      if (!existing) {
        return [...prev, { field, direction: "asc" }];
      }
      if (existing.direction === "asc") {
        return prev.map(f => f.field === field ? { ...f, direction: "desc" } : f);
      }
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
      const res = await axiosClient.post('/books/import-from-google', {
        isbn,
        language
      });
      const data = res.data;
      let importedBook = data.book ? data.book : data;
      // Si la imagen viene como array de bytes, convertir a base64 y actualizar en el backend
      if (importedBook.coverImage && Array.isArray(importedBook.coverImage)) {
        const coverImageBase64 = btoa(String.fromCharCode(...importedBook.coverImage));
        try {
          await axiosClient.put(`/books/${importedBook.id}`, {
            Title: importedBook.title,
            Author: importedBook.author,
            Series: importedBook.series,
            Publisher: importedBook.publisher,
            Genre: importedBook.genre,
            ISBN: importedBook.isbn,
            PublicationDate: importedBook.publicationDate,
            PageCount: importedBook.pageCount,
            StartReadingDate: importedBook.startReadingDate,
            EndReadingDate: importedBook.endReadingDate,
            Status: Number(importedBook.status),
            LentTo: importedBook.lentTo,
            Summary: importedBook.summary,
            Language: importedBook.language || null,
            Country: importedBook.country || null,
            CoverImage: coverImageBase64,
          });
          importedBook = {
            ...importedBook,
            coverImage: coverImageBase64
          };
        } catch (e) {
          console.error('Error actualizando imagen en base64 tras importar:', e);
        }
      }
      setBooks(prev => [importedBook, ...prev]);
      setShowAddByIsbn(false);
      setIsbn("");
      if (importedBook && importedBook.id) {
        navigate(`/mis-libros/${importedBook.id}`);
      } else {
        console.error("handleImportByIsbn: El libro importado no tiene id. No se puede navegar.");
      }
    } catch {
      setImportError("No se pudo importar el libro. ¿El ISBN es correcto?");
    } finally {
      setImportLoading(false);
    }
  };

  // Comprobación de soporte de cámara
  const isCameraSupported = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';

  return (

    <div className="user-books-container">
      <h1 className="user-books-title">Mis Libros</h1>

      {/* Botones añadir libro */}
      <div className="user-books-actions">
        <button onClick={() => setShowAddByIsbn(true)}>Añadir libro por ISBN</button>
        <button style={{background: '#2563eb'}} onClick={() => setShowGoogleBooksSearch(true)}>Buscar libro en Internet</button>
        <button style={{background: '#f59e42', color: '#fff'}} onClick={() => setShowStatsModal(true)}>
          📊 Ver estadísticas
        </button>
        <button style={{background: '#7c3aed', color: '#fff'}} onClick={() => setShowFiltersModal(true)}>
          Filtros
        </button>
      </div>

      {/* Modal de Filtros */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative" style={{minWidth: 340, maxWidth: 700}}>
            <button className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600" onClick={() => setShowFiltersModal(false)}>&times;</button>
            <h2 style={{fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed', marginBottom: 8}}>Filtrar libros</h2>
            <div style={{fontSize: '1rem', color: '#6b7280', marginBottom: 16}}>Libros encontrados: <span style={{fontWeight: 700}}>{filteredBooks.length}</span></div>
            <div className="user-books-filters-grid">
              <input type="text" placeholder="Título" value={filters.title} onChange={e => setFilters({ ...filters, title: e.target.value })} />
              <input type="text" placeholder="Autor" value={filters.author} onChange={e => setFilters({ ...filters, author: e.target.value })} />
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Estado</option>
                <option value="0">No leído</option>
                <option value="1">Leyendo</option>
                <option value="2">Leído</option>
                <option value="3">No terminado</option>
              </select>
              <input type="text" placeholder="Editorial" value={filters.publisher} onChange={e => setFilters({ ...filters, publisher: e.target.value })} />
              <input type="text" placeholder="ISBN" value={filters.isbn} onChange={e => setFilters({ ...filters, isbn: e.target.value })} />
            </div>
            <div style={{marginTop: 20, textAlign: 'right'}}>
              <button style={{fontSize: '1rem', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer'}} onClick={clearFilters}>Limpiar filtros</button>
            </div>
          </div>
        </div>
      )}

      {/* Botones orden */}
      <div className="user-books-actions" style={{marginBottom: 16, flexWrap: 'wrap'}}>
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
              style={active ? {background: '#7c3aed', color: '#fff', border: '1px solid #5b21b6'} : {background: '#fff', color: '#7c3aed', border: '1px solid #ddd'}}
              onClick={() => toggleSortField(field)}
            >
              {label} {direction === "asc" ? "↑" : direction === "desc" ? "↓" : ""}
            </button>
          );
        })}
      </div>

      {/* Orden actual */}
      {sortFields.length > 0 && (
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8}}>
          <span style={{fontWeight: 500, color: '#374151'}}>Orden actual:</span>
          {sortFields.map(({ field, direction }) => {
            const labels = {
              title: "Título",
              author: "Autor",
              publisher: "Editorial",
              isbn: "ISBN",
              status: "Estado",
            };
            return (
              <div key={field} style={{display: 'flex', alignItems: 'center', padding: '0.25rem 0.75rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 999, fontSize: '0.95rem'}}>
                {labels[field]} {direction === "asc" ? "↑" : "↓"}
                <button onClick={() => removeSortField(field)} style={{marginLeft: 8, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer'}} title="Quitar este orden">×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtros activos */}
      {Object.entries(filters).some(([k, v]) => v) && (
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24}}>
          <span style={{fontWeight: 500, color: '#374151'}}>Filtros activos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const labels = {
              title: "Título",
              author: "Autor",
              publisher: "Editorial",
              isbn: "ISBN",
              status: "Estado",
            };
            let displayValue = value;
            if (key === "status") {
              displayValue = {
                "0": "No leído",
                "1": "Leyendo",
                "2": "Leído",
                "3": "No terminado"
              }[value] || value;
            }
            return (
              <div key={key} style={{display: 'flex', alignItems: 'center', padding: '0.25rem 0.75rem', background: '#f3f4f6', color: '#7c3aed', borderRadius: 999, fontSize: '0.95rem'}}>
                {labels[key]}: <b style={{marginLeft: 4}}>{displayValue}</b>
              </div>
            );
          })}
        </div>
      )}

      {/* Libros */}
      {loading ? (
        <div style={{textAlign: 'center', fontSize: '1.1rem'}}>Cargando...</div>
      ) : filteredBooks.length === 0 ? (
        <div style={{textAlign: 'center', color: '#6b7280', marginTop: 40}}>No se encontraron libros.</div>
      ) : (
        <div className="user-books-grid">
          {applySorting(filteredBooks).map(book => {
            const status = getReadingStatus(book.status);
            const imageUrl = getBookImageUrl(book);
            return (
              <div key={book.id} onClick={() => navigate(`/mis-libros/${book.id}`)} className="user-book-card">
                <img
                  src={imageUrl}
                  alt={book.title}
                />
                <h2 className="user-book-card-title">{book.title}</h2>
                <p className="user-book-card-author">{book.author}</p>
                <span className="user-book-card-status" style={{background: status.color.split(' ')[0].replace('bg-', '#').replace('-100', 'e9fe'), color: status.color.split(' ')[1]?.replace('text-', '#').replace('-700', '7c3aed')}}>
                  {status.icon} {status.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

{showStatsModal && (
  <div className="book-detail-modal-bg">
    <div className="book-detail-modal">
      <button className="book-detail-modal-close" onClick={() => setShowStatsModal(false)}>X</button>
      <StatisticsPage
        books={books.map(book => ({
          ...book,
          endDate: book.endReadingDate,
          status:
            book.status === 2
              ? "Leído"
              : book.status === 1
              ? "Leyendo"
              : book.status === 3
              ? "No terminado"
              : book.status === 0
              ? "No leído"
              : book.status || "Desconocido",
        }))}
      />
    </div>
  </div>
)}
      
      {/* Modal añadir por ISBN */}
      {showAddByIsbn && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600" onClick={() => setShowAddByIsbn(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-purple-700">Añadir libro por ISBN</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Introduce el ISBN"
                value={isbn}
                onChange={e => setIsbn(e.target.value)}
                className="mb-0 px-4 py-2 border rounded"
                style={{ flex: 1, minWidth: 0, maxWidth: 180 }}
              />
              <button
                type="button"
                aria-label="Escanear ISBN"
                style={{ background: 'none', 
                          border: 'none', 
                          padding: 0, 
                          cursor: isCameraSupported ? 'pointer' : 'not-allowed', 
                          height: 36, 
                          width: 36, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          opacity: isCameraSupported ? 1 : 0.5 
                        }}
                onClick={() => {
                  if (!isCameraSupported) {
                    alert('La cámara no está soportada en este navegador. Usa Chrome, Firefox, Edge o Safari actualizado, y accede por HTTPS o localhost.');
                    return;
                  }
                  setShowIsbnScanner(true);
                }}
                disabled={!isCameraSupported}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M8 2v4M16 2v4M2 8h20M2 16h20M8 22v-4M16 22v-4"/></svg>
              </button>
            </div>
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
            {showIsbnScanner && (
              <IsbnScanner
                onDetected={code => {
                  setIsbn(code);
                  setShowIsbnScanner(false);
                }}
                onClose={() => setShowIsbnScanner(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal Google Books */}
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
