import { defineEventHandler, getRouterParam, createError, type H3Event } from 'h3'
import { useShortenerService } from '../../utils/container'

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const shortenerService = await useShortenerService()
  await shortenerService.deleteUrl(Number(id))

  return {
    success: true
  }
})
