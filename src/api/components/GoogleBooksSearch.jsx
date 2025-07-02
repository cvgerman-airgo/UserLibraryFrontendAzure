import React, { useState } from "react";
import BookService from "../BookService";

const GoogleBooksSearch = ({ onImport }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await BookService.searchGoogleBooks({ title, author, language });
      setResults(res.data || []);
      if (res.data.length === 0) {
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
        {results.map(item => (
          <div key={item.isbn || item.title} className="border-b py-4 flex gap-4">
            <img
              src={item.coverUrl || "https://via.placeholder.com/64x96?text=Sin+Portada"}
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
                      imageLinks: { thumbnail: item.coverUrl }
                    }
                  });
                }}
              >
                Importar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoogleBooksSearch;
