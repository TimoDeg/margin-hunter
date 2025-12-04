FROM python:3.11-slim

WORKDIR /app

# Installiere System Dependencies für Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Kopiere requirements
COPY scraper/requirements.txt /app/scraper/requirements.txt

# Installiere Python Dependencies
RUN pip install --no-cache-dir -r /app/scraper/requirements.txt

# Installiere Playwright Browser (Dependencies sind bereits manuell installiert)
RUN playwright install chromium

# Kopiere gesamten Code
COPY . /app/

# Set Python Path
ENV PYTHONPATH=/app

# Entry Point
CMD ["python", "-m", "scraper.main"]
