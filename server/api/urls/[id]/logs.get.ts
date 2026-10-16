import { useUrlService } from '../../../utils/container'

// Presentation Layer (Controller): ดึงประวัติการคลิกจากตาราง click_logs ผ่าน UrlService
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing URL ID' })
  }

  const urlService = await useUrlService()
  const data = await urlService.getClickLogs(Number(id))

  return {
    success: true,
    data
  }
})
