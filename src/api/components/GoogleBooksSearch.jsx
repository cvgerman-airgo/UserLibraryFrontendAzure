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
      setResults(res.data.items || []);
    } catch (err) {
      setError("No se encontraron resultados.");
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
        {results.map((item) => (
          <div key={item.id} className="border-b py-2 flex items-center gap-4">
            <img
              src={item.volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/64x96?text=Sin+Portada"}
              alt={item.volumeInfo.title}
              className="w-16 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <div className="font-bold">{item.volumeInfo.title}</div>
              <div className="text-sm text-gray-600">{item.volumeInfo.authors?.join(", ")}</div>
              <button
                className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => onImport(item)}
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