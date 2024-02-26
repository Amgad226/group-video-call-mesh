# Use Node.js base image
FROM node:20.11.1-alpine3.19

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the backend files
COPY . .

# Expose port
EXPOSE 8000

# Command to run the Express.js app
CMD ["npm", "start"]
