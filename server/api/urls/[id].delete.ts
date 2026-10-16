import { useUrlService } from '../../utils/container'

export default defineEventHandler(async (event) => {
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
