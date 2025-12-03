const API_BASE_URL = '/api'

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL + input
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    let detail: unknown
    try {
      // FastAPI-Fehler enthalten typischerweise ein "detail"-Feld
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      detail = (data as any).detail ?? data
    } catch {
      detail = res.statusText
    }

    throw new Error(
      `Request failed (${res.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
    )
  }

  if (res.status === 204) {
    // @ts-expect-error kein Inhalt
    return undefined
  }

  return (await res.json()) as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}


