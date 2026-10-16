import { useUrlService } from '../utils/container'
import type { CreateShortUrlRequestDto } from '../controller/dto/url.dto'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateShortUrlRequestDto>(event)

  const reqHost = getRequestHeader(event, 'host') || 'localhost:3000'
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${reqHost}`

  const urlService = await useUrlService()
  const data = await urlService.createShortUrl(body, baseUrl)

  return {
    success: true,
    data
  }
})
