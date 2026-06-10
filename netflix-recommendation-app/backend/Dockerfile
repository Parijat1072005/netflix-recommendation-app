# Start with a lightweight Python image
FROM python:3.10-slim

WORKDIR /app

# Add curl and build utilities
RUN apt-get update && apt-get install -y curl build-essential

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# 1. Install modern NumPy (2.0+)
RUN pip install --no-cache-dir numpy>=2.0.0

# 2. Install the updated scikit-surprise that fully supports NumPy 2 natively
RUN pip install --no-cache-dir scikit-surprise==1.1.5

# 3. Install any remaining requirements (like pandas)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy your actual application files
COPY . .

EXPOSE 5000

# Start the Node server
CMD ["node", "server.js"]