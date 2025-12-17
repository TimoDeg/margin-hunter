/**
 * Type-safe Offers API mit automatisch generierten OpenAPI-Typen
 * 
 * ⚠️ WICHTIG: Vor der Verwendung muss das Schema generiert werden:
 * ```bash
 * npm run openapi:generate
 * ```
 * 
 * Migration von offers.ts:
 * - ❌ Alt: Manuelle Type-Definitionen (Offer, OfferCreate, etc.)
 * - ✅ Neu: Automatische Typen aus Backend-Schema
 * - ❌ Alt: apiClient.get<Offer[]>('/offers') - manuelles Typing
 * - ✅ Neu: apiClient.GET('/offers') - automatische Typen!
 */

import { apiClient, fetchOrThrow, type ApiQueryParams } from './client-typesafe'
import type { components } from './generated/schema'

// ============================================================================
// TYPES - Automatisch aus Backend-Schema generiert
// ============================================================================

/**
 * Haupttypen aus dem Backend-Schema
 * Diese werden NICHT manuell definiert - sie kommen aus schema.ts!
 */
export type Offer = components['schemas']['Offer']
export type OfferCreate = components['schemas']['OfferCreate']
export type OfferStatusUpdate = components['schemas']['OfferStatusUpdate']
export type PriceHistory = components['schemas']['PriceHistory']

/**
 * Query-Parameter für /offers Endpoint
 * Automatisch extrahiert aus dem OpenAPI-Schema
 */
export type OfferListFilters = ApiQueryParams<'/offers', 'get'>

// ============================================================================
// API FUNCTIONS - Type-safe mit openapi-fetch
// ============================================================================

/**
 * Listet alle Offers mit optionalen Filtern
 * 
 * ✨ TypeScript weiß automatisch:
 * - Welche Filter-Parameter erlaubt sind
 * - Welcher Response-Type zurückkommt (Offer[])
 * - Welche Felder in Offer vorhanden sind
 * 
 * @example
 * ```ts
 * const offers = await listOffers({ status: 'new', min_margin: 20 })
 * // offers ist automatisch Offer[] - kein manuelles <Offer[]> nötig!
 * ```
 */
export async function listOffers(filters: OfferListFilters = {}) {
  return fetchOrThrow(
    apiClient.GET('/offers', {
      params: {
        query: filters,
      },
    })
  )
}

/**
 * Holt ein einzelnes Offer nach ID
 * 
 * ✨ TypeScript prüft automatisch:
 * - id muss eine Zahl sein (aus Schema)
 * - Response ist vom Type Offer (aus Schema)
 */
export async function getOffer(id: number) {
  return fetchOrThrow(
    apiClient.GET('/offers/{id}', {
      params: {
        path: { id },
      },
    })
  )
}

/**
 * Holt den Preisverlauf eines Offers
 */
export async function getOfferHistory(id: number) {
  return fetchOrThrow(
    apiClient.GET('/offers/{id}/history', {
      params: {
        path: { id },
      },
    })
  )
}

/**
 * Erstellt ein neues Offer
 * 
 * ✨ TypeScript validiert automatisch:
 * - Alle Required-Felder müssen vorhanden sein
 * - Feld-Typen müssen korrekt sein (string, number, etc.)
 * - Keine unbekannten Felder erlaubt
 */
export async function createOffer(payload: OfferCreate) {
  return fetchOrThrow(
    apiClient.POST('/offers', {
      body: payload,
    })
  )
}

/**
 * Aktualisiert den Status eines Offers
 * 
 * ✨ Wenn Backend das status-Feld ändert (z.B. enum), 
 *    schlägt TypeScript-Compilation fehl!
 */
export async function updateOfferStatus(id: number, payload: OfferStatusUpdate) {
  return fetchOrThrow(
    apiClient.PUT('/offers/{id}/status', {
      params: {
        path: { id },
      },
      body: payload,
    })
  )
}

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/*

## Vorher (offers.ts):

```typescript
export type Offer = {
  id: number
  title: string
  // ... manuell gepflegt
}

export function listOffers(filters: OfferListFilters = {}) {
  return apiClient.get<Offer[]>(`/offers${query}`)
  //                     ^^^^^^^ Manuelles Typing - kann falsch sein!
}
```

## Nachher (offers-typesafe.ts):

```typescript
export type Offer = components['schemas']['Offer']
// ✅ Kommt direkt aus Backend - immer synchron!

export async function listOffers(filters: OfferListFilters = {}) {
  return fetchOrThrow(
    apiClient.GET('/offers', { params: { query: filters } })
  )
  // ✅ Response-Type ist automatisch korrekt
  // ✅ Compiler prüft Endpoint-Existenz
  // ✅ Autocomplete für alle Parameter
}
```

## Beispiel: Backend-Änderung wird sofort erkannt

Backend ändert Offer-Model:
```python
# backend/app/models/offer.py
class Offer(BaseModel):
    status: Literal["new", "open", "closed"]  # "ignored" entfernt!
```

Dein Code:
```typescript
updateOfferStatus(1, { status: "ignored" })
// ❌ TypeScript-Error: "ignored" ist nicht erlaubt!
// ✅ Du siehst den Fehler VOR dem Deployment
```

*/

