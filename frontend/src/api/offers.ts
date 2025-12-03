import { apiClient } from './client'

export type Offer = {
  id: number
  product_id: number
  title: string
  price: number
  url: string
  image_url?: string | null
  seller_name?: string | null
  location?: string | null
  description?: string | null
  status: string
  margin_percent?: number | null
  geizhals_price?: number | null
  first_seen_at: string
  last_checked_at: string
}

export type OfferCreate = Omit<
  Offer,
  'id' | 'first_seen_at' | 'last_checked_at'
>

export type OfferStatusUpdate = {
  status: string
}

export type PriceHistory = {
  id: number
  offer_id: number
  price: number
  recorded_at: string
}

export type OfferListFilters = {
  status?: string
  product_id?: number
  min_margin?: number
}

function buildQuery(filters: OfferListFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (typeof filters.product_id === 'number') {
    params.set('product_id', String(filters.product_id))
  }
  if (typeof filters.min_margin === 'number') {
    params.set('min_margin', String(filters.min_margin))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function listOffers(filters: OfferListFilters = {}) {
  const query = buildQuery(filters)
  return apiClient.get<Offer[]>(`/offers${query}`)
}

export function getOffer(id: number) {
  return apiClient.get<Offer>(`/offers/${id}`)
}

export function getOfferHistory(id: number) {
  return apiClient.get<PriceHistory[]>(`/offers/${id}/history`)
}

export function createOffer(payload: OfferCreate) {
  return apiClient.post<Offer>('/offers', payload)
}

export function updateOfferStatus(id: number, payload: OfferStatusUpdate) {
  return apiClient.put<Offer>(`/offers/${id}/status`, payload)
}


