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

/**
 * Hook zum Abrufen aller Produkte
 * - StaleTime: 10 Minuten (Produkte ändern sich selten)
 * - Sortierung nach Name
 */
export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: () => listProducts(),
    // Produkte sind relativ stabil - längere staleTime
    staleTime: 10 * 60 * 1000, // 10 Minuten
    // Optional: Sortierung im Cache
    select: (data) => {
      return [...data].sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}

/**
 * Mutation zum Erstellen eines neuen Produkts
 * - Optimistic Update: Neues Produkt sofort in Liste
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation<Product, Error, ProductCreate>({
    mutationFn: (payload) => createProduct(payload),
    
    // Optimistic Update
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: ['products'] })
      const previousProducts = queryClient.getQueryData(['products'])
      
      // Temporäres Produkt mit negativer ID (wird vom Server ersetzt)
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return old
        return [...old, { ...newProduct, id: -Date.now() } as Product]
      })
      
      return { previousProducts }
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
    },
    
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Mutation zum Aktualisieren eines Produkts
 * - Optimistic Update für sofortige UI-Reaktion
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation<Product, Error, { id: number; payload: ProductUpdate }>({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] })
      const previousProducts = queryClient.getQueryData(['products'])
      
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return old
        return old.map((product) =>
          product.id === id ? { ...product, ...payload } : product
        )
      })
      
      return { previousProducts }
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
    },
    
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Mutation zum Löschen eines Produkts
 * - Optimistic Update: Sofortiges Entfernen aus UI
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => deleteProduct(id),
    
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] })
      const previousProducts = queryClient.getQueryData(['products'])
      
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return old
        return old.filter((product) => product.id !== id)
      })
      
      return { previousProducts }
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts)
      }
    },
    
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
