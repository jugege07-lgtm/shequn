<template>
  <el-container class="admin-layout">
    <!-- Sidebar -->
    <el-aside width="240px" class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-inner">
        <!-- Logo -->
        <div class="logo" @click="isCollapsed = !isCollapsed">
          <div class="logo-icon">
            <el-icon :size="22"><Share /></el-icon>
          </div>
          <span class="logo-text" :class="{ hidden: isCollapsed }">聚格软件管理</span>
        </div>

        <!-- Menu -->
        <el-menu
          :default-active="currentRoute"
          router
          :collapse="isCollapsed"
          :collapse-transition="false"
          class="nav-menu"
        >
          <el-menu-item v-if="menuVisible(['admin','editor','moderator','operator'])" index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>数据看板</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin'])" index="/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor','moderator','operator'])" index="/activities">
            <el-icon><Calendar /></el-icon>
            <template #title>活动管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor','moderator','operator'])" index="/businesses">
            <el-icon><Connection /></el-icon>
            <template #title>商机管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor'])" index="/products">
            <el-icon><Goods /></el-icon>
            <template #title>商品管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/orders">
            <el-icon><List /></el-icon>
            <template #title>订单管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/vip">
            <el-icon><TrophyBase /></el-icon>
            <template #title>VIP管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/notifications">
            <el-icon><Bell /></el-icon>
            <template #title>消息管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/banners">
            <el-icon><Picture /></el-icon>
            <template #title>Banner管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/coupons">
            <el-icon><Ticket /></el-icon>
            <template #title>优惠券管理</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor'])" index="/category-management">
            <el-icon><Notebook /></el-icon>
            <template #title>商机分类</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor'])" index="/product-category-management">
            <el-icon><GoodsFilled /></el-icon>
            <template #title>商品分类</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/points/rules">
            <el-icon><Coin /></el-icon>
            <template #title>积分规则</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','operator'])" index="/points/logs">
            <el-icon><Document /></el-icon>
            <template #title>积分明细</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin','editor','moderator','operator'])" index="/bigscreen">
            <el-icon><Monitor /></el-icon>
            <template #title>数据大屏</template>
          </el-menu-item>
          <el-menu-item v-if="menuVisible(['admin'])" index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>系统设置</template>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>

    <!-- Right side -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <span class="breadcrumb">{{ breadcrumb }}</span>
        </div>
        <div class="header-right">
          <!-- Theme Toggle -->
          <el-tooltip :content="themeStore.isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
            <el-icon class="theme-toggle" @click="themeStore.toggle()">
              <component :is="themeStore.isDark ? 'Sunny' : 'Moon'" />
            </el-icon>
          </el-tooltip>
          <!-- User -->
          <el-dropdown>
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span>{{ currentUserName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/store/theme'
import { menuVisible, getAdminUser, clearAdminUser } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const currentRoute = computed(() => route.path)
const isCollapsed = computed(() => (route.query.collapsed as string) === '1')
const currentUserName = computed(() => getAdminUser()?.nickname || '管理员')
const breadcrumb = computed(() => {
  const map: Record<string, string> = {
    '/dashboard': '数据看板',
    '/users': '用户管理',
    '/activities': '活动管理',
    '/businesses': '商机管理',
    '/products': '商品管理',
    '/orders': '订单管理',
    '/vip': 'VIP管理',
    '/notifications': '消息管理',
    '/banners': 'Banner管理',
    '/coupons': '优惠券管理',
    '/category-management': '商机分类',
    '/product-category-management': '商品分类',
    '/points/rules': '积分规则',
    '/points/logs': '积分明细',
    '/settings': '系统设置',
  }
  return map[route.path] || '概览'
})

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_refreshToken')
  clearAdminUser()
  router.push('/login')
}
</script>

<style scoped>
/* ===== Layout ===== */
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

/* ===== Sidebar ===== */
.sidebar {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Logo */
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--sidebar-border);
  transition: all 0.3s;
  flex-shrink: 0;
}
.logo:hover {
  background: var(--sidebar-hover);
}
.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--sidebar-text);
  white-space: nowrap;
  transition: opacity 0.2s;
}
.logo-text.hidden {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Menu */
.nav-menu {
  flex: 1;
  border-right: none !important;
  background: transparent !important;
  padding: 8px 0;
}
.nav-menu:not(.el-menu--collapse) {
  width: 240px;
}
.nav-menu.el-menu--collapse {
  width: 76px;
}

/* Override Element Plus menu styles */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 10px;
  color: var(--sidebar-text);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
:deep(.el-menu-item:hover) {
  background: var(--sidebar-hover) !important;
  color: var(--primary);
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  color: inherit;
}

/* ===== Header ===== */
.header {
  height: 64px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  z-index: 50;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
}
.collapse-btn:hover {
  color: var(--primary);
}
.breadcrumb {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Theme Toggle */
.theme-toggle {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  padding: 6px;
  border-radius: 8px;
}
.theme-toggle:hover {
  color: var(--primary);
  background: var(--hover-bg);
}

/* User */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover {
  background: var(--hover-bg);
}

/* ===== Main Content ===== */
.main-content {
  background: var(--page-bg);
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>
