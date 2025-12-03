import { useState } from 'react'
import { useOffer, useOfferHistory, useOffers, useUpdateOfferStatus } from '../hooks/useOffers'
import type { OfferListFilters } from '../api/offers'

export function OffersPage() {
  const [filters, setFilters] = useState<OfferListFilters>({})
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  const { data, isLoading, error } = useOffers(filters)
  const updateStatus = useUpdateOfferStatus()
  const offerDetail = useOffer(selectedOfferId)
  const offerHistory = useOfferHistory(selectedOfferId)

  return (
    <section>
      <h2>Offers</h2>
      <p>Liste aller gefundenen Angebote mit Filter- und Status-Funktionen.</p>

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label>
          Status:&nbsp;
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="ignored">Ignored</option>
            <option value="contacted">Contacted</option>
          </select>
        </label>
        <label style={{ marginLeft: '1rem' }}>
          Min. Margin (%):&nbsp;
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
            style={{ width: '6rem' }}
          />
        </label>
      </div>

      {isLoading && <p>Lade Offers...</p>}
      {error && (
        <p style={{ color: 'salmon' }}>
          Fehler beim Laden der Offers: {error.message}
        </p>
      )}

      {data && data.length === 0 && <p>Keine Offers gefunden.</p>}

      {data && data.length > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              minWidth: '60%',
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>Titel</th>
                <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>Preis</th>
                <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>Margin %</th>
                <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>Status</th>
                <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {data.map((offer) => (
                <tr
                  key={offer.id}
                  onClick={() => setSelectedOfferId(offer.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor:
                      offer.id === selectedOfferId ? '#111827' : 'transparent',
                  }}
                >
                  <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem', textAlign: 'left' }}>
                    {offer.title}
                  </td>
                  <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                    {offer.price.toFixed(2)} €
                  </td>
                  <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                    {offer.margin_percent != null
                      ? `${offer.margin_percent.toFixed(1)} %`
                      : '-'}
                  </td>
                  <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                    <select
                      value={offer.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: offer.id,
                          payload: { status: e.target.value },
                        })
                      }
                    >
                      <option value="new">new</option>
                      <option value="open">open</option>
                      <option value="ignored">ignored</option>
                      <option value="contacted">contacted</option>
                    </select>
                  </td>
                  <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                    <a href={offer.url} target="_blank" rel="noreferrer">
                      Öffnen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <aside style={{ flex: 1 }}>
            <h3>Details</h3>
            {!selectedOfferId && <p>Wähle ein Offer aus der Tabelle aus.</p>}
            {offerDetail.isLoading && <p>Lade Details...</p>}
            {offerDetail.error && (
              <p style={{ color: 'salmon' }}>
                Fehler beim Laden der Details:{' '}
                {offerDetail.error.message}
              </p>
            )}
            {offerDetail.data && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #1f2937',
                }}
              >
                <p>
                  <strong>Title:</strong> {offerDetail.data.title}
                </p>
                <p>
                  <strong>Location:</strong> {offerDetail.data.location ?? '-'}
                </p>
                <p>
                  <strong>Seller:</strong> {offerDetail.data.seller_name ?? '-'}
                </p>
                <p>
                  <strong>Beschreibung:</strong>{' '}
                  {offerDetail.data.description ?? '-'}
                </p>
              </div>
            )}

            <h3 style={{ marginTop: '1rem' }}>Preisverlauf</h3>
            {offerHistory.isLoading && <p>Lade Preisverlauf...</p>}
            {offerHistory.error && (
              <p style={{ color: 'salmon' }}>
                Fehler beim Laden des Preisverlaufs:{' '}
                {offerHistory.error.message}
              </p>
            )}
            {offerHistory.data && offerHistory.data.length === 0 && (
              <p>Kein Preisverlauf verfügbar.</p>
            )}
            {offerHistory.data && offerHistory.data.length > 0 && (
              <ul>
                {offerHistory.data.map((entry) => (
                  <li key={entry.id}>
                    {new Date(entry.recorded_at).toLocaleString()} –{' '}
                    {entry.price.toFixed(2)} €
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}



