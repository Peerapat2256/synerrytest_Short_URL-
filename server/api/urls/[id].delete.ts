import { getDb } from '../../utils/db'
import type { ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const pool = await getDb()
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM urls WHERE id = ?', [id])

  if (result.affectedRows === 0) {
    throw createError({ statusCode: 404, statusMessage: 'URL not found' })
  }

  return { success: true, message: 'Deleted successfully' }
})
