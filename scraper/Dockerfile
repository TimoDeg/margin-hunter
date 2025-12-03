FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# Platzhalter, bis der eigentliche Scraper implementiert ist
# Verhindert Crash-Loops, loggt aber klar, dass es nur ein Stub ist.
CMD ["python", "-c", "print('scraper placeholder container running'); import time; time.sleep(3600)"]

