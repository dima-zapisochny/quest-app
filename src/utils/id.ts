export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const random = Math.random().toString(36).slice(2)
  const timestamp = Date.now().toString(36)
  return `${prefix}-${timestamp}-${random}`
}


