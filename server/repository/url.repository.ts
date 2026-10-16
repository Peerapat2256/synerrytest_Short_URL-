import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import type { UrlModel } from '../model/url.model'

export interface UrlRepository {
  getAllUrls(): Promise<UrlModel[]>
  getUrlByShortCode(shortCode: string): Promise<UrlModel | null>
  createUrl(originalUrl: string, shortCode: string, expiresAt: string | null): Promise<number>
  deleteUrlById(id: number): Promise<boolean>
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

  async deleteUrlById(id: number): Promise<boolean> {
    const [result] = await this.db.query<ResultSetHeader>('DELETE FROM urls WHERE id = ?', [id])
    return result.affectedRows > 0
  }
}

export function NewUrlRepository(db: Pool): UrlRepository {
  return new UrlRepositoryImpl(db)
}
