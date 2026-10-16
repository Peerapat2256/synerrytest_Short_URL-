import { customAlphabet } from 'nanoid'

// สุ่มเฉพาะตัวอักษรและตัวเลขที่อ่านง่าย ไม่สับสน (Base62)
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const nanoid = customAlphabet(alphabet, 6)

export function generateShortCode(): string {
  return nanoid()
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
