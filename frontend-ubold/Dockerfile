# Usar imagen base de Node.js 20.9.0 o superior
FROM node:20.9.0-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY bun.lock* ./
COPY yarn.lock* ./

# Instalar dependencias
RUN npm ci --prefer-offline --no-audit || npm install

# Copiar el resto de los archivos
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]

