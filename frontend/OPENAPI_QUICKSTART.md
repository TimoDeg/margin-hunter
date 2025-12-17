# 🚀 OpenAPI Type-Safety Quick Start

**Backend-API ändert sich → TypeScript-Compiler warnt → Keine Runtime-Fehler mehr!**

## ⚡ 3-Schritte Setup

### 1️⃣ Backend starten

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2️⃣ TypeScript-Typen generieren

```bash
cd frontend
npm run openapi:generate
```

✅ Erstellt: `src/api/generated/schema.ts`

### 3️⃣ In deinem Code nutzen

```typescript
// ❌ Alt
import { listOffers } from './api/offers'

// ✅ Neu
import { listOffers } from './api/offers-typesafe'

// API-Call bleibt gleich!
const offers = await listOffers({ status: 'new' })
```

## 📋 Verfügbare Commands

| Command | Beschreibung |
|---------|-------------|
| `npm run openapi:generate` | Generiert TypeScript-Typen aus Backend |
| `npm run openapi:watch` | Watch-Mode: Auto-regeneriert bei Änderungen |
| `npm run typecheck` | Prüft TypeScript-Typen ohne Build |
| `npm run typecheck:strict` | Generiert + Prüft (für CI/CD) |

## 🎯 Was ist jetzt type-safe?

### ✅ Endpoint-Namen

```typescript
// ❌ Typo wird erst zur Runtime bemerkt
apiClient.get('/offerz')

// ✅ TypeScript-Error: Endpoint existiert nicht
apiClient.GET('/offerz')
//             ^^^^^^^^ Error!
```

### ✅ Request-Bodies

```typescript
// ❌ Falscher Feldtyp - Runtime-Error!
createProduct({ 
  brands: "Apple"  // Sollte string[] sein!
})

// ✅ TypeScript-Error: brands muss string[] sein
createProduct({ 
  brands: "Apple"  // ❌ Type 'string' is not assignable to 'string[]'
})
```

### ✅ Response-Types

```typescript
// ❌ Manuelles Typing - kann falsch sein
const offers = await apiClient.get<Offer[]>('/offers')

// ✅ Automatisches Typing - immer korrekt
const offers = await apiClient.GET('/offers')
// offers.data ist automatisch Offer[]!
```

### ✅ Query-Parameter

```typescript
// ❌ Unbekannter Parameter - Backend ignoriert ihn
listOffers({ statos: 'new' })  // Typo!

// ✅ TypeScript-Error: statos existiert nicht
listOffers({ statos: 'new' })
//           ^^^^^^ Error! Did you mean 'status'?
```

## 🔥 Beispiel: Backend-Änderung wird sofort erkannt

### Backend ändert API

```python
# backend/app/models/offer.py
class OfferStatusUpdate(BaseModel):
    status: Literal["new", "open", "closed"]
    # ↑ "ignored" wurde entfernt!
```

### Dein Frontend-Code

```typescript
// Nach: npm run openapi:generate
updateOfferStatus(1, { status: "ignored" })
//                              ^^^^^^^^
// ❌ TypeScript-Error:
// Type '"ignored"' is not assignable to type '"new" | "open" | "closed"'
```

**✅ Fehler wird VOR Deployment gefunden!**

## 📂 Neue Dateien

```
frontend/
├── src/api/
│   ├── generated/
│   │   └── schema.ts              ← 🆕 Auto-generiert
│   ├── client-typesafe.ts         ← 🆕 Type-safe Client
│   ├── offers-typesafe.ts         ← 🆕 Type-safe Offers API
│   └── products-typesafe.ts       ← 🆕 Type-safe Products API
│
├── .github/workflows/
│   └── frontend-typecheck.yml     ← 🆕 CI/CD Type-Check
│
└── OPENAPI_CODEGEN_GUIDE.md       ← 🆕 Vollständige Doku
```

## 🔄 Migration eines Hooks

### Vorher: `hooks/useOffers.ts`

```typescript
import { listOffers, type Offer } from '../api/offers'
```

### Nachher: `hooks/useOffers.ts`

```typescript
import { listOffers, type Offer } from '../api/offers-typesafe'
// ✅ Nur Import geändert - Rest bleibt gleich!
```

### Vollständiges Beispiel

Siehe: `hooks/useOffers-typesafe.example.ts`

## 🤖 CI/CD: GitHub Actions

Workflow prüft automatisch:
1. ✅ Backend startet erfolgreich
2. ✅ OpenAPI-Schema ist verfügbar
3. ✅ TypeScript-Typen werden generiert
4. ✅ Frontend kompiliert ohne Fehler

**Bei Inkompatibilität:**
- ❌ Build schlägt fehl
- 💬 Kommentar im PR mit Details
- 🚫 Merge wird blockiert

## 🐛 Häufige Probleme

### "fetch failed" / ECONNREFUSED

❌ **Problem:** Backend läuft nicht

```bash
✅ Lösung:
cd backend
uvicorn app.main:app --reload --port 8000
```

### "schema.ts not found"

❌ **Problem:** Schema wurde noch nicht generiert

```bash
✅ Lösung:
npm run openapi:generate
```

### TypeScript-Fehler nach Schema-Update

❌ **Problem:** Backend-API hat sich geändert

```bash
✅ Lösung:
1. npm run typecheck          # Siehe Fehler
2. Passe Frontend-Code an
3. npm run typecheck          # Prüfe erneut
```

## 📚 Weitere Dokumentation

- **Vollständiger Guide:** `OPENAPI_CODEGEN_GUIDE.md`
- **GitHub Actions:** `.github/workflows/frontend-typecheck.yml`
- **Beispiel-Hook:** `hooks/useOffers-typesafe.example.ts`
- **openapi-typescript Docs:** https://openapi-ts.dev/

## ✨ Benefits

| Vorher | Nachher |
|--------|---------|
| ❌ Manuelle Typen pflegen | ✅ Automatisch aus Backend |
| ❌ Runtime-Errors | ✅ Compile-Time-Errors |
| ❌ "undefined is not a function" | ✅ TypeScript-Warnung |
| ❌ Veraltete Typen | ✅ Immer synchron |
| ❌ Keine Autocomplete | ✅ Full Autocomplete |

---

**Happy Type-Safe Coding! 🎉**

