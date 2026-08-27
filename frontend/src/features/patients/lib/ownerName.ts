export function splitOwnerName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const firstSpace = trimmed.indexOf(' ')

  if (firstSpace === -1) {
    return { firstName: trimmed, lastName: '' }
  }

  return {
    firstName: trimmed.slice(0, firstSpace),
    lastName: trimmed.slice(firstSpace + 1).trim(),
  }
}
