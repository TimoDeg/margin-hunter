import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  deleteProduct,
  listProducts,
  type Product,
  type ProductCreate,
  type ProductUpdate,
  updateProduct,
} from '../api/products'

export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: () => listProducts(),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation<Product, Error, ProductCreate>({
    mutationFn: (payload) => createProduct(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation<Product, Error, { id: number; payload: ProductUpdate }>({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}


