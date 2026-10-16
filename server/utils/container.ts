import { NewDbConnection } from '../repository/dbconnect'
import { NewUrlRepository, type UrlRepository } from '../repository/url.repository'
import { NewAnalyticsRepository, type AnalyticsRepository } from '../repository/analytics.repository'
import { NewShortenerService, type ShortenerService } from '../service/shortener.service'
import { NewRedirectService, type RedirectService } from '../service/redirect.service'
import { NewAnalyticsService, type AnalyticsService } from '../service/analytics.service'

let urlRepositoryInstance: UrlRepository | null = null
let analyticsRepositoryInstance: AnalyticsRepository | null = null

let shortenerServiceInstance: ShortenerService | null = null
let redirectServiceInstance: RedirectService | null = null
let analyticsServiceInstance: AnalyticsService | null = null

async function getUrlRepository(): Promise<UrlRepository> {
  if (!urlRepositoryInstance) {
    const db = await NewDbConnection()
    urlRepositoryInstance = NewUrlRepository(db)
  }
  return urlRepositoryInstance
}

async function getAnalyticsRepository(): Promise<AnalyticsRepository> {
  if (!analyticsRepositoryInstance) {
    const db = await NewDbConnection()
    analyticsRepositoryInstance = NewAnalyticsRepository(db)
  }
  return analyticsRepositoryInstance
}

export async function useShortenerService(): Promise<ShortenerService> {
  if (!shortenerServiceInstance) {
    const repo = await getUrlRepository()
    shortenerServiceInstance = NewShortenerService(repo)
  }
  return shortenerServiceInstance
}

export async function useRedirectService(): Promise<RedirectService> {
  if (!redirectServiceInstance) {
    const repo = await getUrlRepository()
    redirectServiceInstance = NewRedirectService(repo)
  }
  return redirectServiceInstance
}

export async function useAnalyticsService(): Promise<AnalyticsService> {
  if (!analyticsServiceInstance) {
    const repo = await getAnalyticsRepository()
    analyticsServiceInstance = NewAnalyticsService(repo)
  }
  return analyticsServiceInstance
}
