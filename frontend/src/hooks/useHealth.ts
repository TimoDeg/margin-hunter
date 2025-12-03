import { useQuery } from '@tanstack/react-query'
import { getHealth, type HealthResponse } from '../api/system'

export function useHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: () => getHealth(),
    staleTime: 30_000,
  })
}


