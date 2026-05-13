# ETAPA 1: Compilación
# Usamos Node 22-alpine para cumplir con los requisitos del Angular CLI
FROM node:22-alpine AS build
WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar el caché de Docker
COPY package*.json ./
RUN npm ci

# Copiamos todo el código fuente
COPY . .

# Ejecutamos la construcción de producción
RUN npm run build --configuration=production

# ETAPA 2: Servidor Web
FROM nginx:alpine

# Copiamos la configuración de Nginx para manejar rutas de Angular (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# COPIAR ARCHIVOS: 
# IMPORTANTE: Si la build falla en este paso, verifica si la ruta es:
# /app/dist/ipsweb O /app/dist/ipsweb/browser
COPY --from=build /app/dist/IPSWeb/browser /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]