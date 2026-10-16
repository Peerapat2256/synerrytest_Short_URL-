import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import type { UrlModel } from '../model/url.model'
import type { ClickLogModel } from '../model/clickLog.model'

// กำหนด Interface สำหรับ UrlRepository เพื่อควบคุมฟังก์ชันการเข้าถึงฐานข้อมูล
export interface UrlRepository {
  getAllUrls(): Promise<UrlModel[]>
  getUrlByShortCode(shortCode: string): Promise<UrlModel | null>
  createUrl(originalUrl: string, shortCode: string, expiresAt: string | null): Promise<number>
  incrementClickCount(id: number): Promise<void>
  deleteUrlById(id: number): Promise<boolean>
  createClickLog(urlId: number, ipAddress: string, userAgent: string, referer: string): Promise<void>
  getClickLogsByUrlId(urlId: number): Promise<ClickLogModel[]>
}

class UrlRepositoryImpl implements UrlRepository {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  async getAllUrls(): Promise<UrlModel[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(`
      SELECT id, original_url, short_code, title, click_count, created_at, expires_at
      FROM urls
      ORDER BY id DESC
    `)
    return rows as unknown as UrlModel[]
  }

  async getUrlByShortCode(shortCode: string): Promise<UrlModel | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      'SELECT id, original_url, short_code, title, click_count, created_at, expires_at FROM urls WHERE short_code = ? LIMIT 1',
      [shortCode]
    )
    if (rows.length === 0) return null
    return rows[0] as unknown as UrlModel
  }

  async createUrl(originalUrl: string, shortCode: string, expiresAt: string | null): Promise<number> {
    const [result] = await this.db.query<ResultSetHeader>(
      'INSERT INTO urls (original_url, short_code, expires_at) VALUES (?, ?, ?)',
      [originalUrl, shortCode, expiresAt]
    )
    return result.insertId
  }

  async incrementClickCount(id: number): Promise<void> {
    await this.db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = ?', [id])
  }

  async deleteUrlById(id: number): Promise<boolean> {
    const [result] = await this.db.query<ResultSetHeader>('DELETE FROM urls WHERE id = ?', [id])
    return result.affectedRows > 0
  }

  async createClickLog(urlId: number, ipAddress: string, userAgent: string, referer: string): Promise<void> {
    await this.db.query(
      'INSERT INTO click_logs (url_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)',
      [urlId, ipAddress, userAgent, referer]
    )
  }

  async getClickLogsByUrlId(urlId: number): Promise<ClickLogModel[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id, url_id, ip_address, user_agent, referer, clicked_at
       FROM click_logs
       WHERE url_id = ?
       ORDER BY clicked_at DESC
       LIMIT 50`,
      [urlId]
    )
    return rows as unknown as ClickLogModel[]
  }
}

// ฟังก์ชันสำหรับสร้าง Instance ของ UrlRepository (Dependency Injection)
export function NewUrlRepository(db: Pool): UrlRepository {
  return new UrlRepositoryImpl(db)
}
