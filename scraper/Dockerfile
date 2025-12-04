FROM python:3.11-slim

WORKDIR /app

# Installiere nur minimal notwendige System Dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Kopiere requirements
COPY scraper/requirements.txt /app/scraper/requirements.txt

# Installiere Python Dependencies (KEIN Playwright/Chromium mehr!)
RUN pip install --no-cache-dir -r /app/scraper/requirements.txt

# Kopiere gesamten Code
COPY . /app/

# Set Python Path
ENV PYTHONPATH=/app

# Entry Point
CMD ["python", "-m", "scraper.main"]
