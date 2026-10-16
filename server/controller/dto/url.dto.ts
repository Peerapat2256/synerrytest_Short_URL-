export interface CreateShortUrlRequestDto {
  original_url: string
  custom_alias?: string
  expires_in_days?: number
}

export interface ShortUrlResponseDto {
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
