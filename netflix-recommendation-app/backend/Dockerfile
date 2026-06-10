# Start with a lightweight Python image
FROM python:3.10-slim

WORKDIR /app

# Add python3-dev and build tools so C-extensions can compile
RUN apt-get update && apt-get install -y curl build-essential python3-dev

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# 1. Install build tools and the NEWEST NumPy 2.0
RUN pip install --no-cache-dir setuptools wheel cython numpy>=2.0.0

# 2. CRITICAL FIX: Upgrade to Surprise 1.1.4 which supports NumPy 2.0+
RUN pip install --no-cache-dir --no-build-isolation scikit-surprise==1.1.4

# 3. Install any remaining requirements
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