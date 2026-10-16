import { defineEventHandler, readBody, getRequestHeader, type H3Event } from 'h3'
import { useShortenerService } from '../utils/container'
import type { CreateShortUrlRequestDto } from '../controller/dto/url.dto'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<CreateShortUrlRequestDto>(event)

  const reqHost = getRequestHeader(event, 'host') || 'localhost:3000'
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${reqHost}`

  const shortenerService = await useShortenerService()
  const data = await shortenerService.createShortUrl(body, baseUrl)

  return {
    success: true,
    data
  }
})
