# 更新日志

## v2.0 (2026-08-09) — MySQL 数据库版本

### 重大变更
- **数据库切换为 MySQL**：Prisma `provider` 从 SQLite 切换到 `mysql`，已兼容 MySQL 5.7+ / 8.0
- README 顶部新增 v2.0 版本说明，修正 1.1 节与 8.1 节中"SQLite 描述"为"MySQL 5.7+ / 8.0"

### 新增
- 数据大屏公开接口 `GET /api/public/big-screen` 与 `GET /api/public/recent-activities`
- 数据大屏前端：mock / real 数据源切换、左上角时间切换按钮、首访引导弹窗
- 管理端菜单"分类管理"拆分为**商机分类** / **商品分类** 两个独立子项
- 后端 `getProductCategories` 支持 keyword 搜索、返回 `_count.products`，create/update 增加名称唯一性校验，delete 前校验关联商品数

### 优化
- 管理端数据大屏：去除"演示数据"字眼，KPI 卡片默认展示真实数据
- 移动端首页"活动报名"卡片主图：统一使用 `<img>` + 错误回退，与列表页一致
- 移动端商机列表：分类数据源与后端对齐，切换分类时增加竞态保护与空态提示

### 清理
- 删除后端 `scripts/` 全部 9 个临时/一次性脚本
- 删除后端根目录 `check-db.js`、`reset-admin.js`、`reset-admin-pwd.js`、`reset_admin.sql`
- 删除 `prisma/fix_schema.sql`、`prisma/seed-test-data.ts`、`prisma/dev.db`
- 删除 mobile 零引用 `utils/storage.ts`、`utils/auth.ts`、`assets/global.scss`
- 删除 admin 零引用 `layouts/BlankLayout.vue`、`views/mall/CategoryManagement.vue`
- 删除根目录早期 demo HTML：`activity-signup.html`、`business-list.html`、`bigscreen-v2.html`、`bigscreen-v3.html`

### 兼容性
- 后端 `payment_wx_*` 等微信支付字段保留（仅 Mock 实现，未真实接入）
- 现有 API 路径、响应格式 (`{ code, data }`) 保持不变
- 移动端 `uni.setStorageSync('token')`、管理端 `localStorage('admin_token')` 认证方式不变
