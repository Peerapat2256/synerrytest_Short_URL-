import { defineEventHandler, getRequestHeader, type H3Event } from 'h3'
import { useUrlService } from '../utils/container'

export default defineEventHandler(async (event: H3Event) => {
  const reqHost = getRequestHeader(event, 'host') || 'localhost:3000'
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${reqHost}`

  const urlService = await useUrlService()
  const data = await urlService.getAllUrls(baseUrl)

  return {
    success: true,
    data
  }
})
