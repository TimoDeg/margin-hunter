FROM node:20-alpine

WORKDIR /app

# Installiere Dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Kopiere Source-Code
COPY . .

# Exponiere Port für Vite Dev-Server
EXPOSE 5173

# Starte Vite Dev-Server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

