<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

onMounted(async () => {
  // 仅原生 App 有状态栏（H5 跳过，不影响浏览器表现）
  if (!Capacitor.isNativePlatform()) return
  try {
    // 核心：让 WebView 延伸到状态栏后面（overlay=true）。
    // 这是 Capacitor 官方控制 WebView 是否覆盖状态栏的方式，在 JS 运行时
    // （WebView 创建后）执行，不会被 BridgeActivity.onCreate 内部的
    // setDecorFitsSystemWindows 覆盖。
    // 配合 index.html viewport-fit=cover，env(safe-area-inset-top) 可正确取到
    // 状态栏高度，页面顶部背景（首页紫色 banner / 各页白色 header）铺满状态栏区域，
    // 消除状态栏与页面之间的白条。
    await StatusBar.setOverlaysWebView({ overlay: true })
    // 浅色背景→深色图标：大多数页面顶部为白色 header，深色图标可见
    await StatusBar.setStyle({ style: Style.Light })
  } catch (e) {
    console.warn('StatusBar 配置失败:', e)
  }
})
</script>
