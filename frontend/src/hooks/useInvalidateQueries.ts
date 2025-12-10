import { useQueryClient } from '@tanstack/react-query'

/**
 * Custom Hook für manuelle Cache-Invalidierung und Refetching
 * 
 * Verwendung:
 * ```tsx
 * const { invalidateOffers, refetchAll } = useInvalidateQueries()
 * 
 * // Cache invalidieren (refetch beim nächsten Zugriff)
 * invalidateOffers()
 * 
 * // Sofortiges Refetch erzwingen
 * await refetchOffers()
 * ```
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    // === OFFERS ===
    
    /**
     * Invalidiert alle Offers-Queries (Liste, Details, History)
     * Nächster Zugriff triggert automatisch Refetch
     */
    invalidateOffers: () => {
      return queryClient.invalidateQueries({ queryKey: ['offers'] })
    },

    /**
     * Invalidiert nur die Offers-Liste (nicht Details/History)
     */
    invalidateOffersList: () => {
      return queryClient.invalidateQueries({ 
        queryKey: ['offers'],
        exact: false,
        predicate: (query) => {
          // Nur Queries mit 2 Elementen im Key (keine Details)
          return query.queryKey.length === 2
        },
      })
    },

    /**
     * Erzwingt sofortiges Refetch aller Offers (auch wenn fresh)
     */
    refetchOffers: () => {
      return queryClient.refetchQueries({ queryKey: ['offers'] })
    },

    // === PRODUCTS ===
    
    /**
     * Invalidiert alle Products-Queries
     */
    invalidateProducts: () => {
      return queryClient.invalidateQueries({ queryKey: ['products'] })
    },

    /**
     * Erzwingt sofortiges Refetch aller Products
     */
    refetchProducts: () => {
      return queryClient.refetchQueries({ queryKey: ['products'] })
    },

    // === SCRAPER ===
    
    /**
     * Invalidiert Scraper-Status
     */
    invalidateScraperStatus: () => {
      return queryClient.invalidateQueries({ queryKey: ['scraper', 'status'] })
    },

    /**
     * Erzwingt sofortiges Refetch des Scraper-Status
     */
    refetchScraperStatus: () => {
      return queryClient.refetchQueries({ queryKey: ['scraper', 'status'] })
    },

    // === GLOBAL ===
    
    /**
     * Invalidiert ALLE Queries in der App
     * ⚠️ Vorsichtig verwenden - kann Performance beeinträchtigen
     */
    invalidateAll: () => {
      return queryClient.invalidateQueries()
    },

    /**
     * Refetcht ALLE aktiven Queries
     * ⚠️ Nur in Ausnahmefällen verwenden (z.B. nach Re-Login)
     */
    refetchAll: () => {
      return queryClient.refetchQueries()
    },

    /**
     * Löscht den gesamten Query-Cache
     * ⚠️ Sehr destruktiv - nur bei kritischen Fehlern verwenden
     */
    clearCache: () => {
      queryClient.clear()
    },

    // === ADVANCED ===
    
    /**
     * Prefetch für bessere UX - lädt Daten im Hintergrund
     * Beispiel: Beim Hover über ein Offer die Details vorladen
     */
    prefetchOffer: async (id: number) => {
      await queryClient.prefetchQuery({
        queryKey: ['offers', id],
        queryFn: async () => {
          // Hier würdest du die API-Funktion importieren
          const { getOffer } = await import('../api/offers')
          return getOffer(id)
        },
        staleTime: 3 * 60 * 1000,
      })
    },

    /**
     * Manuelles Setzen von Query-Daten (ohne API-Call)
     * Nützlich für Optimistic Updates oder nach Websocket-Updates
     */
    setOfferData: (id: number, data: unknown) => {
      queryClient.setQueryData(['offers', id], data)
    },

    /**
     * Query-Daten abrufen aus dem Cache (ohne Refetch)
     */
    getOfferData: (id: number) => {
      return queryClient.getQueryData(['offers', id])
    },
  }
}

