import { createError } from 'h3'
import type { UrlRepository } from '../repository/url.repository'
import type { UrlModel } from '../model/url.model'

export interface RedirectService {
  resolveShortCode(shortCode: string): Promise<UrlModel | null>
}

class RedirectServiceImpl implements RedirectService {
  private urlRepository: UrlRepository

  constructor(urlRepository: UrlRepository) {
    this.urlRepository = urlRepository
  }

  async resolveShortCode(shortCode: string): Promise<UrlModel | null> {
    const urlRecord = await this.urlRepository.getUrlByShortCode(shortCode)
    if (!urlRecord) {
      return null
    }

    if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
      throw createError({
        statusCode: 410,
        statusMessage: 'Link Expired'
      })
    }

    return urlRecord
  }
}

export function NewRedirectService(urlRepository: UrlRepository): RedirectService {
  return new RedirectServiceImpl(urlRepository)
}
