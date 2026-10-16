import { getDb } from '../../../utils/db'
import type { RowDataPacket } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing URL ID' })
  }

  const pool = await getDb()
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, url_id, ip_address, user_agent, referer, clicked_at
     FROM click_logs
     WHERE url_id = ?
     ORDER BY clicked_at DESC
     LIMIT 50`,
    [id]
  )

  return {
    success: true,
    data: rows
  }
})
