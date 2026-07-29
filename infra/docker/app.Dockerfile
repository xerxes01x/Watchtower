FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Entrypoint runs the startup sequence (validate config -> wait for DB ->
# migrate) and only then launches Uvicorn. Fails the container on any error.
CMD ["python", "bootstrap.py"]
