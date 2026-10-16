import { getDb } from '../utils/db'
import QRCode from 'qrcode'
import type { RowDataPacket } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const reqHost = getRequestHeader(event, 'host') || 'localhost:3000'
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'

  const pool = await getDb()
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT id, original_url, short_code, click_count, created_at, expires_at
    FROM urls
    ORDER BY id DESC
  `)

  const data = await Promise.all(
    rows.map(async (row) => {
      const fullShortUrl = `${protocol}://${reqHost}/${row.short_code}`
      const qrCode = await QRCode.toDataURL(fullShortUrl, { width: 220, margin: 1 })
      const isExpired = row.expires_at ? new Date(row.expires_at) < new Date() : false

      return {
        id: row.id,
        original_url: row.original_url,
        short_code: row.short_code,
        click_count: row.click_count,
        created_at: row.created_at,
        expires_at: row.expires_at,
        short_url: fullShortUrl,
        qr_code: qrCode,
        is_expired: isExpired
      }
    })
  )

  return {
    success: true,
    data
  }
})
