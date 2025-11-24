// Servicio base para llamadas al backend
const API_BASE_URL = "http://localhost:8080/api";

export async function apiFetch(endpoint, options = {}) {
	const url = `${API_BASE_URL}/${endpoint}`;
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`Error en la petición: ${response.status}`);
	}
	return await response.json();
}

// Ejemplo de uso:
// apiFetch('books')
