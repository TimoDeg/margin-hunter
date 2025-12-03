import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '../hooks/useProducts'
import type { ProductCreate } from '../api/products'

const emptyProduct: ProductCreate = {
  name: '',
  category: '',
  brands: [],
  filters: {},
  price_min: 0,
  price_max: 0,
  active: true,
}

export function ProductsPage() {
  const { data, isLoading, error } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [formState, setFormState] = useState<ProductCreate>(emptyProduct)
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId == null) {
      createProduct.mutate(formState, {
        onSuccess: () => {
          setFormState(emptyProduct)
        },
      })
    } else {
      updateProduct.mutate(
        { id: editingId, payload: formState },
        {
          onSuccess: () => {
            setEditingId(null)
            setFormState(emptyProduct)
          },
        },
      )
    }
  }

  const startEdit = (id: number) => {
    const product = data?.find((p) => p.id === id)
    if (!product) return
    setEditingId(id)
    setFormState({
      name: product.name,
      category: product.category,
      brands: product.brands,
      filters: product.filters,
      price_min: product.price_min,
      price_max: product.price_max,
      active: product.active,
    })
  }

  return (
    <section>
      <h2>Products</h2>
      <p>Verwaltung der Produkte, die für das Scraping/Matching genutzt werden.</p>

      {isLoading && <p>Lade Products...</p>}
      {error && (
        <p style={{ color: 'salmon' }}>
          Fehler beim Laden der Products: {error.message}
        </p>
      )}

      {data && data.length === 0 && <p>Noch keine Produkte angelegt.</p>}

      {data && data.length > 0 && (
        <table
          style={{
            borderCollapse: 'collapse',
            marginTop: '1rem',
            marginBottom: '1.5rem',
            minWidth: '60%',
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>
                Name
              </th>
              <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>
                Kategorie
              </th>
              <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>
                Preis-Min/Max
              </th>
              <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>
                Aktiv
              </th>
              <th style={{ borderBottom: '1px solid #1f2937', padding: '0.5rem' }}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((product) => (
              <tr key={product.id}>
                <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem', textAlign: 'left' }}>
                  {product.name}
                </td>
                <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                  {product.category}
                </td>
                <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                  {product.price_min.toFixed(2)} € –{' '}
                  {product.price_max.toFixed(2)} €
                </td>
                <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                  {product.active ? 'Ja' : 'Nein'}
                </td>
                <td style={{ borderBottom: '1px solid #111827', padding: '0.5rem' }}>
                  <button type="button" onClick={() => startEdit(product.id)}>
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    style={{ marginLeft: '0.5rem' }}
                    onClick={() =>
                      deleteProduct.mutate({ id: product.id })
                    }
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>{editingId == null ? 'Neues Produkt' : 'Produkt bearbeiten'}</h3>
      <form
        onSubmit={handleSubmit}
        style={{ marginTop: '0.5rem', maxWidth: '28rem' }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Name
            <br />
            <input
              type="text"
              value={formState.name}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Kategorie
            <br />
            <input
              type="text"
              value={formState.category}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Preis min
            <br />
            <input
              type="number"
              value={formState.price_min}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  price_min: Number.parseFloat(e.target.value),
                }))
              }
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Preis max
            <br />
            <input
              type="number"
              value={formState.price_max}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  price_max: Number.parseFloat(e.target.value),
                }))
              }
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Aktiv
            <input
              type="checkbox"
              checked={formState.active}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  active: e.target.checked,
                }))
              }
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>

        <button type="submit">
          {editingId == null ? 'Erstellen' : 'Speichern'}
        </button>
        {editingId != null && (
          <button
            type="button"
            style={{ marginLeft: '0.5rem' }}
            onClick={() => {
              setEditingId(null)
              setFormState(emptyProduct)
            }}
          >
            Abbrechen
          </button>
        )}
      </form>
    </section>
  )
}



