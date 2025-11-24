# Migración de Imágenes a Arrays de Bytes

## Resumen de Cambios

Se ha modificado el sistema de manejo de imágenes para almacenar las portadas de libros **exclusivamente** como arrays de bytes en el campo `CoverImage` del DTO. Se han eliminado completamente los campos `coverUrl` y `thumbnailUrl`.

## Archivos Modificados

### Nuevos Archivos
- `src/utils/imageUtils.js` - Utilidades para conversión de imágenes
- `src/components/BookImage.jsx` - Componente helper para mostrar imágenes
- `docs/IMAGE_MIGRATION.md` - Este archivo de documentación

### Archivos Modificados
- `src/api/BookService.js` - Actualizado para manejar arrays de bytes
- `src/api/pages/BookDetailPage.jsx` - Actualizado para mostrar y subir imágenes como bytes
- `src/api/pages/UserBooksPage.jsx` - Actualizado para mostrar imágenes como bytes
- `src/api/components/GoogleBooksSearch.jsx` - Actualizado para manejar imágenes como bytes

## Cambios en el Backend Esperados

El backend debería:

1. **Campo CoverImage**: Aceptar arrays de bytes en el campo `CoverImage` del DTO de libro
2. **Campos eliminados**: Remover `coverUrl` y `thumbnailUrl` de los DTOs
3. **Endpoint upload-cover**: Modificar `/books/upload-cover` para recibir:
   ```json
   {
     "coverImage": [255, 216, 255, ...], // Array de bytes
     "isbn": "1234567890"
   }
   ```
4. **Respuesta de libros**: Incluir solo el campo `coverImage` como array de bytes:
   ```json
   {
     "id": 1,
     "title": "Ejemplo",
     "author": "Autor",
     "coverImage": [255, 216, 255, ...], // Array de bytes únicamente
     // ... otros campos (sin coverUrl ni thumbnailUrl)
   }
   ```

## Funciones Principales

### `imageUtils.js`

- `fileToBase64(file)` - Convierte File a base64
- `fileToBytes(file)` - Convierte File a array de bytes
- `bytesToDataUrl(byteArray, mimeType)` - Convierte bytes a data URL para mostrar
- `base64ToBytes(base64String)` - Convierte base64 a bytes
- `downloadImageAsBytes(imageUrl)` - Descarga imagen y convierte a bytes
- `resizeImage(file, maxWidth, maxHeight, quality)` - Redimensiona imagen

### `BookImage.jsx`

Componente React que maneja automáticamente:
- Arrays de bytes → data URL
- URLs existentes → uso directo
- Fallback a placeholder si falla

## Uso del Componente BookImage

```jsx
import BookImage from '../components/BookImage';

// Uso simplificado solo con coverImage:
<BookImage 
  imageData={book.coverImage} 
  alt="Portada"
  className="book-cover"
/>
```

## Flujo de Subida de Imagen

1. Usuario selecciona archivo
2. Archivo se convierte a array de bytes
3. Se envía al backend como array de bytes
4. Backend guarda bytes en campo `CoverImage`
5. Frontend recibe libro con `coverImage` como array de bytes
6. Se convierte a data URL para mostrar

## Pruebas Recomendadas

1. **Subir nueva imagen**: Verificar que se convierte correctamente a bytes
2. **Mostrar imagen existente**: Verificar que los bytes se convierten a data URL
3. **Imágenes de Internet**: Verificar descarga y conversión a bytes
4. **Fallback**: Verificar que se muestra placeholder si no hay imagen
5. **Base de datos limpia**: Verificar que funciona sin campos coverUrl/thumbnailUrl

## Optimizaciones Futuras

- Compresión de imágenes antes de enviar al servidor
- Thumbnails automáticos (como arrays de bytes separados)
- Lazy loading de imágenes
- Cache de data URLs convertidas

## Notas de Migración

- **BREAKING CHANGE**: Los campos `coverUrl` y `thumbnailUrl` han sido eliminados completamente
- Solo se usa el campo `coverImage` como array de bytes
- La base de datos nueva no contendrá referencias a archivos físicos
- Todas las imágenes se almacenan directamente en la base de datos como BLOB/bytes