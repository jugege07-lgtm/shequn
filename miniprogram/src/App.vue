<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(() => {
  // 兜底恢复会话（main.ts 已在创建期恢复一次，这里确保 tab 页首次加载前状态就绪）
  const userStore = useUserStore()
  userStore.restoreSession()
})
</script>

<style>
/* ===== 全局样式（自 mobile/src/styles/global.css 迁移，小程序适配） ===== */
@import './styles/global.css';

/* ===== 设计令牌（page 等价于 :root） ===== */
page {
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-bg: #f0f2f8;
  --color-text-primary: #1e1b4b;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-surface-solid: #ffffff;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 999px;
  background: #ffffff;
  font-family: 'PingFang SC', -apple-system, 'Helvetica Neue', sans-serif;
  color: var(--color-text-primary);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}
</style>
