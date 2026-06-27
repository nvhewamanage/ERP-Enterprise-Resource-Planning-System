FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Add this line to compile the Next.js app
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]