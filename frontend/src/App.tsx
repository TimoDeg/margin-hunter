import './App.css'
import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  database?: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true)
        setError(null)

        // Nutze explizit den funktionierenden Health-Endpoint über nginx.
        // Absolute URL, um Verwechslungen mit Dev-Server/Proxy zu vermeiden.
        const urls = ['http://localhost/health']

        let lastError: unknown = null
        for (const url of urls) {
          try {
            const res = await fetch(url)
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`)
            }
            const data = (await res.json()) as HealthResponse
            setHealth(data)
            return
          } catch (err) {
            lastError = err
          }
        }

        throw lastError ?? new Error('Unknown error')
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden',
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchHealth()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Margin Hunter</h1>
        <p>Backend Health Check</p>
      </header>

      <main>
        {loading && <p>Lade Health-Status...</p>}
        {error && (
          <p style={{ color: 'red' }}>
            Fehler beim Laden des Health-Status: {error}
          </p>
        )}
        {health && (
          <div className="card">
            <p>
              <strong>Status:</strong> {health.status}
            </p>
            {health.database && (
              <p>
                <strong>Datenbank:</strong> {health.database}
              </p>
            )}
          </div>
        )}
        {!loading && !error && !health && (
          <p>Keine Health-Daten verfügbar. Läuft das Backend?</p>
        )}
      </main>
    </div>
  )
}

export default App
