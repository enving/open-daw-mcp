FROM node:18-alpine

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies
RUN npm ci --only=production

# Kopiere Source Code
COPY . .

# Erstelle output Verzeichnis
RUN mkdir -p output

# Exponiere Port
EXPOSE 3002

# Starte den Server
CMD ["node", "daw-http-server.js"] 