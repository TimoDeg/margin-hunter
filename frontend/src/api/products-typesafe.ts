/**
 * Type-safe Products API mit automatisch generierten OpenAPI-Typen
 * 
 * ⚠️ WICHTIG: Vor der Verwendung muss das Schema generiert werden:
 * ```bash
 * npm run openapi:generate
 * ```
 */

import { apiClient, fetchOrThrow } from './client-typesafe'
import type { components } from './generated/schema'

// ============================================================================
// TYPES - Automatisch aus Backend-Schema generiert
// ============================================================================

export type Product = components['schemas']['Product']
export type ProductCreate = components['schemas']['ProductCreate']
export type ProductUpdate = components['schemas']['ProductUpdate']

// ============================================================================
// API FUNCTIONS - Type-safe mit openapi-fetch
// ============================================================================

/**
 * Listet alle Produkte
 * 
 * ✨ TypeScript weiß automatisch, dass Response Product[] ist
 */
export async function listProducts() {
  return fetchOrThrow(apiClient.GET('/products'))
}

/**
 * Holt ein einzelnes Produkt nach ID
 */
export async function getProduct(id: number) {
  return fetchOrThrow(
    apiClient.GET('/products/{id}', {
      params: {
        path: { id },
      },
    })
  )
}

/**
 * Erstellt ein neues Produkt
 * 
 * ✨ TypeScript validiert automatisch:
 * - name, category, brands müssen vorhanden sein
 * - brands muss string[] sein (nicht string!)
 * - filters muss Record<string, unknown> sein
 */
export async function createProduct(payload: ProductCreate) {
  return fetchOrThrow(
    apiClient.POST('/products', {
      body: payload,
    })
  )
}

/**
 * Aktualisiert ein Produkt
 * 
 * ✨ Partial<ProductCreate> wird automatisch validiert
 */
export async function updateProduct(id: number, payload: ProductUpdate) {
  return fetchOrThrow(
    apiClient.PUT('/products/{id}', {
      params: {
        path: { id },
      },
      body: payload,
    })
  )
}

/**
 * Löscht ein Produkt
 */
export async function deleteProduct(id: number) {
  return fetchOrThrow(
    apiClient.DELETE('/products/{id}', {
      params: {
        path: { id },
      },
    })
  )
}

// ============================================================================
// BEISPIEL: Backend-Änderung wird sofort erkannt
// ============================================================================

/*

## Szenario: Backend ändert Product-Model

Backend:
```python
class Product(BaseModel):
    brands: str  # Geändert von list[str] zu str!
```

Dein Code:
```typescript
createProduct({
  name: "iPhone",
  category: "Smartphones",
  brands: ["Apple", "Samsung"],  // ❌ TypeScript-Error!
  //      ^^^^^^^^^^^^^^^^^^^^
  //      Type 'string[]' is not assignable to type 'string'
})
```

✅ Du siehst den Fehler SOFORT beim Compile
✅ Keine Runtime-Fehler mehr!
✅ Keine "undefined is not a function" mehr!

*/

