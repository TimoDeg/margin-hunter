## API Contract – Margin Hunter MVP

### Basis

- Alle Endpoints sind unter dem Prefix `/api` verfügbar (siehe `backend/app/api/__init__.py` und `nginx/nginx.conf`).
- Responses sind JSON, Fehler folgen FastAPI-Standard (HTTP-Status + `detail`-Feld).

---

### Health

#### `GET /health`

- Beschreibung: Health-Check des Backends inkl. Datenbankstatus.
- Query: keine
- Response:
  - `status: "ok" | "degraded"`
  - `database: "connected" | "disconnected" | "not_configured"`

Beispiel:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### Products

Basierend auf `Product`-Model und `ProductOut`-Schema.

Gemeinsame Felder:

- `id: number` (nur in `ProductOut`)
- `name: string`
- `category: string`
- `brands: string[]`
- `filters: Record<string, any>`
- `price_min: number`
- `price_max: number`
- `active: boolean`
- `created_at: string (ISO Datetime, nur in ProductOut)`
- `updated_at: string (ISO Datetime, nur in ProductOut)`

#### `GET /api/products`

- Beschreibung: Liste aller Produkte.
- Query: keine
- Response: `ProductOut[]`

#### `POST /api/products`

- Beschreibung: Neues Produkt anlegen.
- Body (`ProductCreate`, identisch zu `ProductBase`):

```json
{
  "name": "NVIDIA RTX 3080",
  "category": "gpu",
  "brands": ["NVIDIA", "RTX"],
  "filters": { "min_vram_gb": 10 },
  "price_min": 400.0,
  "price_max": 800.0,
  "active": true
}
```

- Response: `ProductOut`

#### `PUT /api/products/{product_id}`

- Beschreibung: Produkt aktualisieren (partial update).
- Pfadparameter:
  - `product_id: number`
- Body (`ProductUpdate`, alle Felder optional):

```json
{
  "name": "Neue Bezeichnung",
  "price_min": 350.0
}
```

- Response: `ProductOut`

#### `DELETE /api/products/{product_id}`

- Beschreibung: Produkt löschen.
- Pfadparameter:
  - `product_id: number`
- Response: HTTP 204 (kein Body).

---

### Offers

Basierend auf `Offer`-Model und `OfferOut`-Schema.

Gemeinsame Felder (`OfferBase`):

- `id: number` (nur in `OfferOut`)
- `product_id: number`
- `title: string`
- `price: number`
- `url: string`
- `image_url?: string | null`
- `seller_name?: string | null`
- `location?: string | null`
- `description?: string | null`
- `status: string` (z.B. `"new"`, `"open"`, `"ignored"`, `"contacted"`)
- `margin_percent?: number | null`
- `geizhals_price?: number | null`
- `first_seen_at: string (ISO Datetime, nur in OfferOut)`
- `last_checked_at: string (ISO Datetime, nur in OfferOut)`

#### `GET /api/offers`

- Beschreibung: Liste von Offers mit optionalen Filtern.
- Query-Parameter:
  - `status?: string` – Filter nach Offer-Status.
  - `product_id?: number` – Filter nach Produkt.
  - `min_margin?: number` – Mindest-Marge in Prozent.
- Response: `OfferOut[]`

Beispiel:

- `GET /api/offers?status=open&min_margin=10`

#### `GET /api/offers/{offer_id}`

- Beschreibung: Einzelnes Offer-Detail.
- Pfadparameter:
  - `offer_id: number`
- Response: `OfferOut`

#### `GET /api/offers/{offer_id}/history`

- Beschreibung: Preis-Historie eines Offers.
- Pfadparameter:
  - `offer_id: number`
- Response: `PriceHistoryOut[]`

Felder (`PriceHistoryOut`):

- `id: number`
- `offer_id: number`
- `price: number`
- `recorded_at: string (ISO Datetime)`

#### `PUT /api/offers/{offer_id}/status`

- Beschreibung: Nur den Status eines Offers aktualisieren.
- Pfadparameter:
  - `offer_id: number`
- Body (`OfferUpdateStatus`):

```json
{
  "status": "ignored"
}
```

- Response: `OfferOut`

#### `POST /api/offers`

- Beschreibung: Neues Offer manuell anlegen (z.B. für Tests/Seeding über UI).
- Body (`OfferCreate`, identisch zu `OfferBase` ohne `id` + Timestamps):

```json
{
  "product_id": 1,
  "title": "RTX 3080 Angebot",
  "price": 550.0,
  "url": "https://example.com/offer/rtx-3080-demo-1",
  "image_url": null,
  "seller_name": "Max Mustermann",
  "location": "Berlin",
  "description": "Guter Zustand",
  "status": "new",
  "margin_percent": 25.0,
  "geizhals_price": 700.0
}
```

- Response: `OfferOut`

---

### Scraper

Die Endpoints sind aktuell Stubs (siehe `backend/app/api/scraper.py`) und geben noch keinen echten Celery/Redis-Status zurück.

#### `POST /api/scraper/start`

- Beschreibung: Startsignal für den Scraper (später Celery-Task).
- Body: keiner
- Response (HTTP 202):

```json
{ "detail": "Scraper start requested" }
```

#### `GET /api/scraper/status`

- Beschreibung: Status des Scrapers (Stub).
- Body: keiner
- Response:

```json
{
  "status": "unknown",
  "detail": "Scraper status endpoint not yet implemented"
}
```

#### `POST /api/scraper/stop`

- Beschreibung: Stoppsignal für den Scraper (Stub).
- Body: keiner
- Response (HTTP 202):

```json
{ "detail": "Scraper stop requested" }
```


