import { apiClient } from './client'

export type HealthResponse = {
  status: string
  timestamp?: string
  services?: {
    database?: string
    redis?: string
    celery?: string
  }
}

export type ScraperStatusResponse = {
  status: string
  detail?: string
}

export function getHealth() {
  return apiClient.get<HealthResponse>('/health')
}

export function getScraperStatus() {
  return apiClient.get<ScraperStatusResponse>('/scraper/status')
}

export function startScraper() {
  return apiClient.post<{ detail: string }>('/scraper/start')
}

export function stopScraper() {
  return apiClient.post<{ detail: string }>('/scraper/stop')
}


