import { NewDbConnection } from '../repository/dbconnect'
import { NewUrlRepository } from '../repository/url.repository'
import { NewUrlService, type UrlService } from '../service/url.service'

let urlServiceInstance: UrlService | null = null

// Dependency Injection Container (เทียบเท่าการผูก Repository -> Service ใน main.go)
export async function useUrlService(): Promise<UrlService> {
  if (!urlServiceInstance) {
    const db = await NewDbConnection()
    const urlRepository = NewUrlRepository(db)
    urlServiceInstance = NewUrlService(urlRepository)
  }
  return urlServiceInstance
}
