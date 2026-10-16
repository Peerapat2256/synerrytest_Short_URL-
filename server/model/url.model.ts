// โครงสร้างข้อมูลตาราง urls ในฐานข้อมูล (Database Entity Model)
export interface UrlModel {
  id: number
  original_url: string
  short_code: string
  title: string | null
  click_count: number
  created_at: string
  expires_at: string | null
}
