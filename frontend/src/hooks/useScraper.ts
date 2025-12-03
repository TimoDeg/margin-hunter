import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getScraperStatus,
  startScraper,
  stopScraper,
  type ScraperStatusResponse,
} from '../api/system'

export function useScraperStatus() {
  return useQuery<ScraperStatusResponse, Error>({
    queryKey: ['scraper', 'status'],
    queryFn: () => getScraperStatus(),
    refetchInterval: 10_000,
  })
}

export function useStartScraper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => startScraper(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['scraper', 'status'] })
    },
  })
}

export function useStopScraper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => stopScraper(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['scraper', 'status'] })
    },
  })
}


