# Automatisch generierte TypeScript-Typen

Dieser Ordner enthält TypeScript-Typen, die automatisch aus dem FastAPI OpenAPI-Schema generiert werden.

## Generierung

```bash
# Einmalige Generierung
npm run openapi:generate

# Watch-Modus (regeneriert bei Schema-Änderungen)
npm run openapi:watch
```

## ⚠️ Wichtig

- **NICHT manuell bearbeiten!** Diese Dateien werden automatisch generiert.
- `schema.ts` wird bei jedem `npm run openapi:generate` überschrieben.
- Die Datei sollte **nicht** in Git committed werden (optional).

## Verwendung

```typescript
import type { paths, components } from './generated/schema'
import createClient from 'openapi-fetch'

const client = createClient<paths>({ baseUrl: '/api' })

// Type-safe API calls
const { data, error } = await client.GET('/offers')
```

## Backend muss laufen!

Stelle sicher, dass dein FastAPI-Backend läuft:
```bash
# Im backend/ Ordner
uvicorn app.main:app --reload --port 8000
```

