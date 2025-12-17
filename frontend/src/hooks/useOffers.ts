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
} from '../api/offers'

/**
 * Hook zum Abrufen der Offers-Liste mit Filtern
 * - StaleTime: 2 Minuten (Offers ändern sich häufig)
 * - Auto-Refetch: alle 30 Sekunden
 * - Sortierung nach Margin im Cache
 */
export function useOffers(filters: OfferListFilters) {
  return useQuery<Offer[], Error>({
    queryKey: ['offers', filters],
    queryFn: () => listOffers(filters),
    // Offers sind volatil - kürzere staleTime
    staleTime: 2 * 60 * 1000, // 2 Minuten
    // Auto-Refetch für Live-Updates
    refetchInterval: 30_000, // 30 Sekunden
    // Optional: Sortierung im Cache statt in Komponente
    select: (data) => {
      return [...data].sort((a, b) => (b.margin_percent ?? 0) - (a.margin_percent ?? 0))
    },
  })
}

/**
 * Hook zum Abrufen eines einzelnen Offers
 * - Prefetch-freundlich durch enabled-Option
 */
export function useOffer(id: number | null) {
  return useQuery<Offer, Error>({
    queryKey: ['offers', id],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOffer(id)
    },
    enabled: id != null,
    staleTime: 3 * 60 * 1000, // 3 Minuten - Details ändern sich seltener
  })
}

/**
 * Hook zum Abrufen des Preisverlaufs eines Offers
 */
export function useOfferHistory(id: number | null) {
  return useQuery<PriceHistory[], Error>({
    queryKey: ['offers', id, 'history'],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOfferHistory(id)
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000, // 5 Minuten - History ist relativ stabil
  })
}

/**
 * Mutation zum Aktualisieren des Offer-Status
 * - Mit Optimistic Updates für sofortige UI-Reaktion
 * - Automatischer Rollback bei Fehlern
 */
export function useUpdateOfferStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    { id: number; payload: OfferStatusUpdate },
    { previousOffers: unknown }
  >({
    mutationFn: ({ id, payload }) => updateOfferStatus(id, payload),
    
    // OPTIMISTIC UPDATE: Sofortige UI-Aktualisierung
    onMutate: async ({ id, payload }) => {
      // 1. Cancel laufende Queries um Race Conditions zu vermeiden
      await queryClient.cancelQueries({ queryKey: ['offers'] })
      
      // 2. Snapshot des aktuellen Zustands für Rollback
      const previousOffers = queryClient.getQueryData(['offers'])
      
      // 3. Optimistic Update aller Offers-Queries
      queryClient.setQueriesData<Offer[]>(
        { queryKey: ['offers'] },
        (old) => {
          if (!old) return old
          return old.map((offer) =>
            offer.id === id ? { ...offer, status: payload.status } : offer
          )
        }
      )
      
      // 4. Auch die Einzelansicht aktualisieren
      queryClient.setQueryData<Offer>(
        ['offers', id],
        (old) => {
          if (!old) return old
          return { ...old, status: payload.status }
        }
      )
      
      // 5. Context mit Rollback-Daten zurückgeben
      return { previousOffers }
    },
    
    // Bei Fehler: Rollback zum vorherigen Zustand
    onError: (err, _variables, context) => {
      console.error('❌ Status update failed:', err)
      if (context?.previousOffers) {
        queryClient.setQueryData(['offers'], context.previousOffers)
      }
    },
    
    // Bei Erfolg: Refetch für Server-Truth
    onSettled: () => {
      // Invalidate statt direktem Refetch für bessere Performance
      void queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}
