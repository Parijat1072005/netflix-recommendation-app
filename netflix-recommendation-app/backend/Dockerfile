# Start with a lightweight Python image
FROM python:3.10-slim

WORKDIR /app

# Add python3-dev to the Linux dependencies so C-extensions can compile
RUN apt-get update && apt-get install -y curl build-essential python3-dev

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# CRITICAL FIX: Install numpy FIRST, as scikit-surprise requires it to compile
RUN pip install --no-cache-dir numpy==1.26.4

# Install the rest of the Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy your actual application files (model, JSON, scripts)
COPY . .

EXPOSE 5000

# Start the Node server
CMD ["node", "server.js"]