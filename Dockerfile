# Backend runtime stage
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend source code
COPY . .

EXPOSE 8000

# Production-ready command
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "main:app", "-w", "2", "-b", "0.0.0.0:8000"]