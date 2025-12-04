import { useHealth } from '../hooks/useHealth'

export function DashboardPage() {
  const { data, isLoading, error } = useHealth()

  return (
    <section>
      <h2>Dashboard</h2>
      <p>Systemstatus deines Margin Hunter Backends.</p>

      <div style={{ marginTop: '1rem' }}>
        {isLoading && <p>Lade Health-Status...</p>}
        {error && (
          <p style={{ color: 'salmon' }}>
            Fehler beim Laden des Health-Status: {error.message}
          </p>
        )}
        {data && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#020617',
              border: '1px solid #1f2937',
              maxWidth: '20rem',
            }}
          >
            <p>
              <strong>Status:</strong> {data.status}
            </p>
            {data.timestamp && (
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                {new Date(data.timestamp).toLocaleString('de-DE')}
              </p>
            )}
            {data.services?.database && (
              <p>
                <strong>Datenbank:</strong> {data.services.database}
              </p>
            )}
            {data.services?.redis && (
              <p>
                <strong>Redis:</strong> {data.services.redis}
              </p>
            )}
            {data.services?.celery && (
              <p>
                <strong>Celery:</strong> {data.services.celery}
              </p>
            )}
          </div>
        )}
        {!isLoading && !error && !data && (
          <p>Keine Health-Daten verfügbar. Läuft das Backend?</p>
        )}
      </div>
    </section>
  )
}



