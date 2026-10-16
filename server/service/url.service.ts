import QRCode from 'qrcode'
import type { UrlRepository } from '../repository/url.repository'
import type { CreateShortUrlRequestDto, ShortUrlResponseDto } from '../controller/dto/url.dto'
import type { ClickLogModel } from '../model/clickLog.model'
import type { UrlModel } from '../model/url.model'
import { generateShortCode, isValidUrl } from '../utils/urlHelper'

export interface UrlService {
  createShortUrl(dto: CreateShortUrlRequestDto, baseUrl: string): Promise<ShortUrlResponseDto>
  getAllUrls(baseUrl: string): Promise<ShortUrlResponseDto[]>
  resolveShortCodeAndTrack(shortCode: string, ip: string, userAgent: string, referer: string): Promise<UrlModel | null>
  deleteUrl(id: number): Promise<void>
  getClickLogs(urlId: number): Promise<ClickLogModel[]>
}

class UrlServiceImpl implements UrlService {
  private urlRepository: UrlRepository

  constructor(urlRepository: UrlRepository) {
    this.urlRepository = urlRepository
  }

  async createShortUrl(dto: CreateShortUrlRequestDto, baseUrl: string): Promise<ShortUrlResponseDto> {
    if (!dto.original_url || typeof dto.original_url !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอก URL ที่ต้องการย่อ' })
    }

    let formattedUrl = dto.original_url.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }

    if (!isValidUrl(formattedUrl)) {
      throw createError({ statusCode: 400, statusMessage: 'รูปแบบ URL ไม่ถูกต้อง' })
    }

    let shortCode = ''

    if (dto.custom_alias && typeof dto.custom_alias === 'string') {
      const cleanAlias = dto.custom_alias.trim()
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanAlias)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Custom Alias ต้องมีความยาว 3-20 ตัวอักษร (a-z, 0-9, -, _)'
        })
      }

      const existing = await this.urlRepository.getUrlByShortCode(cleanAlias)
      if (existing) {
        throw createError({ statusCode: 409, statusMessage: 'ชื่อ Custom Alias นี้ถูกใช้งานแล้ว' })
      }
      shortCode = cleanAlias
    } else {
      let attempts = 0
      while (attempts < 10) {
        const code = generateShortCode()
        const existing = await this.urlRepository.getUrlByShortCode(code)
        if (!existing) {
          shortCode = code
          break
        }
        attempts++
      }
      if (!shortCode) {
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้างรหัสย่อได้ กรุณาลองใหม่' })
      }
    }

    let expiresAt: string | null = null
    if (dto.expires_in_days && Number(dto.expires_in_days) > 0) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + Number(dto.expires_in_days))
      expiresAt = expDate.toISOString().slice(0, 19).replace('T', ' ')
    }

    const insertId = await this.urlRepository.createUrl(formattedUrl, shortCode, expiresAt)
    const fullShortUrl = `${baseUrl}/${shortCode}`

    const qrCodeDataUrl = await QRCode.toDataURL(fullShortUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#09090b',
        light: '#ffffff'
      }
    })

    return {
      id: insertId,
      original_url: formattedUrl,
      short_code: shortCode,
      short_url: fullShortUrl,
      qr_code: qrCodeDataUrl,
      click_count: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      is_expired: false
    }
  }

  async getAllUrls(baseUrl: string): Promise<ShortUrlResponseDto[]> {
    const rows = await this.urlRepository.getAllUrls()

    return Promise.all(
      rows.map(async (row) => {
        const fullShortUrl = `${baseUrl}/${row.short_code}`
        const qrCode = await QRCode.toDataURL(fullShortUrl, { width: 220, margin: 1 })
        const isExpired = row.expires_at ? new Date(row.expires_at) < new Date() : false

        return {
          id: row.id,
          original_url: row.original_url,
          short_code: row.short_code,
          click_count: row.click_count,
          created_at: row.created_at,
          expires_at: row.expires_at,
          short_url: fullShortUrl,
          qr_code: qrCode,
          is_expired: isExpired
        }
      })
    )
  }

  async resolveShortCodeAndTrack(
    shortCode: string,
    ip: string,
    userAgent: string,
    referer: string
  ): Promise<UrlModel | null> {
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

    await this.urlRepository.incrementClickCount(urlRecord.id)

    this.urlRepository
      .createClickLog(urlRecord.id, ip, userAgent, referer)
      .catch((err) => console.error('Click log error:', err))

    return urlRecord
  }

  async deleteUrl(id: number): Promise<void> {
    const deleted = await this.urlRepository.deleteUrlById(id)
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'URL not found' })
    }
  }

  async getClickLogs(urlId: number): Promise<ClickLogModel[]> {
    return this.urlRepository.getClickLogsByUrlId(urlId)
  }
}

export function NewUrlService(urlRepository: UrlRepository): UrlService {
  return new UrlServiceImpl(urlRepository)
}
