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

export function useOffers(filters: OfferListFilters) {
  return useQuery<Offer[], Error>({
    queryKey: ['offers', filters],
    queryFn: () => listOffers(filters),
  })
}

export function useOffer(id: number | null) {
  return useQuery<Offer, Error>({
    queryKey: ['offers', id],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOffer(id)
    },
    enabled: id != null,
  })
}

export function useOfferHistory(id: number | null) {
  return useQuery<PriceHistory[], Error>({
    queryKey: ['offers', id, 'history'],
    queryFn: () => {
      if (id == null) throw new Error('id is required')
      return getOfferHistory(id)
    },
    enabled: id != null,
  })
}

export function useUpdateOfferStatus() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, { id: number; payload: OfferStatusUpdate }>({
    mutationFn: ({ id, payload }) => updateOfferStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}


