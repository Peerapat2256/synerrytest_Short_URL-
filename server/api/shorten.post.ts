import { getDb } from '../utils/db'
import { generateShortCode, isValidUrl } from '../utils/urlHelper'
import QRCode from 'qrcode'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { original_url, custom_alias, expires_in_days } = body

  if (!original_url || typeof original_url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอก URL ที่ต้องการย่อ' })
  }

  let formattedUrl = original_url.trim()
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl
  }

  if (!isValidUrl(formattedUrl)) {
    throw createError({ statusCode: 400, statusMessage: 'รูปแบบ URL ไม่ถูกต้อง' })
  }

  const pool = await getDb()
  let shortCode = ''

  if (custom_alias && typeof custom_alias === 'string') {
    const cleanAlias = custom_alias.trim()
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanAlias)) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Custom Alias ต้องมีความยาว 3-20 ตัวอักษร และประกอบด้วยตัวอักษร, ตัวเลข, - หรือ _ เท่านั้น' 
      })
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM urls WHERE short_code = ? LIMIT 1', [cleanAlias])
    if (rows.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'ชื่อกำหนดเอง (Custom Alias) นี้มีผู้ใช้งานแล้ว' })
    }
    shortCode = cleanAlias
  } else {
    let attempts = 0
    while (attempts < 10) {
      const code = generateShortCode()
      const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM urls WHERE short_code = ? LIMIT 1', [code])
      if (rows.length === 0) {
        shortCode = code
        break
      }
      attempts++
    }
    if (!shortCode) {
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้าง Short Code ได้ กรุณาลองใหม่อีกครั้ง' })
    }
  }

  let expiresAt: string | null = null
  if (expires_in_days && Number(expires_in_days) > 0) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + Number(expires_in_days))
    expiresAt = expDate.toISOString().slice(0, 19).replace('T', ' ')
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO urls (original_url, short_code, expires_at) VALUES (?, ?, ?)',
    [formattedUrl, shortCode, expiresAt]
  )

  const reqHost = getRequestHeader(event, 'host') || 'localhost:3000'
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const fullShortUrl = `${protocol}://${reqHost}/${shortCode}`

  const qrCodeDataUrl = await QRCode.toDataURL(fullShortUrl, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })

  return {
    success: true,
    data: {
      id: result.insertId,
      original_url: formattedUrl,
      short_code: shortCode,
      short_url: fullShortUrl,
      qr_code: qrCodeDataUrl,
      click_count: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }
  }
})
