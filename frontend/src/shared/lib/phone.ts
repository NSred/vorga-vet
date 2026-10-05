export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
