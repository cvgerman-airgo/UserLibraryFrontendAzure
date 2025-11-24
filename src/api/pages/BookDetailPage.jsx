import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookService from "../BookService";
import axiosClient from "../axiosClient";
import "../../Estilos/BookDetailPage.css";
import { motion, AnimatePresence } from "framer-motion";
import { bytesToDataUrl, fileToBase64, downloadImageAsBytes } from "../../utils/imageUtils";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

// Helper para obtener la URL de la imagen desde los datos del libro
function getImageUrl(book) {
  if (!book || !book.coverImage) {
    return "https://via.placeholder.com/192x288?text=Sin+Portada";
  }
  // Si es array de bytes
  if (Array.isArray(book.coverImage) && book.coverImage.length > 0) {
    return bytesToDataUrl(book.coverImage, 'image/jpeg');
  }
  // Si es string base64
  if (typeof book.coverImage === 'string' && book.coverImage.length > 0) {
    // Si el string contiene solo base64, convertir a array de bytes
    try {
      const binary = atob(book.coverImage);
      const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
      return bytesToDataUrl(Array.from(bytes), 'image/jpeg');
    } catch (e) {
      // Si falla, mostrar placeholder
      return "https://via.placeholder.com/192x288?text=Sin+Portada";
    }
  }
  // Si no hay imagen válida
  return "https://via.placeholder.com/192x288?text=Sin+Portada";
}

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showCoverSearch, setShowCoverSearch] = useState(false);
  const [coverResults, setCoverResults] = useState([]);
  const [coverQuery, setCoverQuery] = useState("");
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [zoom, setZoom] = useState(1);

useEffect(() => {
  if (!id) return;

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }
  const fetchBook = async () => {
    try {
      const res = await BookService.getBookById(id);
      console.log('=== LIBRO CARGADO DESDE API ===');
      console.log('res.data.coverImage:', res.data.coverImage ? `${res.data.coverImage.length} bytes` : 'null');
      setBook(res.data);
      setForm(res.data);
    } catch (err) {
      console.error("Error cargando libro:", err);
      if (err.response?.status === 401) {
        alert("Sesión expirada.");
        navigate("/login");
      }
    }
  };

  fetchBook();
}, [id, navigate]);


  useEffect(() => {
  if (showCoverSearch) {
    document.body.classList.add("modal-open");
  } else {
    document.body.classList.remove("modal-open");
  }
}, [showCoverSearch]);
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.title || !form.author) {
      alert("El título y el autor son obligatorios.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Convertir array de bytes a base64 si existe imagen
      const coverImageBase64 = form.coverImage ? btoa(String.fromCharCode(...form.coverImage)) : null;
      const formToSend = {
        Title: form.title,
        Author: form.author,
        Series: form.series,
        Publisher: form.publisher,
        Genre: form.genre,
        ISBN: form.isbn,
        PublicationDate: form.publicationDate,
        PageCount: form.pageCount,
        StartReadingDate: form.startReadingDate,
        EndReadingDate: form.endReadingDate,
        Status: Number(form.status),
        LentTo: form.lentTo,
        Summary: form.summary,
        Language: form.language || null,
        Country: form.country || null,
        CoverImage: coverImageBase64,
      };
      console.log(`Actualizando libro con ID: ${book.id}`);
      console.log('=== ENVIANDO AL BACKEND ===');
      console.log('formToSend.CoverImage:', formToSend.CoverImage ? `${formToSend.CoverImage.length} chars (base64)` : 'null');
      if (form.coverImage) {
        console.log('Primeros 10 bytes:', form.coverImage.slice(0, 10));
      }
      const res = await axiosClient.put(`/books/${book.id}`, formToSend);
      if (res.status === 204) {
        // Actualizar book con los datos del form (incluyendo la imagen)
        const updatedBook = {...book, ...form};
        setBook(updatedBook);
        setForm(updatedBook); // Sincronizar form también
        setEditing(false);
        return;
      }
      const updated = res.data;
      console.log('=== RESPUESTA DEL BACKEND ===');
      console.log('Status:', res.status);
      console.log('updated.coverImage:', updated.coverImage ? `${updated.coverImage.length} bytes` : 'null');
      console.log('updated completo:', {
        ...updated,
        coverImage: updated.coverImage ? `[${updated.coverImage.length} bytes]` : 'null'
      });
      // Si el backend devolvió datos, usarlos, pero preservar la imagen si no viene
      const bookToUpdate = {
        ...updated,
        coverImage: updated.coverImage || form.coverImage
      };
      console.log('Libro final a guardar:', bookToUpdate.coverImage ? `${bookToUpdate.coverImage.length} bytes` : 'null');
      setBook(bookToUpdate);
      setForm(bookToUpdate); // Sincronizar form también
      setEditing(false);
    } catch {
      alert("No se pudo actualizar el libro");
    }
  };

  if (error) {
    return <div className="book-detail-error">{error}</div>;
  }

  if (!book) {
    return (
      <div className="book-detail-loading-bg">
        <div className="book-detail-spinner"></div>
      </div>
    );
  }

  return (
    <div className="book-detail-bg">
      <div className="book-detail-container">
        <div className="book-detail-flex-row">
          <img
            src={editing ? getImageUrl(form) : getImageUrl(book)}
            alt={form.title || book.title}
              style={{
                maxWidth: "250px",   // 👈 tamaño fijo en la ficha
                height: "auto",
                cursor: "pointer"
              }}
            className="book-cover"
            onClick={() => setShowImageModal(true)}

          />
          <div className="book-detail-content">
          {editing ? (
            <>
              <h2 className="book-detail-title">{form.title}</h2>
              <div className="book-detail-fields">
                <div className="book-detail-row">
                  <label className="book-detail-label">Portada</label>
                  <div className="book-detail-input" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="book-detail-btn book-detail-btn-blue"
                    onClick={() => {
                      // Usar separador especial para distinguir título y autor
                      setCoverQuery([form.title, form.author].filter(Boolean).join("||") || "");
                      setShowCoverSearch(true);
                    }}
                  >
                    Buscar portada
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="book-detail-input"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Redimensionar la imagen antes de convertirla a bytes
                        const resizeImage = (file, maxWidth = 400) => {
                          return new Promise((resolve, reject) => {
                            const img = new window.Image();
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              img.onload = () => {
                                const scale = Math.min(1, maxWidth / img.width);
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width * scale;
                                canvas.height = img.height * scale;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob((blob) => {
                                  resolve(blob);
                                }, 'image/jpeg', 0.85);
                              };
                              img.onerror = reject;
                              img.src = ev.target.result;
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                        };
                        try {
                          const resizedBlob = await resizeImage(file, 400);
                          const arrayBuffer = await resizedBlob.arrayBuffer();
                          const imageBytes = Array.from(new Uint8Array(arrayBuffer));
                          setForm(f => ({ ...f, coverImage: imageBytes }));
                          alert("Imagen redimensionada y cargada correctamente");
                        } catch (error) {
                          console.error('Error al procesar imagen:', error);
                          alert("Error al procesar la imagen: " + error.message);
                        }
                      }
                    }}
                  />
                </div>
              </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Título</label>
                  <textarea
                    className="book-detail-input"
                    name="title"
                    value={form.title || ""}
                    onChange={handleChange}
                    rows={2}
                    style={{resize: 'vertical', minHeight: '2.2em'}}
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Autor</label>
                  <input
                    className="book-detail-input"
                    name="author"
                    value={form.author || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Serie</label>
                  <input
                    className="book-detail-input"
                    name="series"
                    value={form.series || ""}
                    onChange={handleChange}
                    placeholder="Serie"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Editorial</label>
                  <input
                    className="book-detail-input"
                    name="publisher"
                    value={form.publisher || ""}
                    onChange={handleChange}
                    placeholder="Editorial"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Género</label>
                  <input
                    className="book-detail-input"
                    name="genre"
                    value={form.genre || ""}
                    onChange={handleChange}
                    placeholder="Género"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">ISBN</label>
                  <input
                    className="book-detail-input"
                    name="isbn"
                    value={form.isbn || ""}
                    onChange={handleChange}
                    placeholder="ISBN"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Fecha publicación</label>
                  <input
                    className="book-detail-input"
                    name="publicationDate"
                    type="date"
                    value={form.publicationDate ? form.publicationDate.substring(0,10) : ""}
                    onChange={handleChange}
                    placeholder="Fecha publicación"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Páginas</label>
                  <input
                    className="book-detail-input"
                    name="pageCount"
                    type="number"
                    value={form.pageCount || ""}
                    onChange={handleChange}
                    placeholder="Páginas"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Inicio lectura</label>
                  <input
                    className="book-detail-input"
                    name="startReadingDate"
                    type="date"
                    value={form.startReadingDate ? form.startReadingDate.substring(0,10) : ""}
                    onChange={handleChange}
                    placeholder="Inicio lectura"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Fin lectura</label>
                  <input
                    className="book-detail-input"
                    name="endReadingDate"
                    type="date"
                    value={form.endReadingDate ? form.endReadingDate.substring(0,10) : ""}
                    onChange={handleChange}
                    placeholder="Fin lectura"
                  />
                </div>
                <div className="book-detail-row">
                  <label className="book-detail-label">Estado</label>
                  <select
                    className="book-detail-input"
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
                <div className="book-detail-row">
                  <label className="book-detail-label">Prestado a</label>
                  <input
                    className="book-detail-input"
                    name="lentTo"
                    value={form.lentTo || ""}
                    onChange={handleChange}
                    placeholder="Prestado a"
                  />
                </div>
              </div> 
            </> 
 
          ) : (
            <>
              <h2 className="book-detail-title">{book.title}</h2>
              <div className="book-detail-fields">
              <p className="book-detail-info"><b>Autor:</b> {book.author}</p>
              {book.series && (
                <p className="book-detail-info"><b>Serie:</b> {book.series}</p>
              )}
              <p className="book-detail-info"><b>Editorial:</b> {book.publisher}</p>
              <p className="book-detail-info"><b>Género:</b> {book.genre}</p>
              <p className="book-detail-info"><b>ISBN:</b> {book.isbn}</p>
              {book.publicationDate && (
                <p className="book-detail-info"><b>Fecha publicación:</b> {formatDate(book.publicationDate)}</p>
              )}
              {book.pageCount > 0 && (
                <p className="book-detail-info"><b>Páginas:</b> {book.pageCount}</p>
              )}
              <p className="book-detail-info"><b>Fecha de alta:</b> {formatDate(book.addedDate)}</p>
              {book.startReadingDate && (
                <p className="book-detail-info"><b>Inicio lectura:</b> {formatDate(book.startReadingDate)}</p>
              )}
              {book.endReadingDate && (
                <p className="book-detail-info"><b>Fin lectura:</b> {formatDate(book.endReadingDate)}</p>
              )}
              <p className="book-detail-info">
                <b>Estado:</b> {
                  book.status === 2 ? "Leído" :
                  book.status === 1 ? "Leyendo" :
                  book.status === 3 ? "No terminado" :
                  "No leído"
                }
              </p>
              {book.lentTo && (
                <p className="book-detail-info"><b>Prestado a:</b> {book.lentTo}</p>
              )}
            </div>
            </>
          )}
        </div>
                  </div> {/* .book-detail-content */}
                  {/* Resumen fuera de la fila flex, ocupa todo el ancho solo en modo vista o edición */}
        {editing ? (
          <>
            <div className="book-detail-summary book-detail-summary-full" style={{marginTop: '1.5rem', padding: 0, background: 'none', boxShadow: 'none'}}>
              <label className="book-detail-label" style={{fontWeight: 'bold', display: 'block', marginBottom: '0.5rem',  textAlign: 'center'}}>Resumen</label>
              <textarea
                className="book-detail-input"
                name="summary"
                value={form.summary || ""}
                onChange={handleChange}
                placeholder="Resumen"
                rows={8}
                style={{resize: 'vertical', width: '100%', minHeight: '6rem', fontFamily: 'inherit', background: '#f3f4f6', borderRadius: '0.5rem', border: '1px solid #d1d5db', padding: '1rem'}}
              />
            </div>
            <div className="book-detail-btn-row" style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button
                className="book-detail-btn book-detail-btn-green"
                onClick={handleSave}
              >
                Guardar
              </button>
              <button
                className="book-detail-btn book-detail-btn-gray"
                onClick={() => setEditing(false)}
              >
                 Cancelar
              </button>
              {/* Debug button - remover después */}
              <button
                className="book-detail-btn book-detail-btn-blue"
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('form.coverImage:', form.coverImage ? `${form.coverImage.length} bytes` : 'null');
                  console.log('book.coverImage:', book.coverImage ? `${book.coverImage.length} bytes` : 'null');
                  console.log('form completo:', form);
                }}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Debug
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="book-detail-summary book-detail-summary-full">
              <label className="book-detail-label" style={{fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textAlign: 'left'}}>Resumen</label>
              <div>{book.summary}</div>
            </div>
            <div className="book-detail-btn-row" style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button
                className="book-detail-btn book-detail-btn-green"
                onClick={async () => {
                  if (!book.isbn) {
                    alert("No hay ISBN para buscar en Google Books/OpenLibrary");
                    return;
                  }
                  let infoGB = null;
                  let infoOL = null;
                  try {
                    const resGB = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`);
                    const dataGB = await resGB.json();
                    if (dataGB.items && dataGB.items.length > 0) {
                      infoGB = dataGB.items[0].volumeInfo;
                    }
                  } catch {}
                  try {
                    const resOL = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&jscmd=data&format=json`);
                    const dataOL = await resOL.json();
                    if (dataOL[`ISBN:${book.isbn}`]) {
                      infoOL = dataOL[`ISBN:${book.isbn}`];
                    }
                  } catch {}
                  if (!infoGB && !infoOL) {
                    alert("No se encontró el libro en Google Books ni OpenLibrary");
                    return;
                  }
                  const updated = { ...book };
                  if (!book.title) updated.title = infoGB?.title || infoOL?.title || book.title;
                  if (!book.author) updated.author = (infoGB?.authors?.join(", ") || (infoOL?.authors ? infoOL.authors.map(a=>a.name).join(", ") : "") || book.author);
                  if (!book.publisher) updated.publisher = infoGB?.publisher || (infoOL?.publishers ? infoOL.publishers.map(p=>p.name).join(", ") : "") || book.publisher;
                  function cleanGenres(genres) {
                    if (!genres || !genres.length) return "";
                    const normalize = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const unique = [];
                    genres.forEach(g => {
                      if (!unique.some(u => normalize(u) === normalize(g))) unique.push(g);
                    });
                    //Filtrar sin acentos y sin duplicados
                    const spanish = unique.filter(g => /[áéíóúñ]/i.test(g) || /ficci[oó]n|novela|literatura|aventura|historia|poes[ií]a|infantil|juvenil|ciencia|misterio|terror|romance|biograf[ií]a|ensayo|cuento|clásico|clasico|thrille/i.test(g));
                    if (spanish.length) return spanish.slice(0, 2).join(", ");
                    return unique.slice(0, 2).join(", ");
                  }
                  // Guardar datos de Google Books y OpenLibrary
                  //
                  let genres = [];
                  if (infoGB?.categories) genres = genres.concat(infoGB.categories);
                  if (infoOL?.subjects) genres = genres.concat(infoOL.subjects.map(s => s.name));
                  if (!book.genre && genres.length) updated.genre = cleanGenres(genres);
                  if (!book.summary) updated.summary = infoGB?.description || infoOL?.description || book.summary;
                  // Si no hay portada, usar la de Google Books o OpenLibrary
                  if (!book.coverImage || book.coverImage.length === 0) {
                    const imageUrl = infoGB?.imageLinks?.thumbnail 
                      || infoOL?.cover?.large 
                      || infoOL?.cover?.medium 
                      || infoOL?.cover?.small;
                    
                    if (imageUrl) {
                      try {
                        // Descargar imagen y convertir a bytes
                        const { bytes } = await downloadImageAsBytes(imageUrl);
                        updated.coverImage = Array.from(bytes);
                      } catch (error) {
                        console.error('Error al descargar imagen de portada:', error);
                        // Si falla, mantener la imagen actual
                      }
                    }
                  }
                  if (!book.pageCount) updated.pageCount = infoGB?.pageCount || infoOL?.number_of_pages || book.pageCount;
                  if (!book.publicationDate) updated.publicationDate = infoGB?.publishedDate || infoOL?.publish_date || book.publicationDate;
                  function normalizeDate(date) {
                    if (!date) return null;
                    if (/^\d{4}$/.test(date)) return date + "-01-01";
                    if (/^\d{4}-\d{2}$/.test(date)) return date + "-01";
                    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
                    if (date instanceof Date) return date.toISOString().split('T')[0];
                    return null;
                  }
                  try {
                    const token = localStorage.getItem("token");
                    // Convertir array de bytes a base64 si existe imagen
                    const coverImageBase64 = updated.coverImage ? btoa(String.fromCharCode(...updated.coverImage)) : null;
                    const formToSend = {
                      Title: updated.title,
                      Author: updated.author,
                      Series: updated.series,
                      Publisher: updated.publisher,
                      Genre: updated.genre,
                      ISBN: updated.isbn,
                      PublicationDate: normalizeDate(updated.publicationDate),
                      PageCount: updated.pageCount,
                      StartReadingDate: updated.startReadingDate,
                      EndReadingDate: updated.endReadingDate,
                      Status: Number(updated.status),
                      LentTo: updated.lentTo,
                      Summary: updated.summary,
                      Language: updated.language || null,
                      Country: updated.country || null,
                      CoverImage: coverImageBase64,
                    };
                    const res = await axiosClient.put(`/books/${book.id}`, formToSend);
                    if (res.status === 200) {
                      const saved = res.data;
                      setBook(saved);
                      alert("Datos completados y guardados automáticamente (solo campos vacíos)");
                    } else if (res.status === 204) {
                      const refreshed = await axiosClient.get(`/books/${book.id}`);
                      if (refreshed.status === 200) {
                        const saved = refreshed.data;
                        setBook(saved);
                        alert("Datos completados y guardados automáticamente (solo campos vacíos)");
                      } else {
                        setBook(updated);
                        alert("Datos completados localmente, pero no se pudieron guardar en el servidor (GET fallido)");
                      }
                    } else {
                      let errorText = "";
                      try {
                        errorText = res.data?.error || JSON.stringify(res.data) || `${res.status} ${res.statusText}`;
                      } catch (err) {
                        errorText = `${res.status} ${res.statusText}`;
                      }
                      setBook(updated);
                      alert("Error al guardar en el servidor: " + errorText);
                    }
                  } catch (e) {
                    setBook(updated);
                    alert("Datos completados localmente, pero no se pudieron guardar en el servidor: " + e);
                  }
                }}
              >
                Completar datos
              </button>
              <button
                className="book-detail-btn book-detail-btn-blue"
                onClick={() => setEditing(true)}
              >
                Editar
              </button>
              <button
                className="book-detail-btn book-detail-btn-purple"
                onClick={() => navigate(-1)}
              >
                Volver
              </button>
              <button
                className="book-detail-btn book-detail-btn-red"
                onClick={async () => {
                  if (window.confirm("¿Seguro que quieres eliminar este libro?")) {
                    try {
                      const res = await axiosClient.delete(`/books/${book.id}`);
                      if (res.status !== 200 && res.status !== 204) throw new Error("No se pudo eliminar el libro");
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
  
        {showCoverSearch && (
          <div className="book-detail-modal-bg">
            <div className="book-detail-modal">
              <button
                className="book-detail-modal-close"
                onClick={() => setShowCoverSearch(false)}
              >
                &times;
              </button>
              <h2 className="book-detail-modal-title">Buscar portada en Internet</h2>
              <form
                className="book-detail-modal-form"
                
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoadingCovers(true);
                  setCoverResults([]);
                  try {
                    // Construir query precisa usando los valores actuales del formulario
                    let query = "";
                    if (form.title && form.author) {
                      query = `intitle:\"${form.title.trim()}\" inauthor:\"${form.author.trim()}\"`;
                    } else if (form.title) {
                      query = `intitle:\"${form.title.trim()}\"`;
                    } else if (form.author) {
                      query = `inauthor:\"${form.author.trim()}\"`;
                    } else if (coverQuery) {
                      query = coverQuery;
                    } else {
                      query = "";
                    }
                    const res = await fetch(
                      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
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
                  className="book-detail-input"
                  type="text"
                  placeholder="Título, autor..."
                  value={coverQuery}
                  onChange={e => setCoverQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="book-detail-btn book-detail-btn-blue"
                >
                  Buscar
                </button>
              </form>
              {loadingCovers && <div className="mb-4 text-center">Buscando portadas...</div>}
              <div className="book-detail-cover-grid">
                {coverResults.map((cover, idx) =>
                  cover.url && (
                    <div
                      key={idx}
                      className="book-detail-cover-option"
                      onClick={async () => {
                        try {
                          // Descargar imagen y asegurar conversión a array de bytes
                          const { bytes } = await downloadImageAsBytes(cover.url);
                          let imageBytes;
                          if (Array.isArray(bytes)) {
                            imageBytes = Array.from(bytes);
                          } else if (typeof bytes === 'string') {
                            // Si viene en base64, convertir a array de bytes
                            const base64 = bytes.split(',')[1] || bytes;
                            const binary = atob(base64);
                            imageBytes = Array.from(new Uint8Array([...binary].map(c => c.charCodeAt(0))));
                          } else if (bytes instanceof ArrayBuffer) {
                            imageBytes = Array.from(new Uint8Array(bytes));
                          } else if (bytes instanceof Uint8Array) {
                            imageBytes = Array.from(bytes);
                          } else if (bytes && typeof bytes === 'object' && typeof bytes.buffer === 'object') {
                            // Si es un objeto tipo Buffer (por ejemplo, de Node.js)
                            imageBytes = Array.from(new Uint8Array(bytes.buffer));
                          } else {
                            throw new Error('Formato de imagen no soportado');
                          }
                          setForm(f => ({ ...f, coverImage: imageBytes }));
                          alert("Portada guardada correctamente");
                        } catch (error) {
                          console.error('Error al procesar imagen de Internet:', error);
                          alert("Error al guardar portada desde Internet: " + error.message);
                        }
                        setShowCoverSearch(false);
                      }}
                    >
                      <img src={cover.url} alt={cover.title} className="book-detail-cover-thumb" />
                      <div className="book-detail-cover-title">{cover.title}</div>
                      <div className="book-detail-cover-authors">{cover.authors}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        <AnimatePresence>
          {showImageModal && (
            <motion.div
              className="book-detail-modal-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 2000
              }}
              onClick={() => { setShowImageModal(false); setZoom(1); }} // resetea zoom al cerrar
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()} // evita cerrar al clickear dentro
              >
                <button
                  onClick={() => { setShowImageModal(false); setZoom(1); }}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "12px",
                    fontSize: "1.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    zIndex: 10
                  }}
                >
                  &times;
                </button>

                {/* Imagen con zoom */}
                <motion.img
                  src={getImageUrl(book)}
                  alt={book.title}
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    borderRadius: "8px",
                    display: "block",
                    transform: `scale(${zoom})`,
                    transition: "transform 0.1s ease-out"
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1; // rueda hacia abajo = achicar, arriba = agrandar
                    setZoom((z) => Math.min(Math.max(0.5, z + delta), 3)); // límite 0.5x a 3x
                  }}
                />

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default BookDetailPage;