export interface ShortUrlItem {
  id: number
  original_url: string
  short_code: string
  short_url: string
  qr_code: string
  click_count: number
  created_at: string
  expires_at: string | null
  is_expired: boolean
}

export interface ClickLogItem {
  id: number
  url_id: number
  ip_address: string
  user_agent: string
  referer: string
  clicked_at: string
}
