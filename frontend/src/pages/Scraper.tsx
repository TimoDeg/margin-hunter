import {
  useScraperStatus,
  useStartScraper,
  useStopScraper,
} from '../hooks/useScraper'

export function ScraperPage() {
  const { data, isLoading, error } = useScraperStatus()
  const startMutation = useStartScraper()
  const stopMutation = useStopScraper()

  return (
    <section>
      <h2>Scraper</h2>
      <p>Steuere den Hintergrund-Scraper über die API-Endpunkte.</p>

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          {startMutation.isPending ? 'Starte...' : 'Starten'}
        </button>
        <button
          type="button"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => stopMutation.mutate()}
          disabled={stopMutation.isPending}
        >
          {stopMutation.isPending ? 'Stoppe...' : 'Stoppen'}
        </button>
      </div>

      {isLoading && <p>Lade Scraper-Status...</p>}
      {error && (
        <p style={{ color: 'salmon' }}>
          Fehler beim Laden des Scraper-Status: {error.message}
        </p>
      )}

      {data && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #1f2937',
            maxWidth: '20rem',
          }}
        >
          <p>
            <strong>Status:</strong> {data.status}
          </p>
          {data.last_run_at && (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              <strong>Letzter Lauf:</strong>{' '}
              {new Date(data.last_run_at).toLocaleString('de-DE')}
            </p>
          )}
          {data.last_error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem' }}>
              <strong>Fehler:</strong> {data.last_error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}



