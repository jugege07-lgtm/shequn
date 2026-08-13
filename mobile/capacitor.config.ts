import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jugekeji.shequn',
  appName: '社群名片',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SystemBars: {
      // edge-to-edge：注入 --safe-area-inset-* CSS 变量供 H5 避让状态栏
      insetsHandling: 'css',
      // 默认浅色背景深色图标（绝大多数页面为白底 header）；
      // 深/彩色首屏由 H5 端 setStatusBarStyle('dark') 运行时切换为浅色图标
      style: 'LIGHT',
      hidden: false,
    },
  },
}

export default config