import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getScraperStatus,
  startScraper,
  stopScraper,
  type ScraperStatusResponse,
} from '../api/system'

/**
 * Hook zum Abrufen des Scraper-Status
 * - StaleTime: 5 Sekunden (Status ändert sich häufig)
 * - Auto-Refetch: alle 10 Sekunden für Live-Updates
 * - Mehr Retries für kritische Status-Abfragen
 */
export function useScraperStatus() {
  return useQuery<ScraperStatusResponse, Error>({
    queryKey: ['scraper', 'status'],
    queryFn: () => getScraperStatus(),
    // Sehr kurze staleTime - Status ist hochvolatil
    staleTime: 5_000, // 5 Sekunden
    // Auto-Refetch für Live-Status
    refetchInterval: 10_000, // 10 Sekunden
    // Mehr Retries für kritische Abfragen
    retry: 3,
    // Immer refetch bei Mount für aktuellen Status
    refetchOnMount: 'always',
  })
}

/**
 * Mutation zum Starten des Scrapers
 * - Optimistic Update: Status sofort auf "running"
 * - Aggressives Refetching nach Start
 */
export function useStartScraper() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => startScraper(),
    
    // Optimistic Update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['scraper', 'status'] })
      const previousStatus = queryClient.getQueryData(['scraper', 'status'])
      
      queryClient.setQueryData<ScraperStatusResponse>(
        ['scraper', 'status'],
        (old) => {
          if (!old) return old
          return { ...old, is_running: true }
        }
      )
      
      return { previousStatus }
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['scraper', 'status'], context.previousStatus)
      }
    },
    
    onSuccess: () => {
      // Sofort refetch für aktuellen Status
      void queryClient.invalidateQueries({ queryKey: ['scraper', 'status'] })
      // Offers werden sich bald ändern - prefetch vorbereiten
      void queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

/**
 * Mutation zum Stoppen des Scrapers
 * - Optimistic Update: Status sofort auf "stopped"
 */
export function useStopScraper() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => stopScraper(),
    
    // Optimistic Update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['scraper', 'status'] })
      const previousStatus = queryClient.getQueryData(['scraper', 'status'])
      
      queryClient.setQueryData<ScraperStatusResponse>(
        ['scraper', 'status'],
        (old) => {
          if (!old) return old
          return { ...old, is_running: false }
        }
      )
      
      return { previousStatus }
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['scraper', 'status'], context.previousStatus)
      }
    },
    
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['scraper', 'status'] })
    },
  })
}
