import { defineEventHandler, getRouterParam, createError, type H3Event } from 'h3'
import { useUrlService } from '../../utils/container'

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const urlService = await useUrlService()
  await urlService.deleteUrl(Number(id))

  return {
    success: true
  }
})
