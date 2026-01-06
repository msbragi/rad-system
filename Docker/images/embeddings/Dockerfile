FROM python:3.11-slim

# Set work directory
WORKDIR /app/embeddings

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy all source files and requirements.txt
COPY ./src ./

# Install dependencies
# PyTorch installation - Choose based on your hardware:
# For CPU-only (default, smaller image ~200MB, delete row or set FASTAPI_GPU=NONE in docker-compose): 
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# For CUDA/GPU support (larger image ~2GB, set FASTAPI_GPU=CUDA in docker-compose):
# RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu121

# For ROCm/AMD GPU (set FASTAPI_GPU=ROCM in docker-compose):
# RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/rocm5.6

# For MPS/Apple Silicon GPU:
# MPS (Metal Performance Shaders) is NOT available in Docker containers.
# Docker on macOS runs in a Linux VM without access to Metal/GPU.
# To use MPS, run FastAPI natively on macOS with: pip install torch torchvision
# Then set FASTAPI_GPU=MPS environment variable when running uvicorn directly.

# Install other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

