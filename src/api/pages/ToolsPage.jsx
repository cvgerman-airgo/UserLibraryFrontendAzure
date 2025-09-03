import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ToolsPage() {
  const navigate = useNavigate();

  // Estados para autores/editoriales y merges
  const [allPublishers, setAllPublishers] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  const [publisherMap, setPublisherMap] = useState({});
  const [authorMap, setAuthorMap] = useState({});
  const [mergePublisherTargets, setMergePublisherTargets] = useState({});
  const [mergeAuthorTargets, setMergeAuthorTargets] = useState({});
  const [updating, setUpdating] = useState(false);
  // Estados para CSV import/export
  const [file, setFile] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  // Estados para autores
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [mergeTargetAuthor, setMergeTargetAuthor] = useState(null);
  // Estados para editoriales
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [mergeTargetPublisher, setMergeTargetPublisher] = useState(null);
  // Cargar datos iniciales
  useEffect(() => {
    fetchPublishersAndAuthors();
  }, []);

  const fetchPublishersAndAuthors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/books/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al cargar datos");
      const data = await response.json();
      setAllPublishers(data.publishers);
      setAllAuthors(data.authors);
      setPublisherMap(data.publisherMap);
      setAuthorMap(data.authorMap);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const downloadBooksCsv = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("No estás autenticado."); return; }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/books/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`No se pudo descargar la base de datos.\nCódigo: ${response.status}\n${errorText}`);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "books.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error al descargar CSV.");
    }
  };

  const importCsv = async () => {
    if (!file) { alert("Selecciona un archivo CSV primero."); return; }
    const token = localStorage.getItem("token");
    if (!token) { alert("No estás autenticado."); return; }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/books/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Error al importar CSV:\n${errorText}`);
        return;
      }
      const data = await response.json();
      setImportMessage(`Importación completada:
        \nAñadidos: ${data.added}
        \nActualizados: ${data.updated}
        \nOmitidos: ${data.skipped}`);
    } catch (err) {
      console.error(err);
      alert("Error al importar CSV.");
    }
  };

const handleMergePublisher = async (oldValue, newValue) => {
  if (!newValue) {
    alert("Selecciona una editorial y el destino de fusión");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/tools/merge-publisher`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ oldValue, newValue }),
      }
    );

    if (response.ok) {
      // Solo intentamos leer JSON si el status no es 204
      if (response.status !== 204) {
        const data = await response.json();
        console.log("Respuesta del backend:", data);
      }      
      alert(`Editorial "${oldValue}" fusionada en "${newValue}"`);
        fetchPublishersAndAuthors();             // refrescar lista        
    } else {
      const errorText = await response.text();
      alert("Error al fusionar: " + errorText);
    }
  } catch (error) {
    console.error("Error al fusionar editorial:", error);
    alert("Error de conexión con el servidor.");
  }
};

const handleMergeAuthor = async (oldValue, newValue) => {
  if (!newValue) {
    alert("Selecciona un autor y el destino de fusión");
    return;
  }
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/tools/merge-author`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ oldValue, newValue }),
      }
    );

    if (response.ok) {
      // Solo intentamos leer JSON si el status no es 204
      if (response.status !== 204) {
        const data = await response.json();
        console.log("Respuesta del backend:", data);
      }

      alert(`Autor "${oldValue}" fusionado en "${newValue}"`);
        fetchPublishersAndAuthors();              // refrescar lista
    } else {
      const errorText = await response.text();
      alert("Error al fusionar: " + errorText);
    }
  } catch (error) {
    console.error("Error al fusionar autor:", error);
    alert("Error de conexión con el servidor.");
  }
};

return (
  <div className="p-4 max-w-4xl mx-auto">
    {/* Importar / Exportar */}
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center">Importar / Exportar</h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
          Seleccionar archivo
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          onClick={importCsv}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Importar CSV
        </button>
        <button
          onClick={downloadBooksCsv}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Exportar CSV
        </button>
      </div>
      {importMessage && (
        <div className="mt-4 text-center text-sm text-gray-700 whitespace-pre-line">
          {importMessage}
        </div>
      )}
    </div>

    {/* Herramientas de fusión */}
    <div>
      <h2 className="text-xl font-semibold mb-4 text-center">Herramientas de fusión</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editoriales */}
        <div>
          <h3 className="text-lg font-medium mb-2">Editoriales</h3>

          {/* Vista escritorio (tabla) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Fusionar con</th>
                </tr>
              </thead>
              <tbody>
                {allPublishers.map((publisher) => (
                  <tr key={publisher} className="hover:bg-gray-50">
                    <td className="p-2 border">{publisher}</td>
                    <td className="p-2 border flex items-center gap-2">
                      <select
                        className="border p-1 rounded w-full"
                        value={mergePublisherTargets[publisher] || ""}
                        onChange={(e) =>
                          setMergePublisherTargets((prev) => ({
                            ...prev,
                            [publisher]: e.target.value,
                          }))
                        }
                      >
                        <option value="">-- Seleccionar --</option>
                        {allPublishers
                          .filter((p) => p !== publisher)
                          .map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                      </select>
                        <button
                          onClick={() => handleMergePublisher(publisher, mergePublisherTargets[publisher])}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          disabled={!mergePublisherTargets[publisher]}
                        >
                          Fusionar con
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (lista) */}
          <div className="sm:hidden space-y-3">
            {allPublishers.map((publisher) => (
              <div
                key={publisher}
                className="border p-2 rounded-lg shadow-sm bg-white"
              >
                <p className="font-medium mb-2">{publisher}</p>
                <div className="flex items-center gap-2">
                  <select
                    className="border p-1 rounded w-full"
                    value={mergePublisherTargets[publisher] || ""}
                    onChange={(e) =>
                      setMergePublisherTargets((prev) => ({
                        ...prev,
                        [publisher]: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Seleccionar --</option>
                    {allPublishers
                      .filter((p) => p !== publisher)
                      .map((target) => (
                        <option key={target} value={target}>
                          {target}
                        </option>
                      ))}
                  </select>
                    <button
                      onClick={() => handleMergePublisher(publisher, mergePublisherTargets[publisher])}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={!mergePublisherTargets[publisher]}
                    >
                      Fusionar con
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Autores */}
        <div>
          <h3 className="text-lg font-medium mb-2">Autores</h3>

          {/* Vista escritorio (tabla) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Fusionar con</th>
                </tr>
              </thead>
              <tbody>
                {allAuthors.map((author) => (
                  <tr key={author} className="hover:bg-gray-50">
                    <td className="p-2 border">{author}</td>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <select
                          className="border p-1 rounded w-full"
                          value={mergeAuthorTargets[author] || ""}
                          onChange={(e) =>
                            setMergeAuthorTargets((prev) => ({
                              ...prev,
                              [author]: e.target.value,
                            }))
                          }
                        >
                          <option value="">-- Seleccionar --</option>
                          {allAuthors
                            .filter((a) => a !== author)
                            .map((target) => (
                              <option key={target} value={target}>
                                {target}
                              </option>
                            ))}
                        </select>
                          <button
                            onClick={() => handleMergeAuthor(author, mergeAuthorTargets[author])}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={!mergeAuthorTargets[author]}
                          >
                            Fusionar con
                          </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (lista) */}
          <div className="sm:hidden space-y-3">
            {allAuthors.map((author) => (
              <div
                key={author}
                className="border p-2 rounded-lg shadow-sm bg-white"
              >
                <p className="font-medium mb-2">{author}</p>
                <div className="flex items-center gap-2">
                  <select
                    className="border p-1 rounded w-full"
                    value={mergeAuthorTargets[author] || ""}
                    onChange={(e) =>
                      setMergeAuthorTargets((prev) => ({
                        ...prev,
                        [author]: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Seleccionar --</option>
                    {allAuthors
                      .filter((a) => a !== author)
                      .map((target) => (
                        <option key={target} value={target}>
                          {target}
                        </option>
                      ))}
                  </select>
                    <button
                      onClick={() => handleMergeAuthor(author, mergeAuthorTargets[author])}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={!mergeAuthorTargets[author]}
                    >
                      Fusionar con
                    </button>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

}

export default ToolsPage;
