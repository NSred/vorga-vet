const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) {
    return 'Email is required.'
  }

  if (!emailPattern.test(value.trim())) {
    return 'Enter a valid email address, such as name@example.com.'
  }

  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) {
    return 'Password is required.'
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  return undefined
}

export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}
