import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref<any>(null)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('admin_token', t)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
  }

  return { token, userInfo, setToken, logout }
})
