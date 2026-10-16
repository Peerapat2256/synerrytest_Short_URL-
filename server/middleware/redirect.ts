import { getDb } from '../utils/db'
import type { RowDataPacket } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const reqPath = event.path || ''

  // ไม่ดักจับถ้าเป็น API, Nuxt Internal หรือ Root
  if (
    reqPath.startsWith('/api') ||
    reqPath.startsWith('/_nuxt') ||
    reqPath.startsWith('/__nuxt') ||
    reqPath.startsWith('/favicon.ico') ||
    reqPath === '/'
  ) {
    return
  }

  // ถอดรหัส path เช่น /rAJMO -> rAJMO
  const cleanPath = reqPath.split('?')[0].replace(/^\//, '')
  if (!cleanPath || !/^[a-zA-Z0-9_-]{3,50}$/.test(cleanPath)) {
    return
  }

  try {
    const pool = await getDb()
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, original_url, expires_at FROM urls WHERE short_code = ? LIMIT 1',
      [cleanPath]
    )

    if (rows.length === 0) {
      return
    }

    const urlRecord = rows[0]

    // ตรวจสอบวันหมดอายุ
    if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
      throw createError({
        statusCode: 410,
        statusMessage: 'ลิงก์สั้นนี้หมดอายุการใช้งานแล้ว (Link Expired)'
      })
    }

    // เพิ่มสถิติคนคลิก
    await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE id = ?', [urlRecord.id])

    // บันทึก click log แบบ non-blocking
    const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'
    const referer = getRequestHeader(event, 'referer') || 'Direct'

    pool.query(
      'INSERT INTO click_logs (url_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)',
      [urlRecord.id, ip, userAgent, referer]
    ).catch(err => console.error('Click log error:', err))

    // ทำ 302 Redirect ไปยัง URL ต้นทาง
    return sendRedirect(event, urlRecord.original_url, 302)
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Redirect handler error:', err)
  }
})
