# Use Node.js base image
FROM node:16.15.0

# Set working directory
WORKDIR /app

# Install required system libraries
RUN apk add --no-cache libc6-compat

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
