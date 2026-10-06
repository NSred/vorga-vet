export function textRule(maxLength: number, requiredMessage?: string) {
  return (value: string | undefined): string | true => {
    const length = value?.trim().length ?? 0
    if (length === 0 && requiredMessage) return requiredMessage
    return length <= maxLength || `Maximum ${maxLength} characters`
  }
}
