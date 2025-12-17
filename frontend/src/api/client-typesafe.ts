/**
 * Type-safe API Client mit automatisch generierten OpenAPI-Typen
 * 
 * Vorteile gegenüber manuellem apiClient:
 * - ✅ Automatische TypeScript-Typen aus Backend-Schema
 * - ✅ Compile-Time Fehler bei API-Änderungen
 * - ✅ Autocomplete für alle Endpoints und Parameter
 * - ✅ Type-safe Request/Response Bodies
 * - ✅ Type-safe Query-Parameter
 * 
 * @example
 * ```ts
 * // TypeScript kennt automatisch alle verfügbaren Endpoints
 * const { data, error } = await apiClient.GET('/offers')
 * // data ist automatisch Offer[] - kein manuelles Typing nötig!
 * ```
 */

import createClient from 'openapi-fetch'
import type { paths } from './generated/schema'

// Type-safe Client mit allen Backend-Endpoints
export const apiClient = createClient<paths>({ 
  baseUrl: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Helper-Type: Extrahiert Response-Type eines Endpoints
 * 
 * @example
 * ```ts
 * type OfferList = ApiResponse<'/offers', 'get'> // Offer[]
 * type SingleOffer = ApiResponse<'/offers/{id}', 'get'> // Offer
 * ```
 */
export type ApiResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path]
> = paths[Path][Method] extends { responses: { 200: { content: { 'application/json': infer R } } } }
  ? R
  : never

/**
 * Helper-Type: Extrahiert Request-Body-Type eines Endpoints
 * 
 * @example
 * ```ts
 * type CreateOfferBody = ApiRequestBody<'/offers', 'post'> // OfferCreate
 * ```
 */
export type ApiRequestBody<
  Path extends keyof paths,
  Method extends keyof paths[Path]
> = paths[Path][Method] extends { requestBody?: { content: { 'application/json': infer R } } }
  ? R
  : never

/**
 * Helper-Type: Extrahiert Query-Parameter-Type eines Endpoints
 * 
 * @example
 * ```ts
 * type OfferFilters = ApiQueryParams<'/offers', 'get'> // { status?: string, ... }
 * ```
 */
export type ApiQueryParams<
  Path extends keyof paths,
  Method extends keyof paths[Path]
> = paths[Path][Method] extends { parameters?: { query?: infer Q } }
  ? Q
  : never

/**
 * Erweiterte Error-Klasse für API-Fehler
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Wrapper-Funktion mit besserer Error-Behandlung
 * 
 * openapi-fetch wirft keine Exceptions - stattdessen gibt es { data, error } zurück.
 * Diese Funktion wirft bei Fehlern eine Exception (für bessere Integration mit React Query).
 */
export async function fetchOrThrow<T>(
  promise: Promise<{ data?: T; error?: { status: number; [key: string]: unknown } }>
): Promise<T> {
  const { data, error } = await promise
  
  if (error) {
    const detail = 'detail' in error ? error.detail : error
    throw new ApiError(
      typeof detail === 'string' ? detail : JSON.stringify(detail),
      error.status,
      detail
    )
  }
  
  if (data === undefined) {
    throw new ApiError('No data returned from API', 500)
  }
  
  return data
}

/**
 * Convenience-Export: Schema-Komponenten (Models)
 * 
 * @example
 * ```ts
 * import type { Offer, Product } from './client-typesafe'
 * ```
 */
export type { components } from './generated/schema'

