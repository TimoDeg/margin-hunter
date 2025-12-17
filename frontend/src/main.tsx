import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Optimierter QueryClient mit globalen Defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Daten gelten 5 Minuten als "fresh" (kein Refetch)
      staleTime: 5 * 60 * 1000,
      // Cache wird nach 10 Minuten Inaktivität gelöscht
      gcTime: 10 * 60 * 1000,
      // 2 automatische Wiederholungen bei Fehlern
      retry: 2,
      // Exponential Backoff für Retries (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch wenn User zum Tab zurückkehrt
      refetchOnWindowFocus: true,
      // Refetch nach Internet-Wiederverbindung
      refetchOnReconnect: true,
      // Kein Refetch beim Component-Mount wenn Daten fresh sind
      refetchOnMount: true,
    },
    mutations: {
      // 1 Wiederholung bei Mutation-Fehlern
      retry: 1,
      // Globaler Error Handler für alle Mutations
      onError: (error) => {
        console.error('❌ Mutation failed:', error)
        // Hier kannst du später Toast-Notifications hinzufügen
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools nur in Development sichtbar */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  </StrictMode>,
)
