/**
 * Beispiel-Komponente für optimierte React Query Verwendung
 * 
 * Zeigt Best Practices für:
 * - Optimistic Updates
 * - Manuelle Cache-Invalidierung
 * - Loading/Error States
 * - Prefetching
 */

import { useState } from 'react'
import { useOffer, useOfferHistory, useOffers, useUpdateOfferStatus } from '../hooks/useOffers'
import { useInvalidateQueries } from '../hooks/useInvalidateQueries'
import type { OfferListFilters } from '../api/offers'

export function OptimizedOffersExample() {
  const [filters, setFilters] = useState<OfferListFilters>({})
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  
  // === QUERIES ===
  const { data, isLoading, error, isFetching } = useOffers(filters)
  const offerDetail = useOffer(selectedOfferId)
  const offerHistory = useOfferHistory(selectedOfferId)
  
  // === MUTATIONS ===
  const updateStatus = useUpdateOfferStatus()
  
  // === MANUAL CACHE CONTROL ===
  const { 
    invalidateOffers, 
    refetchOffers, 
    prefetchOffer,
    invalidateProducts 
  } = useInvalidateQueries()

  // Handler für Status-Update (mit Optimistic Update)
  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus.mutate(
      { id, payload: { status: newStatus } },
      {
        // Success Callback (optional - zusätzlich zu onSuccess im Hook)
        onSuccess: () => {
          console.log('✅ Status erfolgreich aktualisiert')
        },
        // Error Callback (wird nach automatischem Rollback ausgeführt)
        onError: (error) => {
          alert(`Fehler beim Status-Update: ${error.message}`)
        },
      }
    )
  }

  // Handler für manuelles Refetch
  const handleManualRefresh = async () => {
    // Erzwingt sofortiges Refetch (auch wenn Daten fresh sind)
    await refetchOffers()
    console.log('🔄 Offers manuell aktualisiert')
  }

  // Handler für Prefetch beim Hover (bessere UX)
  const handleOfferHover = (id: number) => {
    // Lädt Details im Hintergrund, bevor User klickt
    void prefetchOffer(id)
  }

  // Handler für "Alles löschen und neu laden"
  const handleHardReset = async () => {
    // Invalidiert alle Offers UND Products
    await Promise.all([
      invalidateOffers(),
      invalidateProducts(),
    ])
    console.log('🔄 Alle Daten invalidiert')
  }

  return (
    <section className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Optimized Offers Example</h2>
        
        {/* Manual Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {isFetching ? '🔄 Lädt...' : '🔄 Refresh'}
          </button>
          
          <button
            onClick={handleHardReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            🗑️ Hard Reset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <label>
          Status:
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value || undefined,
              }))
            }
            className="ml-2 px-3 py-2 bg-gray-800 rounded"
          >
            <option value="">Alle</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="ignored">Ignored</option>
            <option value="contacted">Contacted</option>
          </select>
        </label>
        
        <label>
          Min. Margin (%):
          <input
            type="number"
            value={filters.min_margin ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                min_margin: e.target.value
                  ? Number.parseFloat(e.target.value)
                  : undefined,
              }))
            }
            className="ml-2 px-3 py-2 bg-gray-800 rounded w-24"
          />
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-3 p-4 bg-blue-900/30 rounded">
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
          <p>Lade Offers... (Initial Load)</p>
        </div>
      )}

      {/* Background Fetching Indicator */}
      {!isLoading && isFetching && (
        <div className="mb-2 text-sm text-blue-400">
          🔄 Aktualisiere im Hintergrund...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded mb-4">
          <p className="text-red-400">
            ❌ Fehler beim Laden: {error.message}
          </p>
          <button
            onClick={handleManualRefresh}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Empty State */}
      {data && data.length === 0 && (
        <p className="text-gray-400">Keine Offers gefunden.</p>
      )}

      {/* Data Display */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offers List */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Offers Liste</h3>
            <div className="space-y-2">
              {data.map((offer) => (
                <div
                  key={offer.id}
                  onMouseEnter={() => handleOfferHover(offer.id)}
                  onClick={() => setSelectedOfferId(offer.id)}
                  className={`
                    p-4 rounded border cursor-pointer transition-all
                    ${offer.id === selectedOfferId 
                      ? 'bg-blue-900/50 border-blue-500' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{offer.title}</h4>
                    <span className="text-lg font-bold text-green-400">
                      {offer.price.toFixed(2)} €
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Margin: {offer.margin_percent?.toFixed(1) ?? '-'}%
                    </span>
                    
                    {/* Status Dropdown mit Optimistic Update */}
                    <select
                      value={offer.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(offer.id, e.target.value)}
                      disabled={updateStatus.isPending}
                      className="px-2 py-1 bg-gray-700 rounded text-sm disabled:opacity-50"
                    >
                      <option value="new">new</option>
                      <option value="open">open</option>
                      <option value="ignored">ignored</option>
                      <option value="contacted">contacted</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Details</h3>
            
            {!selectedOfferId && (
              <p className="text-gray-400">Wähle ein Offer aus der Liste.</p>
            )}
            
            {offerDetail.isLoading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <p>Lade Details...</p>
              </div>
            )}
            
            {offerDetail.error && (
              <p className="text-red-400">
                Fehler: {offerDetail.error.message}
              </p>
            )}
            
            {offerDetail.data && (
              <div className="p-4 bg-gray-800 rounded space-y-3">
                <div>
                  <strong>Title:</strong> {offerDetail.data.title}
                </div>
                <div>
                  <strong>Location:</strong> {offerDetail.data.location ?? '-'}
                </div>
                <div>
                  <strong>Seller:</strong> {offerDetail.data.seller_name ?? '-'}
                </div>
                <div>
                  <strong>Beschreibung:</strong>{' '}
                  {offerDetail.data.description ?? '-'}
                </div>
                <a
                  href={offerDetail.data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  🔗 Offer öffnen
                </a>
              </div>
            )}

            {/* Price History */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Preisverlauf</h4>
              {offerHistory.isLoading && <p className="text-sm">Lädt...</p>}
              {offerHistory.error && (
                <p className="text-sm text-red-400">
                  Fehler: {offerHistory.error.message}
                </p>
              )}
              {offerHistory.data && offerHistory.data.length === 0 && (
                <p className="text-sm text-gray-400">Kein Verlauf verfügbar.</p>
              )}
              {offerHistory.data && offerHistory.data.length > 0 && (
                <ul className="space-y-1">
                  {offerHistory.data.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      {new Date(entry.recorded_at).toLocaleString()} –{' '}
                      <span className="font-medium">{entry.price.toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Info (Debug) */}
      <div className="mt-8 p-4 bg-gray-900 rounded text-xs font-mono">
        <div>Mutation Status: {updateStatus.isPending ? '⏳ Pending' : '✅ Idle'}</div>
        <div>Data Age: {isFetching ? 'Fetching...' : 'Fresh'}</div>
        <div>Selected Offer: {selectedOfferId ?? 'None'}</div>
      </div>
    </section>
  )
}

