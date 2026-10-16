// โครงสร้างข้อมูลตาราง click_logs ในฐานข้อมูล (Database Entity Model)
export interface ClickLogModel {
  id: number
  url_id: number
  ip_address: string
  user_agent: string
  referer: string
  clicked_at: string
}
