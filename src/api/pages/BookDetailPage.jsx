import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookService from "../BookService";

//const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  // Modal para buscar portadas de Google Books
  const [showCoverSearch, setShowCoverSearch] = useState(false);
  const [coverResults, setCoverResults] = useState([]);
  const [coverQuery, setCoverQuery] = useState("");
  const [loadingCovers, setLoadingCovers] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await BookService.getBookById(id);
        setBook(res.data);
        setForm(res.data);
      } catch (err) {
        setError("No se pudo cargar el libro.");
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
const uploadImageToServer = async (base64Image, isbn) => {
  try {
    const res = await fetch("/api/books/upload-cover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageUrl: base64Image, isbn })
    });
    if (!res.ok) throw new Error("Error al subir la imagen");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error subiendo la imagen:", err);
    return null;
  }
};

  const handleSave = async () => {
    if (!form.title || !form.author) {
      alert("El título y el autor son obligatorios.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Mapeo de campos a PascalCase para el backend .NET
      const formToSend = {
        Title: form.title,
        Author: form.author,
        Series: form.series,
        Publisher: form.publisher,
        Genre: form.genre,
        Isbn: form.isbn,
        PublicationDate: form.publicationDate,
        PageCount: form.pageCount,
        StartReadingDate: form.startReadingDate,
        EndReadingDate: form.endReadingDate,
        Status: Number(form.status),
        LentTo: form.lentTo,
        Summary: form.summary,
        CoverUrl: form.coverUrl,
        AddedDate: form.addedDate,
        Id: form.id,
        // Agrega aquí cualquier otro campo que tu backend requiera
      };
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formToSend),
      });
      //if (!res.ok) throw new Error("No se pudo actualizar el libro");
      if (res.status === 204) {
        setEditing(false);
        // Opcional: recarga el libro si quieres mostrar los datos actualizados
        // await fetchBook();
        return;
      }
      const updated = await res.json();
      setBook(updated);
      setEditing(false);
    } catch {
      alert("No se pudo actualizar el libro");
    }
  };

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
          editing
            ? (form.coverUrl
                ? (form.coverUrl.startsWith("http") || form.coverUrl.startsWith("data:")
                    ? form.coverUrl
                    : `/covers/${form.coverUrl.replace(/^.*[\\/]/, '')}?v=${Date.now()}`)
                : "https://via.placeholder.com/192x288?text=Sin+Portada")
            : (book.coverUrl
                ? (book.coverUrl.startsWith("http") || book.coverUrl.startsWith("data:")
                    ? book.coverUrl
                    : `/covers/${book.coverUrl.replace(/^.*[\\/]/, '')}?v=${Date.now()}`)
                : "https://via.placeholder.com/192x288?text=Sin+Portada")
        }
        alt={form.title || book.title}
        className="w-48 h-72 object-cover rounded-lg shadow-md mb-6 md:mb-0"
      />

        <div className="flex-1 min-w-0">
          {editing ? (
            <>
              {/* Portada: solo botones en una línea */}
              <div className="flex items-center mb-2 gap-2">
                <label className="w-32 text-gray-700 font-semibold">Portada</label>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => {
                    setCoverQuery([form.title, form.author].filter(Boolean).join(" ") || "");
                    setShowCoverSearch(true);
                  }}
                >
                  Buscar portada
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="ml-2"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                     reader.onloadend = async () => {
                      const result = reader.result;
                      const isbn = form.isbn || "temp";
                      const upload = await uploadImageToServer(result, isbn);
                      if (upload?.relativePath) {
                        setForm(f => ({ ...f, coverUrl: upload.relativePath, thumbnailUrl: upload.thumbnailPath }));
                      } else {
                        alert("No se pudo subir la imagen");
                      }
                    };
                    reader.readAsDataURL(file);

                    }
                  }}
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Título</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="title"
                  value={form.title || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Autor</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="author"
                  value={form.author || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Serie</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="series"
                  value={form.series || ""}
                  onChange={handleChange}
                  placeholder="Serie"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Editorial</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="publisher"
                  value={form.publisher || ""}
                  onChange={handleChange}
                  placeholder="Editorial"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Género</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="genre"
                  value={form.genre || ""}
                  onChange={handleChange}
                  placeholder="Género"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">ISBN</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="isbn"
                  value={form.isbn || ""}
                  onChange={handleChange}
                  placeholder="ISBN"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Fecha publicación</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="publicationDate"
                  type="date"
                  value={form.publicationDate ? form.publicationDate.substring(0,10) : ""}
                  onChange={handleChange}
                  placeholder="Fecha publicación"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Páginas</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="pageCount"
                  type="number"
                  value={form.pageCount || ""}
                  onChange={handleChange}
                  placeholder="Páginas"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Inicio lectura</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="startReadingDate"
                  type="date"
                  value={form.startReadingDate ? form.startReadingDate.substring(0,10) : ""}
                  onChange={handleChange}
                  placeholder="Inicio lectura"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Fin lectura</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="endReadingDate"
                  type="date"
                  value={form.endReadingDate ? form.endReadingDate.substring(0,10) : ""}
                  onChange={handleChange}
                  placeholder="Fin lectura"
                />
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Estado</label>
                <select
                  className="flex-1 px-2 py-1 border rounded"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value={0}>No leído</option>
                  <option value={1}>Leyendo</option>
                  <option value={2}>Leído</option>
                  <option value={3}>No terminado</option>
                </select>
              </div>
              <div className="flex items-center mb-2">
                <label className="w-32 text-gray-700 font-semibold">Prestado a</label>
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  name="lentTo"
                  value={form.lentTo || ""}
                  onChange={handleChange}
                  placeholder="Prestado a"
                />
              </div>
              {/* Resumen: etiqueta arriba */}
              <label className="block text-gray-700 font-semibold mb-1 mt-2">Resumen</label>
              <textarea
                className="w-full mb-2 px-2 py-1 border rounded"
                name="summary"
                value={form.summary || ""}
                onChange={handleChange}
                placeholder="Resumen"
              />
              <div className="flex gap-4 mt-4">
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  onClick={handleSave}
                >
                  Guardar
                </button>
                <button
                  className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
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
              <p className="mb-2 text-gray-600">
                <b>Estado:</b> {
                  book.status === 2 ? "Leído" :
                  book.status === 1 ? "Leyendo" :
                  book.status === 3 ? "No terminado" :
                  "No leído"
                }
              </p>
              {book.lentTo && (
                <p className="mb-2 text-gray-600"><b>Prestado a:</b> {book.lentTo}</p>
              )}
              <div className="mb-2">
                <b className="text-gray-600">Resumen:</b>
                <div className="bg-gray-100 rounded p-4 mt-1 text-gray-700 max-h-80 overflow-y-auto whitespace-pre-line">
                  {book.summary}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
                <button
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  onClick={() => navigate(-1)}
                >
                  Volver
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  onClick={async () => {
                    if (window.confirm("¿Seguro que quieres eliminar este libro?")) {
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`/api/books/${book.id}`, {
                          method: "DELETE",
                          headers: {
                            "Authorization": `Bearer ${token}`,
                          },
                        });
                        if (!res.ok) throw new Error("No se pudo eliminar el libro");
                        navigate("/mis-libros");
                      } catch {
                        alert("No se pudo eliminar el libro");
                      }
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
        {/* Modal para buscar portadas de Google Books */}
        {showCoverSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full relative overflow-y-auto max-h-screen">
              <button
                className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-purple-600"
                onClick={() => setShowCoverSearch(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-purple-800">Buscar portada en Internet</h2>
              <form
                className="flex gap-2 mb-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoadingCovers(true);
                  setCoverResults([]);
                  try {
                    const res = await fetch(
                      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(coverQuery)}`
                    );
                    const data = await res.json();
                    setCoverResults(
                      (data.items || []).map(item => ({
                        url: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
                        title: item.volumeInfo.title,
                        authors: item.volumeInfo.authors?.join(", "),
                      }))
                    );
                  } catch {
                    setCoverResults([]);
                  }
                  setLoadingCovers(false);
                }}
              >
                <input
                  className="flex-1 px-2 py-1 border rounded"
                  type="text"
                  placeholder="Título, autor..."
                  value={coverQuery}
                  onChange={e => setCoverQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 text-white rounded"
                >
                  Buscar
                </button>
              </form>
              {loadingCovers && <div className="mb-4 text-center">Buscando portadas...</div>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {coverResults.map((cover, idx) =>
                  cover.url && (
                    <div
                      key={idx}
                      className="cursor-pointer border rounded hover:shadow-lg p-2 flex flex-col items-center"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          const res = await fetch("/api/books/upload-cover", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              imageUrl: cover.url,
                              isbn: form.isbn || form.title.replace(/\s+/g, "_") || "sin_isbn"
                            })
                          });

                          if (res.ok) {
                            const data = await res.json();
                            setForm(f => ({ ...f, coverUrl: data.relativePath }));
                          } else {
                            alert("No se pudo guardar la portada desde Internet");
                          }
                        } catch {
                          alert("Error al guardar portada desde Internet");
                        }
                        setShowCoverSearch(false);
                      }}

                    >
                      <img src={cover.url} alt={cover.title} className="w-24 h-36 object-cover mb-2" />
                      <div className="text-xs text-center">{cover.title}</div>
                      <div className="text-xs text-gray-500">{cover.authors}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;