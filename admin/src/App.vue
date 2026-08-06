<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
/* ===== Global CSS Variables ===== */
:root,
[data-theme="light"] {
  /* Primary palette */
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;

  /* Text */
  --text-primary: #1e1b4b;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;

  /* Sidebar */
  --sidebar-bg: #f8f9fc;
  --sidebar-text: #4a5568;
  --sidebar-text-active: #6366f1;
  --sidebar-hover: rgba(99, 102, 241, 0.08);
  --sidebar-border: rgba(0, 0, 0, 0.06);

  /* Header */
  --header-bg: #ffffff;
  --header-border: #e5e7eb;

  /* Page */
  --page-bg: #f0f2f5;
  --hover-bg: rgba(0, 0, 0, 0.03);

  /* Card */
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);

  /* Success / Warning / Danger */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

/* ===== Dark Theme ===== */
[data-theme="dark"] {
  --primary: #818cf8;
  --primary-light: #a5b4fc;
  --primary-dark: #6366f1;
  --primary-50: #1e1b4b;
  --primary-100: #312e81;

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;

  --sidebar-bg: #1e293b;
  --sidebar-text: #94a3b8;
  --sidebar-text-active: #a5b4fc;
  --sidebar-hover: rgba(129, 140, 248, 0.12);
  --sidebar-border: rgba(255, 255, 255, 0.06);

  --header-bg: #1e293b;
  --header-border: rgba(255, 255, 255, 0.08);

  --page-bg: #0f172a;
  --hover-bg: rgba(255, 255, 255, 0.04);

  --card-bg: #1e293b;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.4);

  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
}

/* ===== Global Reset ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Body background follows theme */
body {
  background: var(--page-bg);
  color: var(--text-primary);
  transition: background 0.3s, color 0.3s;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Element Plus overrides for dark theme */
[data-theme="dark"] .el-menu {
  background-color: transparent !important;
}
[data-theme="dark"] .el-popper {
  --el-popover-bg-color: #1e293b;
  --el-text-color-primary: #f1f5f9;
}
[data-theme="dark"] .el-dropdown-menu {
  background-color: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme="dark"] .el-dropdown-menu__item {
  color: #94a3b8;
}
[data-theme="dark"] .el-dropdown-menu__item:hover {
  background-color: rgba(129, 140, 248, 0.12);
  color: #a5b4fc;
}
[data-theme="dark"] .el-divider {
  --el-border-color: rgba(255, 255, 255, 0.08);
}
</style>
