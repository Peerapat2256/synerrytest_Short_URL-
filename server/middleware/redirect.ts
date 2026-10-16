import { defineEventHandler, getRequestIP, getRequestHeader, sendRedirect, type H3Event } from 'h3'
import { useUrlService } from '../utils/container'

export default defineEventHandler(async (event: H3Event) => {
  const reqPath = event.path || ''

  if (
    reqPath.startsWith('/api') ||
    reqPath.startsWith('/_nuxt') ||
    reqPath.startsWith('/__nuxt') ||
    reqPath.startsWith('/favicon.ico') ||
    reqPath === '/'
  ) {
    return
  }

  const cleanPath = reqPath.split('?')[0]?.replace(/^\//, '') || ''
  if (!cleanPath || !/^[a-zA-Z0-9_-]{3,50}$/.test(cleanPath)) {
    return
  }

  try {
    const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'
    const referer = getRequestHeader(event, 'referer') || 'Direct'

    const urlService = await useUrlService()
    const urlRecord = await urlService.resolveShortCodeAndTrack(cleanPath, ip, userAgent, referer)

    if (!urlRecord) {
      return
    }

    return sendRedirect(event, urlRecord.original_url, 302)
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Redirect error:', err)
  }
})
