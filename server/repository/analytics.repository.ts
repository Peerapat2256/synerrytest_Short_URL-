import type { Pool, RowDataPacket } from 'mysql2/promise'
import type { ClickLogModel } from '../model/clickLog.model'

export interface AnalyticsRepository {
  incrementClickCount(urlId: number): Promise<void>
  createClickLog(urlId: number, ipAddress: string, userAgent: string, referer: string): Promise<void>
  getClickLogsByUrlId(urlId: number): Promise<ClickLogModel[]>
}

class AnalyticsRepositoryImpl implements AnalyticsRepository {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  async incrementClickCount(urlId: number): Promise<void> {
    await this.db.query('UPDATE urls SET click_count = click_count + 1 WHERE id = ?', [urlId])
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

export function NewAnalyticsRepository(db: Pool): AnalyticsRepository {
  return new AnalyticsRepositoryImpl(db)
}
