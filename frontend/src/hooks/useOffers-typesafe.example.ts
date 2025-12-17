/**
 * Beispiel: useOffers Hook mit type-safe API
 * 
 * Dies ist ein Beispiel, wie du deinen existierenden useOffers Hook
 * auf die type-safe API umstellen kannst.
 * 
 * Um zu aktivieren:
 * 1. Generiere Schema: npm run openapi:generate
 * 2. Benenne diese Datei um oder ersetze hooks/useOffers.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOffer,
  getOfferHistory,
  listOffers,
  type Offer,
  type OfferListFilters,
  type OfferStatusUpdate,
  type PriceHistory,
  updateOfferStatus,
} from '../api/offers-typesafe'  // ← Type-safe imports!

/**
 * Hook zum Abrufen der Offers-Liste mit Filtern
 * 
 * ✨ Keine Änderungen nötig - nur Import geändert!
 */
export function useOffers(filters: OfferListFilters) {
  return useQuery<Offer[], Error>({
    queryKey: ['offers', filters],
    queryFn: () => listOffers(filters),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30_000,
    select: (data) => {
      return [...data].sort((a, b) => (b.margin_percent ?? 0) - (a.margin_percent ?? 0))
    },
  })
}

/**
 * Hook zum Abrufen eines einzelnen Offers
 * 
 * ✨ Offer-Type ist jetzt automatisch synchron mit Backend!
 */
export function useOffer(id: number | null) {
  return useQuery<Offer, Error>({
    queryKey: ['offers', id],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOffer(id)
    },
    enabled: id != null,
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook zum Abrufen des Preisverlaufs
 * 
 * ✨ PriceHistory-Type ist automatisch korrekt!
 */
export function useOfferHistory(id: number | null) {
  return useQuery<PriceHistory[], Error>({
    queryKey: ['offers', id, 'history'],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOfferHistory(id)
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Mutation zum Aktualisieren des Offer-Status
 * 
 * ✨ Wenn Backend status-Enum ändert, zeigt TypeScript Error!
 */
export function useUpdateOfferStatus() {
  const queryClient = useQueryClient()

  return useMutation<Offer, Error, { id: number; payload: OfferStatusUpdate }>({
    mutationFn: ({ id, payload }) => updateOfferStatus(id, payload),
    
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['offers'] })
      const previousOffers = queryClient.getQueryData(['offers'])
      
      queryClient.setQueriesData<Offer[]>(
        { queryKey: ['offers'] },
        (old) => {
          if (!old) return old
          return old.map((offer) =>
            offer.id === id ? { ...offer, status: payload.status } : offer
          )
        }
      )
      
      queryClient.setQueryData<Offer>(
        ['offers', id],
        (old) => {
          if (!old) return old
          return { ...old, status: payload.status }
        }
      )
      
      return { previousOffers }
    },
    
    onError: (err, _variables, context) => {
      console.error('❌ Status update failed:', err)
      if (context?.previousOffers) {
        queryClient.setQueryData(['offers'], context.previousOffers)
      }
    },
    
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

// ============================================================================
// MIGRATION CHECKLIST
// ============================================================================

/*

✅ Was hat sich geändert?
  - Import von './api/offers' → './api/offers-typesafe'
  - Typen kommen jetzt aus Backend-Schema
  - API-Funktionen sind type-safe

✅ Was bleibt gleich?
  - Hook-Signaturen
  - React Query Logik
  - Optimistic Updates
  - Komponenten-Code (müssen nicht geändert werden!)

✅ Testing:
  1. npm run openapi:generate
  2. npm run typecheck  # Sollte keine Fehler zeigen
  3. npm run dev        # App testen

✅ Rollback (falls nötig):
  - Ändere Import zurück zu './api/offers'
  - Alte Implementierung bleibt erhalten!

*/

