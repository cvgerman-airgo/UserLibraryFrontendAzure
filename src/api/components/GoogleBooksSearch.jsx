import React, { useState } from "react";
import BookService from "../BookService";
import { bytesToDataUrl } from "../../utils/imageUtils";

const GoogleBooksSearch = ({ onImport }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Función para eliminar tildes y diacríticos
  const normalizeText = (text) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      // Normaliza título y autor antes de buscar
      const normalizedTitle = normalizeText(title);
      const normalizedAuthor = normalizeText(author);
      // Usar solo el backend para la búsqueda combinada
      const res = await fetch(`/api/books/internet-search?title=${encodeURIComponent(normalizedTitle)}&author=${encodeURIComponent(normalizedAuthor)}&language=${encodeURIComponent(language)}`);
      let allResults = [];
      if (res.ok) {
        allResults = await res.json();
      }
      // Procesar portadas si vienen como array de bytes/base64
      allResults = allResults.map(book => {
        let imageUrl = "https://via.placeholder.com/64x96?text=Sin+Portada";
        let coverImageBase64 = null;
        const img = book.CoverImage || book.coverImage;
        if (img) {
          if (Array.isArray(img) && img.length > 0) {
            imageUrl = bytesToDataUrl(img, 'image/jpeg');
            coverImageBase64 = btoa(String.fromCharCode(...img));
          } else if (typeof img === 'string' && img.length > 100) {
            // Si no tiene prefijo, añádelo
            if (!img.startsWith('data:image')) {
              imageUrl = `data:image/jpeg;base64,${img}`;
            } else {
              imageUrl = img;
            }
            coverImageBase64 = img;
          } else if (typeof img === 'string' && img.startsWith('http')) {
            imageUrl = img;
            coverImageBase64 = null;
          }
        }
        // Log para depuración
        console.log('DEBUG coverImage:', book.CoverImage);
        console.log('DEBUG imageUrl:', imageUrl);
        console.log('DEBUG coverImageBase64:', coverImageBase64);
        return {
          title: book.Title || book.title,
          author: book.Author || book.author,
          isbn: book.ISBN || book.isbn,
          publisher: book.Publisher || book.publisher,
          summary: book.Summary || book.summary,
          coverImage: imageUrl,
          coverImageBase64
        };
      });
      setResults(allResults);
      if (allResults.length === 0) {
        setError("No se encontraron resultados.");
      }
    } catch (err) {
      setError("Error: No se encontraron resultados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Buscar en Internet</h2>
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full mb-2 px-4 py-2 border rounded"
      />
      <input
        type="text"
        placeholder="Autor"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        className="w-full mb-2 px-4 py-2 border rounded"
      />
      <select
        value={language}
        onChange={e => setLanguage(e.target.value)}
        className="w-full mb-2 px-4 py-2 border rounded"
      >
        <option value="">Cualquier idioma</option>
        <option value="es">Español</option>
        <option value="en">Inglés</option>
        <option value="ca">Catalán</option>
      </select>
      <button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded mb-2"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div>
        {results.map(item => {
          // Obtener URL de imagen (data URL, base64, array de bytes, o URL directa)
          let imageUrl = "https://via.placeholder.com/64x96?text=Sin+Portada";
          let coverImageBase64 = null;
          if (item.coverImage) {
            if (typeof item.coverImage === 'string' && item.coverImage.startsWith('data:image')) {
              imageUrl = item.coverImage;
              coverImageBase64 = item.coverImage.split(',')[1] || null;
            } else if (Array.isArray(item.coverImage) && item.coverImage.length > 0) {
              imageUrl = bytesToDataUrl(item.coverImage, 'image/jpeg');
              coverImageBase64 = btoa(String.fromCharCode(...item.coverImage));
            } else if (typeof item.coverImage === 'string' && item.coverImage.startsWith('http')) {
              imageUrl = item.coverImage;
              coverImageBase64 = null;
            } else if (typeof item.coverImage === 'string' && item.coverImage.length > 100) {
              imageUrl = `data:image/jpeg;base64,${item.coverImage}`;
              coverImageBase64 = item.coverImage;
            }
          }

          return (
            <div key={item.isbn || item.title} className="border-b py-4 flex gap-4">
              <img
                src={imageUrl}
                alt={item.title}
                className="w-20 h-28 object-cover rounded"
              />
              <div className="flex-1">
                <div className="font-bold">{item.title}</div>
                <div className="text-sm text-gray-600">{item.author}</div>
                <div className="text-sm text-gray-600">{item.publisher}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{item.summary}</div>
                <div className="text-xs text-gray-500 mt-1">ISBN: {item.isbn || "No disponible"}</div>
                <button
                  className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => {
                    if (!item.isbn) return alert("No se encontró ISBN para este libro.");
                    onImport({
                      volumeInfo: {
                        title: item.title,
                        authors: [item.author],
                        industryIdentifiers: [{ type: "ISBN_13", identifier: item.isbn }],
                        description: item.summary,
                        coverImage: coverImageBase64
                      }
                    });
                  }}
                >
                  Importar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoogleBooksSearch;
