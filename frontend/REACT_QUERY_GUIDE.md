# React Query Optimierung Guide 🚀

## Übersicht

Deine Margin Hunter App nutzt jetzt **TanStack Query v5** (React Query) mit vollständig optimierten Konfigurationen.

## ✅ Was wurde implementiert

### 1. **Optimierter QueryClient** (`main.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 Min - Daten gelten als "fresh"
      gcTime: 10 * 60 * 1000,          // 10 Min - Cache-Garbage-Collection
      retry: 2,                         // 2 automatische Wiederholungen
      retryDelay: exponential backoff,  // 1s, 2s, 4s...
      refetchOnWindowFocus: true,       // Refetch bei Tab-Wechsel
      refetchOnReconnect: true,         // Refetch nach Reconnect
    },
    mutations: {
      retry: 1,
      onError: (error) => console.error('Mutation failed:', error)
    }
  }
})
```

**Wichtig**: Diese Defaults gelten für ALLE Queries, außer sie werden überschrieben.

---

### 2. **React Query DevTools**

In Development automatisch verfügbar:
- Öffne deine App
- Klicke auf das React Query Icon (unten rechts)
- Sieh alle Queries, deren Status, Cache-Zeiten, etc.

**Shortcuts**:
- Queries inspizieren
- Cache manuell invalidieren
- Query-Performance analysieren

---

### 3. **Optimierte Hooks mit spezifischen Konfigurationen**

#### **useOffers** (volatil - ändert sich häufig)

```typescript
export function useOffers(filters: OfferListFilters) {
  return useQuery<Offer[], Error>({
    queryKey: ['offers', filters],
    queryFn: () => listOffers(filters),
    staleTime: 2 * 60 * 1000,    // 2 Min (kürzer als Default!)
    refetchInterval: 30_000,      // Auto-Refetch alle 30 Sek
    select: (data) => {
      // Sortierung im Cache (performanter!)
      return [...data].sort((a, b) => 
        (b.margin_percent ?? 0) - (a.margin_percent ?? 0)
      )
    },
  })
}
```

**Warum?**
- Offers ändern sich durch Scraper ständig
- Kürzere `staleTime` → häufiger refetch
- `refetchInterval` → Live-Updates ohne User-Interaktion

#### **useProducts** (stabil - ändert sich selten)

```typescript
export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: () => listProducts(),
    staleTime: 10 * 60 * 1000,   // 10 Min (länger als Default!)
    select: (data) => {
      return [...data].sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}
```

**Warum?**
- Produkte ändern sich selten
- Längere `staleTime` → weniger API-Calls
- Bessere Performance

#### **useScraperStatus** (kritisch - benötigt Live-Updates)

```typescript
export function useScraperStatus() {
  return useQuery<ScraperStatusResponse, Error>({
    queryKey: ['scraper', 'status'],
    queryFn: () => getScraperStatus(),
    staleTime: 5_000,              // 5 Sek (sehr kurz!)
    refetchInterval: 10_000,       // Alle 10 Sek
    retry: 3,                      // Mehr Retries (kritisch!)
    refetchOnMount: 'always',      // Immer refetch bei Mount
  })
}
```

**Warum?**
- Scraper-Status ist hochvolatil
- User braucht Live-Feedback
- Mehr Retries für Zuverlässigkeit

---

### 4. **Optimistic Updates** 🎯

Alle Mutations haben jetzt Optimistic Updates → **sofortige UI-Reaktion**!

#### Beispiel: `useUpdateOfferStatus`

```typescript
export function useUpdateOfferStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateOfferStatus(id, payload),
    
    // 1. OPTIMISTIC UPDATE (vor API-Call)
    onMutate: async ({ id, payload }) => {
      // Cancel laufende Queries (Race Condition vermeiden)
      await queryClient.cancelQueries({ queryKey: ['offers'] })
      
      // Snapshot für Rollback
      const previousOffers = queryClient.getQueryData(['offers'])
      
      // UI sofort aktualisieren
      queryClient.setQueriesData({ queryKey: ['offers'] }, (old) => {
        return old.map((offer) =>
          offer.id === id ? { ...offer, status: payload.status } : offer
        )
      })
      
      return { previousOffers }  // Für Rollback
    },
    
    // 2. ERROR HANDLING (bei Fehler)
    onError: (err, variables, context) => {
      // Automatischer Rollback!
      if (context?.previousOffers) {
        queryClient.setQueryData(['offers'], context.previousOffers)
      }
    },
    
    // 3. SERVER SYNC (bei Erfolg)
    onSettled: () => {
      // Server-Truth holen
      void queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}
```

**Ablauf**:
1. User klickt → UI updated sofort (Optimistic)
2. API-Call läuft im Hintergrund
3. Bei Erfolg: Server-Daten werden geholt
4. Bei Fehler: Automatischer Rollback zum alten Zustand

**UX-Vorteil**: Keine Verzögerung, fühlt sich instant an! ⚡

---

### 5. **Custom Hook: useInvalidateQueries** 🎮

Für **manuelle Cache-Kontrolle** in Komponenten.

```typescript
import { useInvalidateQueries } from '../hooks/useInvalidateQueries'

function MyComponent() {
  const {
    invalidateOffers,      // Cache invalidieren
    refetchOffers,         // Sofort refetch (auch wenn fresh)
    prefetchOffer,         // Im Hintergrund vorladen
    invalidateAll,         // ALLE Queries invalidieren
    clearCache,            // Kompletten Cache löschen
  } = useInvalidateQueries()
  
  // Beispiel: Manueller Refresh-Button
  const handleRefresh = async () => {
    await refetchOffers()  // Erzwingt Refetch
    console.log('✅ Offers aktualisiert')
  }
  
  // Beispiel: Prefetch beim Hover (bessere UX)
  const handleOfferHover = (id: number) => {
    void prefetchOffer(id)  // Lädt Details im Hintergrund
  }
  
  return (
    <>
      <button onClick={handleRefresh}>🔄 Refresh</button>
      {offers.map(offer => (
        <div 
          key={offer.id}
          onMouseEnter={() => handleOfferHover(offer.id)}
        >
          {offer.title}
        </div>
      ))}
    </>
  )
}
```

**Alle verfügbaren Funktionen**:

| Funktion | Beschreibung |
|----------|-------------|
| `invalidateOffers()` | Marks Offers als stale (refetch beim nächsten Zugriff) |
| `refetchOffers()` | Erzwingt sofortigen Refetch (auch wenn fresh) |
| `prefetchOffer(id)` | Lädt Offer-Details im Hintergrund vor |
| `invalidateProducts()` | Marks Products als stale |
| `invalidateScraperStatus()` | Marks Scraper-Status als stale |
| `invalidateAll()` | ⚠️ Invalidiert ALLE Queries (Performance-Impact!) |
| `clearCache()` | ⚠️ Löscht kompletten Cache (nur bei Fehler) |

---

## 📊 Konfigurations-Cheatsheet

| Query Type | staleTime | refetchInterval | retry | Begründung |
|-----------|-----------|-----------------|-------|------------|
| **Default** | 5 Min | - | 2 | Standard für meiste Daten |
| **Offers** | 2 Min | 30 Sek | 2 | Volatil, braucht Live-Updates |
| **Offer Detail** | 3 Min | - | 2 | Details ändern sich seltener |
| **Offer History** | 5 Min | - | 2 | History ist stabil |
| **Products** | 10 Min | - | 2 | Selten geändert, Cache lang halten |
| **Scraper Status** | 5 Sek | 10 Sek | 3 | Hochvolatil, Live-Updates kritisch |

---

## 🎯 Best Practices

### 1. **Query Keys richtig strukturieren**

```typescript
// ✅ GUT: Hierarchisch mit Filtern
['offers']                    // Alle Offers
['offers', filters]           // Filtered Offers
['offers', id]                // Ein Offer
['offers', id, 'history']     // Offer History

// ❌ SCHLECHT: Flach
['offersList']
['offerDetail']
```

**Warum?** Hierarchische Keys erlauben partial invalidation:
```typescript
// Invalidiert ALLE Offers (Liste + Details + History)
queryClient.invalidateQueries({ queryKey: ['offers'] })

// Invalidiert nur ein Offer
queryClient.invalidateQueries({ queryKey: ['offers', id] })
```

---

### 2. **Wann welche Invalidierung?**

```typescript
// 1. invalidateQueries → Mark als stale, refetch beim nächsten Zugriff
void queryClient.invalidateQueries({ queryKey: ['offers'] })

// 2. refetchQueries → Sofortiges Refetch (auch wenn fresh)
void queryClient.refetchQueries({ queryKey: ['offers'] })

// 3. setQueryData → Manuell Daten setzen (ohne API-Call)
queryClient.setQueryData(['offers', id], newData)

// 4. removeQueries → Aus Cache löschen
queryClient.removeQueries({ queryKey: ['offers', id] })
```

**Empfehlung**:
- Nach Mutations: `invalidateQueries` (effizient)
- User klickt "Refresh": `refetchQueries` (forceful)
- Optimistic Updates: `setQueryData` (instant UX)

---

### 3. **Loading States richtig nutzen**

```typescript
const { data, isLoading, isFetching, error } = useOffers(filters)

// isLoading = true → Initial Load (noch keine Daten)
// isFetching = true → Background Refetch (Daten vorhanden, wird updated)
```

**UI-Pattern**:
```typescript
{isLoading && <FullPageSpinner />}
{!isLoading && isFetching && <TopBarSpinner />}  // Subtiler!
{error && <ErrorMessage />}
{data && <DataDisplay data={data} />}
```

---

### 4. **Prefetching für bessere UX**

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { getOffer } from '../api/offers'

function OffersList() {
  const queryClient = useQueryClient()
  
  const handleOfferHover = (id: number) => {
    // Lädt Details im Hintergrund
    void queryClient.prefetchQuery({
      queryKey: ['offers', id],
      queryFn: () => getOffer(id),
    })
  }
  
  return (
    <div>
      {offers.map(offer => (
        <div 
          key={offer.id}
          onMouseEnter={() => handleOfferHover(offer.id)}  // 🎯 Prefetch!
          onClick={() => navigate(`/offers/${offer.id}`)}  // Instant Load!
        >
          {offer.title}
        </div>
      ))}
    </div>
  )
}
```

**Effekt**: Wenn User klickt, sind Daten bereits im Cache → instant! ⚡

---

### 5. **Error Handling mit Retry Logic**

```typescript
// Globale Retry-Konfiguration (main.tsx)
retry: 2,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
// → 1. Versuch: sofort
// → 2. Versuch: nach 1 Sekunde
// → 3. Versuch: nach 2 Sekunden
// → 4. Versuch: nach 4 Sekunden
// → Max: 30 Sekunden

// Pro-Query überschreiben
export function useCriticalData() {
  return useQuery({
    queryKey: ['critical'],
    queryFn: fetchCriticalData,
    retry: 5,           // Mehr Versuche
    retryDelay: 500,    // Schnellere Retries
  })
}
```

---

## 🧪 Testing mit DevTools

### DevTools öffnen
1. App starten: `npm run dev`
2. Browser öffnen: `http://localhost:5173`
3. DevTools Icon klicken (unten rechts)

### Features
- **Query Explorer**: Alle aktiven Queries sehen
- **Query Details**: Status, Data, Fetch Count, Last Updated
- **Manual Actions**: 
  - Refetch
  - Invalidate
  - Reset
  - Remove
- **Performance**: Cache Size, Query Count

### Debug-Tipps
```typescript
// In Komponente: Logging
const query = useOffers(filters)
console.log({
  isLoading: query.isLoading,
  isFetching: query.isFetching,
  dataUpdatedAt: query.dataUpdatedAt,
  errorUpdatedAt: query.errorUpdatedAt,
})
```

---

## 📖 Verwendungs-Beispiel

Siehe `frontend/src/examples/OptimizedOffersExample.tsx` für eine vollständige Komponente mit:
- ✅ Optimistic Updates
- ✅ Manual Invalidation
- ✅ Prefetching
- ✅ Loading States
- ✅ Error Handling
- ✅ Background Refetch Indicator

```bash
# Beispiel in App einbinden:
# In App.tsx importieren und Route hinzufügen
import { OptimizedOffersExample } from './examples/OptimizedOffersExample'
```

---

## 🎓 Weiterführende Ressourcen

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Keys Guide](https://tkdodo.eu/blog/effective-react-query-keys)

---

## 🔥 Performance-Tipps

1. **Select für Transformationen nutzen**
   ```typescript
   select: (data) => data.filter(x => x.active).sort(...)
   // Wird gecacht! Günstiger als in Komponente.
   ```

2. **Structural Sharing**
   - React Query vergleicht automatisch alte vs neue Daten
   - Nur bei Änderungen wird Re-Render getriggert

3. **Placeholder Data**
   ```typescript
   placeholderData: previousData => previousData
   // Zeigt alte Daten während Refetch → keine Loading-Flicker
   ```

4. **Keep Previous Data**
   ```typescript
   placeholderData: keepPreviousData
   // Für Pagination: Alte Page zeigen während neue lädt
   ```

---

## ⚡ Quick Reference

```typescript
// QUERIES
const query = useQuery({
  queryKey: ['key'],
  queryFn: fetchFn,
  staleTime: 5 * 60 * 1000,
  refetchInterval: 30_000,
  enabled: true,
})

// MUTATIONS
const mutation = useMutation({
  mutationFn: updateFn,
  onMutate: async (vars) => { /* optimistic */ },
  onError: (err, vars, context) => { /* rollback */ },
  onSettled: () => { /* refetch */ },
})

// MANUAL CONTROL
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['key'] })
queryClient.refetchQueries({ queryKey: ['key'] })
queryClient.setQueryData(['key'], data)
queryClient.removeQueries({ queryKey: ['key'] })
```

---

**Viel Erfolg mit deiner optimierten React Query Setup! 🚀**

