# React Query Quick Start 🚀

## Was wurde implementiert?

### ✅ Dateien geändert/erstellt:

1. **`src/main.tsx`** - QueryClient mit optimierten Defaults + DevTools
2. **`src/hooks/useOffers.ts`** - Mit Optimistic Updates
3. **`src/hooks/useProducts.ts`** - Mit Optimistic Updates
4. **`src/hooks/useScraper.ts`** - Mit Live-Updates
5. **`src/hooks/useInvalidateQueries.ts`** - NEU! Manual Cache Control
6. **`src/examples/OptimizedOffersExample.tsx`** - NEU! Vollständiges Beispiel

---

## 🎯 Sofort nutzen

### 1. DevTools sehen

```bash
cd frontend
npm run dev
```

Dann öffne `http://localhost:5173` und klicke auf das React Query Icon (unten rechts).

---

### 2. Optimistic Updates in Aktion

In deiner `OffersPage`:

```typescript
import { useUpdateOfferStatus } from '../hooks/useOffers'

function OffersPage() {
  const updateStatus = useUpdateOfferStatus()
  
  const handleStatusChange = (id: number, newStatus: string) => {
    // UI updated SOFORT, bevor API antwortet! ⚡
    updateStatus.mutate({ 
      id, 
      payload: { status: newStatus } 
    })
  }
  
  return (
    <select 
      onChange={(e) => handleStatusChange(offer.id, e.target.value)}
    >
      <option value="new">new</option>
      <option value="open">open</option>
    </select>
  )
}
```

**Effekt**: Status ändert sich instant, kein Laden!

---

### 3. Manuelle Cache-Kontrolle

```typescript
import { useInvalidateQueries } from '../hooks/useInvalidateQueries'

function MyComponent() {
  const { refetchOffers, prefetchOffer } = useInvalidateQueries()
  
  return (
    <>
      {/* Manual Refresh Button */}
      <button onClick={() => refetchOffers()}>
        🔄 Refresh Offers
      </button>
      
      {/* Prefetch beim Hover */}
      <div onMouseEnter={() => prefetchOffer(123)}>
        Hover me (lädt Details im Hintergrund)
      </div>
    </>
  )
}
```

---

### 4. Live-Updates nutzen

Deine Offers-Liste updated sich automatisch alle 30 Sekunden:

```typescript
const { data, isFetching } = useOffers(filters)

return (
  <>
    {isFetching && <span>🔄 Aktualisiere...</span>}
    {/* Daten werden im Hintergrund aktualisiert */}
  </>
)
```

**Kein User-Input nötig!** Updates laufen automatisch.

---

### 5. Beispiel-Komponente testen

```typescript
// In App.tsx oder als neue Route
import { OptimizedOffersExample } from './examples/OptimizedOffersExample'

function App() {
  return (
    <Routes>
      <Route path="/offers-example" element={<OptimizedOffersExample />} />
    </Routes>
  )
}
```

Dann navigiere zu `/offers-example` und teste:
- ✅ Status-Änderungen (Optimistic Updates)
- ✅ Manual Refresh Button
- ✅ Hover Prefetching
- ✅ Background Fetching Indicator

---

## 📊 Konfiguration auf einen Blick

| Feature | Konfiguriert in | Wert |
|---------|----------------|------|
| Global staleTime | `main.tsx` | 5 Min |
| Offers staleTime | `useOffers.ts` | 2 Min |
| Offers auto-refetch | `useOffers.ts` | 30 Sek |
| Products staleTime | `useProducts.ts` | 10 Min |
| Scraper staleTime | `useScraper.ts` | 5 Sek |
| Scraper auto-refetch | `useScraper.ts` | 10 Sek |
| Retry Logic | `main.tsx` | 2x mit Backoff |

---

## 🔧 Anpassen

### StaleTime ändern

```typescript
// In useOffers.ts
staleTime: 5 * 60 * 1000,  // 5 Minuten statt 2
```

### Auto-Refetch aktivieren/deaktivieren

```typescript
// In useOffers.ts
refetchInterval: false,  // Deaktiviert
// oder
refetchInterval: 60_000, // Alle 60 Sekunden
```

### Optimistic Updates deaktivieren

Entferne einfach die `onMutate`-Funktion in der Mutation:

```typescript
return useMutation({
  mutationFn: updateFn,
  // onMutate: ...,  // ← Kommentieren oder löschen
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: ['offers'] })
  },
})
```

---

## 🐛 Troubleshooting

### Problem: Daten werden nicht aktualisiert

**Lösung**: Überprüfe `staleTime` - wenn zu hoch, wird nicht refetched.

```typescript
// DevTools öffnen → Query inspizieren → "dataUpdatedAt" checken
```

### Problem: Zu viele API-Calls

**Lösung**: Erhöhe `staleTime` oder deaktiviere `refetchInterval`.

```typescript
staleTime: 10 * 60 * 1000,   // Längere staleTime
refetchInterval: false,       // Auto-Refetch aus
```

### Problem: Optimistic Update funktioniert nicht

**Lösung**: Stelle sicher, dass `queryKey` übereinstimmt:

```typescript
// In Query
queryKey: ['offers', filters]

// In Mutation
queryClient.setQueriesData(
  { queryKey: ['offers'] },  // Muss matchen!
  (old) => ...
)
```

---

## 📖 Mehr Details

Siehe `REACT_QUERY_GUIDE.md` für:
- Detaillierte Erklärungen
- Best Practices
- Performance-Tipps
- Erweiterte Patterns

---

## 🎉 Das war's!

Deine React Query Setup ist jetzt production-ready mit:
- ✅ Optimalen Defaults
- ✅ Optimistic Updates
- ✅ Auto-Refetch
- ✅ Manual Cache Control
- ✅ DevTools für Debugging

**Viel Erfolg! 🚀**

