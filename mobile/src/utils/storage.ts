export function setStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStorage(key: string) {
  const val = localStorage.getItem(key)
  return val ? JSON.parse(val) : null
}

export function removeStorage(key: string) {
  localStorage.removeItem(key)
}
