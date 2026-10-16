import type { AnalyticsRepository } from '../repository/analytics.repository'
import type { ClickLogModel } from '../model/clickLog.model'

export interface AnalyticsService {
  trackClick(urlId: number, ip: string, userAgent: string, referer: string): Promise<void>
  getClickLogs(urlId: number): Promise<ClickLogModel[]>
}

class AnalyticsServiceImpl implements AnalyticsService {
  private analyticsRepository: AnalyticsRepository

  constructor(analyticsRepository: AnalyticsRepository) {
    this.analyticsRepository = analyticsRepository
  }

  async trackClick(urlId: number, ip: string, userAgent: string, referer: string): Promise<void> {
    await this.analyticsRepository.incrementClickCount(urlId)

    this.analyticsRepository
      .createClickLog(urlId, ip, userAgent, referer)
      .catch((err) => console.error('Click log error:', err))
  }

  async getClickLogs(urlId: number): Promise<ClickLogModel[]> {
    return this.analyticsRepository.getClickLogsByUrlId(urlId)
  }
}

export function NewAnalyticsService(analyticsRepository: AnalyticsRepository): AnalyticsService {
  return new AnalyticsServiceImpl(analyticsRepository)
}
