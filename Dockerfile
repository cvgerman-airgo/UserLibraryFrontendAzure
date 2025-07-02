# Usa una imagen oficial de Node.js como base
FROM node:20.11.1-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto por defecto de React
EXPOSE 3000

# Comando por defecto: desarrollo en caliente
CMD ["npm", "start"]