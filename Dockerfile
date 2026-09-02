# Stage 1: Build Frontend (React + Vite)
FROM node:20-slim AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Runtime (Python + FastAPI)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, configuration, rules, and tests
COPY server/ ./server/
COPY firestore.rules .
COPY pytest.ini .
COPY tests/ ./tests/

# Copy compiled frontend from builder stage
COPY --from=frontend-builder /app/client/dist ./client/dist

# Start server using Python entrypoint (dynamically reads Cloud Run $PORT from environment)
CMD ["python", "-m", "server.main"]
