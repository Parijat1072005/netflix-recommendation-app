# Start with a lightweight Python image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by scikit-surprise and Node.js
RUN apt-get update && apt-get install -y curl build-essential

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# Install Python machine learning dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy your actual application files (model, JSON, scripts)
COPY . .

# Render dynamically assigns a PORT, we expose 5000 as a default
EXPOSE 5000

# Start the Node server
CMD ["node", "server.js"]