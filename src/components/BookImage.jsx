import React, { useMemo } from 'react';
import { bytesToDataUrl } from '../utils/imageUtils';

/**
 * Componente para mostrar imágenes que vienen como arrays de bytes
 * @param {Object} props 
 * @param {Array<number>} props.imageData - Array de bytes de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS
 * @param {Object} props.style - Estilos inline
 * @param {string} props.mimeType - Tipo MIME para arrays de bytes (default: 'image/jpeg')
 * @param {string} props.placeholder - URL de imagen placeholder por defecto
 */
const BookImage = ({
  imageData,
  alt = "Portada del libro",
  className = "",
  style = {},
  mimeType = 'image/jpeg',
  placeholder = "https://via.placeholder.com/192x288?text=Sin+Portada",
  ...otherProps
}) => {
  // Memoizar la URL de la imagen para evitar recálculos innecesarios
  const imageUrl = useMemo(() => {
    // Si imageData es un array de bytes, convertir a data URL
    if (Array.isArray(imageData) && imageData.length > 0) {
      try {
        return bytesToDataUrl(imageData, mimeType);
      } catch (error) {
        console.error('Error al convertir bytes a data URL:', error);
        return placeholder;
      }
    }
    
    // Usar placeholder si no hay datos de imagen
    return placeholder;
  }, [imageData, mimeType, placeholder]);

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        // Si la imagen falla al cargar, mostrar placeholder
        if (e.target.src !== placeholder) {
          e.target.src = placeholder;
        }
      }}
      {...otherProps}
    />
  );
};

export default BookImage;