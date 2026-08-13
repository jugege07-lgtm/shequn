import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jugekeji.shequn',
  appName: '社群名片',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // 状态栏插件配置：让 WebView 覆盖到状态栏后面（overlay）。
    // 这是消除顶部白条的根因修复——Capacitor 8 的 BridgeActivity 默认不让 WebView
    // 延伸到状态栏后面，必须通过此插件在运行时/初始化时显式启用 overlay。
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
  },
}

export default config
