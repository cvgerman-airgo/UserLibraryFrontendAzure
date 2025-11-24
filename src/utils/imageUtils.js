// Utilidades para manejo de imágenes como arrays de bytes

/**
 * Convierte un File a base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - Base64 string con prefijo data:image/...
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convierte un File a array de bytes
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Uint8Array>} - Array de bytes
 */
export const fileToBytes = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Convierte un array de bytes a URL de datos para mostrar en img src
 * @param {Array<number>|Uint8Array} byteArray - Array de bytes de la imagen
 * @param {string} mimeType - Tipo MIME de la imagen (ej: 'image/jpeg', 'image/png')
 * @returns {string} - URL de datos para usar en src
 */
export const bytesToDataUrl = (byteArray, mimeType = 'image/jpeg') => {
  if (!byteArray || byteArray.length === 0) {
    return null;
  }
  
  // Convertir a Uint8Array si es necesario
  const uint8Array = byteArray instanceof Uint8Array ? byteArray : new Uint8Array(byteArray);
  
  // Convertir a base64
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);
  
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Convierte base64 a array de bytes
 * @param {string} base64String - String base64 (con o sin prefijo data:)
 * @returns {Uint8Array} - Array de bytes
 */
export const base64ToBytes = (base64String) => {
  // Remover prefijo data: si existe
  const base64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  
  // Decodificar base64
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
};

/**
 * Determina el tipo MIME de una imagen basado en su extensión
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Tipo MIME
 */
export const getMimeTypeFromFilename = (filename) => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg'; // Default
  }
};

/**
 * Descarga una imagen desde URL y la convierte a bytes
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<{bytes: Uint8Array, mimeType: string}>} - Objeto con bytes y tipo MIME
 */
export const downloadImageAsBytes = async (imageUrl) => {
  try {
    // Lista de proxies CORS gratuitos para intentar
    const corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      // Intentar directo al final
      ''
    ];

    let lastError = null;
    
    // Intentar con cada proxy
    for (let i = 0; i < corsProxies.length; i++) {
      try {
        const proxyUrl = corsProxies[i] + encodeURIComponent(imageUrl);
        const finalUrl = i === corsProxies.length - 1 ? imageUrl : proxyUrl;
        
        console.log(`Intentando descargar imagen (intento ${i + 1}): ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'image/*,*/*'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        
        console.log(`✅ Imagen descargada correctamente (${bytes.length} bytes)`);
        return { bytes, mimeType };
        
      } catch (error) {
        console.log(`❌ Fallo con método ${i + 1}: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`Todos los métodos de descarga fallaron. Último error: ${lastError?.message}`);
    
  } catch (error) {
    console.error('Error descargando imagen:', error);
    throw error;
  }
};

/**
 * Redimensiona una imagen manteniendo la proporción
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} - Blob de la imagen redimensionada
 */
export const resizeImage = (file, maxWidth = 400, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }
      }
      
      // Redimensionar
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};