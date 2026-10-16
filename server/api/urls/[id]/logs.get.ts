import { defineEventHandler, getRouterParam, createError, type H3Event } from 'h3'
import { useAnalyticsService } from '../../../utils/container'

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const analyticsService = await useAnalyticsService()
  const data = await analyticsService.getClickLogs(Number(id))

  return {
    success: true,
    data
  }
})
