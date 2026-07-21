import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('admin-theme') === 'dark')

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('admin-theme', isDark.value ? 'dark' : 'light')
    applyTheme(isDark.value)
  }

  function applyTheme(dark: boolean) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  // Init on load
  applyTheme(isDark.value)

  return { isDark, toggle }
})
