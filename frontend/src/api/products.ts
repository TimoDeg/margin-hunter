import { apiClient } from './client'

export type Product = {
  id: number
  name: string
  category: string
  brands: string[]
  filters: Record<string, unknown>
  price_min: number
  price_max: number
  active: boolean
  created_at: string
  updated_at: string
}

export type ProductCreate = Omit<Product, 'id' | 'created_at' | 'updated_at'>

export type ProductUpdate = Partial<ProductCreate>

export function listProducts() {
  return apiClient.get<Product[]>('/products')
}

export function createProduct(payload: ProductCreate) {
  return apiClient.post<Product>('/products', payload)
}

export function updateProduct(id: number, payload: ProductUpdate) {
  return apiClient.put<Product>(`/products/${id}`, payload)
}

export function deleteProduct(id: number) {
  return apiClient.delete<void>(`/products/${id}`)
}


