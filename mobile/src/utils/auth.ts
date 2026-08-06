export function isLoggedIn(): boolean {
  return !!localStorage.getItem('token')
}

export function getUserInfo(): any {
  return JSON.parse(localStorage.getItem('user_info') || 'null')
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user_info')
}
