# 社群资源对接名片小程序

> **当前版本：v2.0 — MySQL 数据库版本（App 打包 v1.0.6）**
>
> 2.0 在 1.0 基础上完成以下关键升级：
> - **数据库切换为 MySQL**（Prisma `provider = "mysql"`，已支持 `MySQL 5.7+ / 8.0`）
> - 全新 **数据大屏**（公开接口 `GET /api/public/big-screen`、`GET /api/public/recent-activities`）
> - 管理端 **商机分类 / 商品分类** 拆分管理
> - 项目代码清理：移除冗余脚本、测试数据与早期 demo
> - 移动端若干体验优化（封面回退、空态、错误拦截）
>
> 部署 MySQL 步骤详见本文档 [九、部署说明](#九部署说明)。

> 本文档基于项目实际代码（`backend` / `admin` / `mobile`）与 `README_V2.md` 的功能描述整理，已同步修正代码中已变更或废弃的内容。

---

## 🚀 快速了解（30 秒看完）

**这是什么？** 社群资源对接平台：活动报名、商机大厅、会员商城、个人名片、消息通知、积分/优惠券。

**技术栈一览**

| 端 | 技术 |
|---|---|
| 📱 移动端 | Vue 3 + Vite + **Capacitor 8**（一套代码 → H5 网页 + 安卓 APK） |
| 🖥️ 管理后台 | Vue 3 + Element Plus + ECharts |
| ⚙️ 后端 | NestJS (Node.js) + Prisma ORM |
| 🗄️ 数据库 | MySQL 8.0 |

**三大目录**

```
backend/  NestJS 后端（API + 数据库 + 上传）
admin/    管理后台（PC 网页）
mobile/   移动端（H5 + 安卓 APK 打包）
```

**三行命令跑起来**

```bash
# 后端（端口 3000）
cd backend && cp .env.example .env && npm install && npx prisma db push && npm run start:dev

# 管理后台（端口 5173）
cd admin && npm install && npm run dev

# 移动端 H5（端口 5175）
cd mobile && npm install && npm run dev
```

**生产环境**：腾讯云 CVM（Ubuntu 22.04）+ PM2 + Caddy + 本地 MySQL；`git push main` → GitHub Actions 自动构建部署（H5 / 后台 / APK 一条龙）。

**⚠️ 上线商用前必读**：支付是 Mock、短信验证码固定 `1234`、图片存在服务器本地（详见文末"注意事项"）。

详细文档见下方：技术栈与结构 → 快速启动 → 用户体系 → 核心功能模块 → 管理后台 → 移动端 → API 规范 → 部署说明。

---

## 一、项目概述

社群商业对接小程序，面向社群成员提供：活动报名、商机大厅、会员商城、个人商业名片、消息通知、积分/优惠券等能力。

### 1.1 技术栈

| 端 | 技术 | 备注 |
|---|---|---|
| 移动端 | **Vue 3 + Vite + Capacitor 8**（TypeScript） | 同一套代码：H5 网页（history 路由）+ 打包安卓 APK；API 用 axios 封装 |
| PC 管理后台 | **Vue 3 + Element Plus + Vite + ECharts + Pinia** | 通过 RESTful API 调用后端服务；ECharts 用于数据大屏 |
| 后端 | **NestJS** (Node.js 18+，生产 20 LTS) | RESTful API，JWT 鉴权，模块化架构 |
| 数据库 | **MySQL 5.7+ / 8.0**（v2.0 切换） | Prisma ORM，`.env` 中 `DATABASE_URL` 指向 MySQL |
| 文件存储 | **本地磁盘** | 图片上传到 `backend/uploads`，返回完整 URL |
| 短信 | **腾讯云 SMS SDK** | 注册 / 修改支付密码验证码（当前 Mock，固定 `1234`） |
| 支付 | **Mock 支付** | 未接入真实微信支付/支付宝，仅返回模拟调起参数 |
| 加密 | **crypto-js** | 用户手机号 AES 加密存储 |
| 缓存/Redis | **未接入业务** | `ioredis` 依赖已装，但业务代码未调用 |

### 1.2 项目结构

```
shequn/
├── backend/      # NestJS 后端（MySQL + Prisma）
│   ├── src/
│   │   ├── modules/       # 业务模块
│   │   ├── common/        # 守卫、装饰器、拦截器、Prisma
│   │   └── app.module.ts
│   ├── prisma/schema.prisma
│   ├── uploads/           # 上传的图片（本地磁盘存储，生产在服务器上）
│   └── .env               # 环境变量（数据库连接、JWT、短信密钥等，勿提交）
├── admin/        # Vue 3 + Element Plus 管理后台
│   └── src/views/...     # 页面视图
├── mobile/       # Vue 3 + Vite + Capacitor 8 移动端
│   ├── src/views/...     # 业务页面（H5 history 路由）
│   ├── src/api/index.ts  # API 封装（axios）
│   ├── android/          # Capacitor 安卓原生工程（APK 打包）
│   └── capacitor.config.ts # Capacitor 配置
├── deploy/       # 生产部署配置（Caddy 站点、部署脚本）
└── README.md     ← 本文档
```

---

## 二、快速启动

> 以下命令在项目根目录执行，无需先 `cd` 到 Windows 盘符路径。

### 2.1 后端 API（默认端口 3000）

```bash
cd backend
cp .env.example .env   # 首次需要：填写 DATABASE_URL、JWT_SECRET 等
npm install
npx prisma db push     # 同步数据库表结构
npm run start:dev
```

启动后访问：http://localhost:3000/api/docs（Swagger 文档）

### 2.2 管理后台（默认端口 5173）

```bash
cd admin
npm install
npm run dev
```

访问：http://localhost:5173

### 2.3 移动端（H5 预览 / 安卓打包）

```bash
cd mobile
npm install

# H5 开发预览（默认端口 5175，后端代理到 localhost:3000）
npm run dev

# 构建 H5 产物（部署到服务器 /h5/）
npm run build

# 打包安卓 APK（需要本地 Android SDK / Android Studio）
npx cap sync android   # 同步 web 产物到安卓工程
npx cap open android   # 打开 Android Studio 构建 APK
```

---

## 三、用户体系与鉴权

### 3.1 用户模型（Prisma `User`）

```prisma
model User {
  id            Int      @id @default(autoincrement())
  openid        String   @unique
  unionId       String?
  sessionKey    String?
  nickname      String   @default("")
  avatarUrl     String   @default("")
  phone         String?
  gender        Int      @default(0)   // 0:未知 1:男 2:女
  role          String   @default("user")
  adminLevel    Int      @default(0)
  vipLevel      Int      @default(0)
  vipExpireAt   DateTime?
  status        String   @default("normal")   // normal / disabled / deleted
  lastLoginAt   DateTime?
  password      String   @default("")
  points        Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.2 角色设计

与 V2 文档不同，当前实现使用**逗号分隔的多角色字符串**，预定义角色为：

```typescript
// backend/src/modules/admin/admin.service.ts
static readonly VALID_ROLES = ['user', 'editor', 'moderator', 'operator', 'admin'];
```

- 普通用户：`role = "user"`
- 管理后台准入：只要 `role` 包含 `"admin"` 即可通过 `@Roles('admin')` + `RolesGuard`
- `adminLevel` 字段保留，但当前未按 level 细分权限

### 3.3 关键函数

```typescript
// AuthService
async wechatLogin(dto: LoginDto): Promise<{ accessToken, refreshToken, user }>
async phoneLogin(dto: LoginDto): Promise<{ accessToken, refreshToken, user }>
async register(dto: RegisterDto): Promise<{ accessToken, refreshToken, user }>
async adminLogin(dto: AdminLoginDto): Promise<{ accessToken, refreshToken, user }>
async phonePasswordLogin(dto: PhonePasswordLoginDto): Promise<{ ... }>
async refreshToken(refreshToken: string): Promise<{ accessToken }>
async sendCode(phone: string): Promise<{ success, message, phone }>

// UserService
async findByOpenid(openid: string): Promise<User | null>
async findById(id: number): Promise<User | null>
async createOrUpdate(openid: string, data: { nickname?, avatarUrl?, unionId?, phone?, role?, adminLevel?, password? }): Promise<User>
async updateProfile(userId: number, data: { nickname?, avatarUrl?, phone?, gender? }): Promise<User>
encryptPhone(phone: string): string
decryptPhone(encrypted: string): string

// AdminService（角色管理）
validateRoles(roles: string | string[] | undefined): string[]
async updateUserRoles(targetUserId: number, operatorId: number, roles: string[]): Promise<any>
```

### 3.4 认证接口

| 方法 | 路径 | 函数 | 说明 |
|---|---|---|---|
| POST | `/api/auth/wechat-login` | `wechatLogin(dto: LoginDto)` | 微信登录（当前移动端主要使用手机号登录） |
| POST | `/api/auth/phone-login` | `phoneLogin(dto: LoginDto)` | 手机号登录（演示环境手机号写死） |
| POST | `/api/auth/register` | `register(dto: RegisterDto)` | 注册并同步创建名片 |
| POST | `/api/auth/admin-login` | `adminLogin(dto: AdminLoginDto)` | 管理后台登录 |
| POST | `/api/auth/refresh` | `refreshToken(refreshToken: string)` | 刷新 Token |
| POST | `/api/auth/phone-password-login` | `phonePasswordLogin(dto: PhonePasswordLoginDto)` | 手机号+密码登录 |
| POST | `/api/auth/send-code` | `sendCode(phone: string)` | 发送验证码（Mock，固定 1234） |

### 3.5 用户接口

| 方法 | 路径 | 函数 | 说明 |
|---|---|---|---|
| GET | `/api/users/me` | `getCurrentUser(user)` | 当前用户信息 |
| PUT | `/api/users/profile` | `updateProfile(user, dto: UpdateProfileDto)` | 更新资料 |
| GET | `/api/users/addresses` | `getAddresses(user)` | 收货地址列表 |
| POST | `/api/users/addresses` | `createAddress(user, dto: AddressDto)` | 新增地址 |
| PUT | `/api/users/addresses/:id` | `updateAddress(user, id, dto)` | 编辑地址 |
| DELETE | `/api/users/addresses/:id` | `deleteAddress(user, id)` | 删除地址 |
| PUT | `/api/users/addresses/:id/default` | `setDefaultAddress(user, id)` | 设为默认地址 |

---

## 四、核心功能模块

### 4.1 活动模块

#### 4.1.1 数据模型

```prisma
model Activity {
  id              Int      @id @default(autoincrement())
  title           String
  coverImage      String
  description     String
  images          String?  @default("[]")
  type            String
  price           Float    @default(0)
  location        String
  latitude        Float?
  longitude       Float?
  startTime       DateTime
  endTime         DateTime
  maxParticipants Int?
  signupCount     Int      @default(0)
  status          String   @default("pending")   // pending / approved / rejected / full / ended / cancelled
  rejectReason    String   @default("")
  publisherId     Int
  thumbnail       String   @default("")
  signups         ActivitySignup[]
}

model ActivitySignup {
  id          Int       @id @default(autoincrement())
  activityId  Int
  userId      Int
  status      String    @default("confirmed")   // confirmed / cancelled / checked_in
  paidAmount  Float     @default(0)
  orderNo     String
  checkedInAt DateTime?
  createdAt   DateTime  @default(now())
}
```

#### 4.1.2 关键函数

```typescript
// ActivityService
async getPublicActivities(params?: { page?: number; size?: number; filter?: string }): Promise<{ list, total, page, size }>
async createActivity(dto: CreateActivityDto, publisherId: number): Promise<Activity>
async getActivityDetail(id: number): Promise<Activity | null>
async getMyActivities(userId: number, params?: { page?: number; size?: number }): Promise<{ list, total, page, size }>
async getSignedActivities(userId: number, params?: { page?: number; size?: number }): Promise<{ list, total, page, size }>
async signupActivity(activityId: number, userId: number): Promise<ActivitySignup>
async verifySignup(activityId: number, token: string, userId: number): Promise<any>

// AdminService
async getActivities(params: { page?, size?, status? }): Promise<any>
async approveActivity(id: number): Promise<Activity>
async rejectActivity(id: number, reason?: string): Promise<Activity>
async createActivity(dto: any): Promise<Activity>
async updateActivity(id: number, dto: any): Promise<Activity>
async deleteActivity(id: number): Promise<Activity>
async generateActivityVerifyQrCode(activityId: number): Promise<{ activityId, verifyUrl, qrDataUrl, filename }>
async exportActivitySignups(activityId: number): Promise<{ filename, content }>
```

#### 4.1.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/activities` | 公开活动列表 | 公开 |
| GET | `/api/public/activities/:id` | 活动详情 | 公开 |
| POST | `/api/activities` | 发布活动 | 登录 |
| GET | `/api/activities/my` | 我发布的活动 | 登录 |
| GET | `/api/activities/signed` | 我已报名的活动 | 登录 |
| POST | `/api/activities/:id/signup` | 报名活动 | 登录 |
| POST | `/api/activities/:id/verify` | 扫码核销报名 | 登录 |
| GET/POST/PUT/DELETE | `/api/admin/activities/*` | 管理端活动 CRUD / 审核 / 导出 / 核销二维码 | admin |

#### 4.1.4 DTO

```typescript
class CreateActivityDto {
  title: string;
  coverImage: string;
  description: string;
  images?: string;       // JSON 字符串
  type: string;
  price?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;     // ISO 8601
  endTime: string;
  maxParticipants?: number;
  requestId?: string;    // 幂等
}
```

---

### 4.2 商机模块

#### 4.2.1 数据模型

```prisma
model BusinessCategory {
  id         Int        @id @default(autoincrement())
  name       String
  code       String     @unique
  icon       String     @default("")
  sortOrder  Int        @default(0)
  status     Int        @default(1)
  createdAt  DateTime   @default(now())
  businesses Business[]
}

model Business {
  id             Int              @id @default(autoincrement())
  title          String
  coverImage     String
  description    String
  categoryId     Int
  contactName    String
  contactPhone   String           @default("")
  contactWechat  String           @default("")
  unlockFee      Float            @default(0)
  maxUnlocks     Int              @default(3)
  currentUnlocks Int              @default(0)
  status         String           @default("pending")
  rejectReason   String           @default("")
  publisherId    Int
  unlocks        BusinessUnlock[]
}

model BusinessUnlock {
  id         Int      @id @default(autoincrement())
  businessId Int
  userId     Int
  feePaid    Float
  orderNo    String
  createdAt  DateTime @default(now())
}
```

#### 4.2.2 关键函数

```typescript
// BusinessService
async getPublicBusinesses(params?: { page?: number; size?: number; status?: string }): Promise<{ list, total, page, size }>
async getBusinessCategories(): Promise<{ id, name, sortOrder }[]>
async createBusiness(dto: CreateBusinessDto, publisherId: number): Promise<Business>
async getBusinessDetail(id: number): Promise<Business | null>
async unlockBusiness(businessId: number, userId: number): Promise<BusinessUnlock>
async getMyBusinesses(userId: number, params?: { page?: number; size?: number }): Promise<{ list, total, page, size }>

// AdminService
async getBusinesses(params): Promise<any>
async approveBusiness(id: number): Promise<Business>
async rejectBusiness(id: number, reason?: string): Promise<Business>
async createBusiness(dto): Promise<Business>
async updateBusiness(id: number, dto): Promise<Business>
async toggleBusinessStatus(id: number, status?: string): Promise<Business>
async deleteBusiness(id: number): Promise<Business>
```

#### 4.2.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/businesses` | 商机列表 | 公开 |
| GET | `/api/public/businesses/:id` | 商机详情 | 公开 |
| GET | `/api/public/business-categories` | 商机分类 | 公开 |
| POST | `/api/businesses` | 发布商机 | 登录 |
| POST | `/api/businesses/:id/unlock` | 解锁商机 | 登录 |
| GET | `/api/businesses/my` | 我的商机 | 登录 |
| GET/POST/PUT/DELETE | `/api/admin/businesses/*` | 管理端商机 CRUD / 审核 | admin |
| GET/POST/PUT/DELETE | `/api/admin/business-category-list/*` | 商机分类管理 | admin |

#### 4.2.4 DTO

```typescript
class CreateBusinessDto {
  title: string;
  coverImage?: string;
  description: string;
  categoryId: number;
  contactName: string;
  contactPhone?: string;
  contactWechat?: string;
  unlockFee?: number;     // 0 为免费
  maxUnlocks?: number;    // 默认 3，范围 1-100
}
```

---

### 4.3 商城 / 购物车 / 订单模块

> 代码中对应 `backend/src/modules/product`（含 `cart.controller.ts` / `cart.service.ts`）。

#### 4.3.1 数据模型

```prisma
model ProductCategory {
  id        Int       @id @default(autoincrement())
  name      String
  parentId  Int?      @default(0)
  icon      String    @default("")
  sortOrder Int       @default(0)
  status    Int       @default(1)
  products  Product[]
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  coverImage  String
  images      String?  @default("[]")
  description String
  categoryId  Int
  price       Float
  vipPrice    Float    @default(0)
  stock       Int      @default(0)
  salesCount  Int      @default(0)
  specs       String?  @default("{}")
  status      Int      @default(1)
}

model CartItem {
  id        Int      @id @default(autoincrement())
  userId    Int
  productId Int
  quantity  Int      @default(1)
  specs     String?  @default("{}")
}

model Order {
  id              Int         @id @default(autoincrement())
  orderNo         String      @unique
  userId          Int
  totalAmount     Float
  discountAmount  Float       @default(0)
  payAmount       Float
  status          String      @default("pending_payment")
  addressId       Int?
  shippingNo      String      @default("")
  shippingCompany String      @default("")
  remark          String      @default("")
  paidAt          DateTime?
  shippedAt       DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  items           OrderItem[]
  refund          Refund?
}

model OrderItem {
  id           Int      @id @default(autoincrement())
  orderId      Int
  productId    Int
  productName  String
  productImage String   @default("")
  price        Float
  quantity     Int
  specs        String?  @default("{}")
}

model Refund {
  id           Int       @id @default(autoincrement())
  orderId      Int       @unique
  userId       Int
  refundAmount Float
  reason       String
  images       String?   @default("[]")
  status       String    @default("pending")
  adminNote    String    @default("")
  processedAt  DateTime?
}
```

#### 4.3.2 关键函数

```typescript
// ProductService
async getPublicCategories(): Promise<ProductCategory[]>
async getPublicProducts(params?: { page?: number; size?: number; category?: string }): Promise<{ list, total, page, size }>
async getProduct(id: number): Promise<Product | null>
async createOrder(dto: CreateOrderDto, userId: number): Promise<Order>
async createOrderFromCart(dto: CreateOrderFromCartDto, userId: number): Promise<Order>
async getMyOrders(userId: number, params?: { page?: number; size?: number; status?: string }): Promise<{ list, total, page, size }>
async getOrder(userId: number, id: number): Promise<Order>
async payOrder(userId: number, id: number): Promise<Order>        // 模拟支付成功
async completeOrder(userId: number, id: number): Promise<Order>

// CartService
async getCart(userId: number): Promise<CartItem[]>
async addToCart(userId: number, productId: number, quantity = 1, specs?: any): Promise<CartItem>
async updateQuantity(userId: number, cartItemId: number, quantity: number): Promise<CartItem | void>
async remove(userId: number, cartItemId: number): Promise<CartItem>
async clear(userId: number): Promise<Prisma.BatchPayload>

// AdminService
async getOrders(params): Promise<any>
async getOrderDetail(id: number): Promise<Order>
async shipOrder(id: number, shippingNo: string, shippingCompany: string): Promise<Order>
async approveRefund(id: number): Promise<any>
async rejectRefund(id: number, reason: string): Promise<any>
```

#### 4.3.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/product-categories` | 商品分类 | 公开 |
| GET | `/api/public/products` | 商品列表 | 公开 |
| GET | `/api/public/products/:id` | 商品详情 | 公开 |
| GET | `/api/cart` | 我的购物车 | 登录 |
| POST | `/api/cart` | 加入购物车 | 登录 |
| PUT | `/api/cart/:id` | 修改数量 | 登录 |
| DELETE | `/api/cart/:id` | 删除购物车项 | 登录 |
| DELETE | `/api/cart/clear/all` | 清空购物车 | 登录 |
| POST | `/api/orders` | 立即购买创建订单 | 登录 |
| POST | `/api/orders/from-cart` | 购物车结算 | 登录 |
| GET | `/api/orders/my` | 我的订单 | 登录 |
| GET | `/api/orders/:id` | 订单详情 | 登录 |
| PUT | `/api/orders/:id/pay` | 支付订单（模拟） | 登录 |
| PUT | `/api/orders/:id/complete` | 确认收货 | 登录 |
| GET/PUT | `/api/admin/orders/*` | 订单管理 / 发货 / 退款审批 | admin |

#### 4.3.4 DTO

```typescript
class CreateOrderDto {
  productId: number;
  quantity: number;
  addressId?: number;
  requestId?: string;
  remark?: string;
}

class CreateOrderFromCartDto {
  cartItemIds: number[];
  addressId?: number;
  remark?: string;
}

class AddCartDto {
  productId: number;
  quantity?: number;
  specs?: any;
}
```

---

### 4.4 VIP 会员模块

#### 4.4.1 数据模型

```prisma
model VipPlan {
  id            Int               @id @default(autoincrement())
  name          String
  level         Int
  durationDays  Int
  originalPrice Float
  currentPrice  Float
  discountRate  Float             @default(1)
  description   String
  features      String            @default("[]")
  status        Int               @default(1)
  sortOrder     Int               @default(0)
}

model VipSubscription {
  id        Int      @id @default(autoincrement())
  userId    Int
  planId    Int
  orderNo   String
  payAmount Float
  startAt   DateTime
  expireAt  DateTime
  status    String   @default("active")
}
```

#### 4.4.2 关键函数

```typescript
// VipService
async getPlans(): Promise<VipPlan[]>
async subscribe(userId: number, planId: number): Promise<VipSubscription>
async getSubscriptions(userId: number): Promise<VipSubscription[]>
```

#### 4.4.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/vip/plans` | VIP 套餐列表 | 公开 |
| POST | `/api/vip/subscribe` | 订阅 VIP | 登录 |
| GET | `/api/vip/subscriptions` | 我的订阅记录 | 登录 |
| GET/POST/PUT/DELETE | `/api/admin/vip-plans/*` | 管理端套餐 CRUD | admin |

---

### 4.5 个人名片模块

#### 4.5.1 数据模型

```prisma
model UserCard {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  realName    String
  company     String   @default("")
  position    String   @default("")
  wechat      String   @default("")
  email       String   @default("")
  avatarUrl   String
  bgImageUrl  String?  @map("background_url")
  intro       String   @default("")
  tags        String?  @default("{}")
  socialLinks String?  @default("{}") @map("social_links")
  qrcodeUrl   String?
  viewCount   Int      @default(0)
  status      Int      @default(1)
}
```

#### 4.5.2 关键函数

```typescript
// CardService
async getPublicCard(cardId: number): Promise<any>
async getMyCard(userId: number): Promise<UserCard>
async updateCard(userId: number, data: Record<string, any>): Promise<UserCard>
async getQrcodeBase64(cardId: number): Promise<string>   // Base64 PNG / SVG 兜底
async getShareCard(cardId: number): Promise<string>
```

#### 4.5.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/cards/:id` | 公开名片详情 | 公开 |
| GET | `/api/public/cards/:id/share` | 名片分享数据（含二维码） | 公开 |
| GET | `/api/cards/me` | 我的名片 | 登录 |
| PUT | `/api/cards/me` | 创建/编辑名片 | 登录 |
| GET | `/api/cards/me/qrcode` | 我的名片二维码 | 登录 |

---

### 4.6 消息模块

#### 4.6.1 数据模型

```prisma
model Message {
  id        Int       @id @default(autoincrement())
  userId    Int
  type      String    // system / activity / business / order / vip / notification
  title     String
  content   String
  data      String?   @default("{}")
  isRead    Int       @default(0)
  readAt    DateTime?
  createdAt DateTime  @default(now())
}
```

#### 4.6.2 关键函数

```typescript
// MessageService
async getMessages(userId: number, params?: { page?: number; size?: number }): Promise<{ list, total, page, size }>
async markRead(messageId: number, userId: number): Promise<Message>
async getUnreadCount(userId: number): Promise<{ count: number }>
```

#### 4.6.3 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/messages` | 消息列表 | 登录 |
| PUT | `/api/messages/:id/read` | 标记已读 | 登录 |
| GET | `/api/messages/unread-count` | 未读数 | 登录 |
| GET/POST | `/api/admin/notifications/*` | 管理端发送通知 | admin |

---

### 4.7 支付模块

> 当前为 **Mock 实现**，未接入真实微信支付/支付宝，仅用于前端调起流程演示。

```typescript
// PaymentService
async getPaymentConfig(): Promise<PaymentConfig>
async validateConfig(): Promise<{ valid: boolean; message: string }>
async createUnifiedOrder(params: { orderNo: string; amount: number; description: string; channel?: string }): Promise<any>
async handleNotify(channel: string, body: any): Promise<{ code, message }>
```

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/payment/unified-order` | 创建统一支付订单（返回 mock 参数） | 登录 |
| GET/PUT/POST | `/api/admin/payment-config/*` | 支付配置管理 | admin |

---

### 4.8 上传模块

```typescript
// UploadController
@Post()
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File)

// UploadService.saveFile(file)
```

- 文件保存到 `backend/uploads/`
- 返回完整 URL：`http://localhost:3000/uploads/...`，支持 `UPLOAD_BASE_URL` 环境变量覆盖

---

### 4.9 内容 / 公开接口模块

```typescript
// ContentController
@Get('public/homepage')          getHomepage()
@Get('public/announcements')    getPublicAnnouncements()
@Get('public/banners')          getPublicBanners(position?: string)
@Get('public/sections')         getPublicSections()

// VersionController
@Get('public/version/check')    checkUpdate(platform: string, versionCode: string)
```

管理端对应页面：Banner 管理、公告管理、版本管理、系统配置（`SystemConfig` 表 `key/value`）。

---

### 4.10 优惠券与积分模块

> V2 文档未涉及，代码中已实现。

| 模块 | 关键模型 | 管理端页面 |
|---|---|---|
| 优惠券 | `Coupon` / `UserCoupon` | `admin/src/views/coupons/Index.vue` |
| 积分 | `PointRule` / `PointLog` | `admin/src/views/points/Index.vue`、`Logs.vue` |

公开/用户接口：

- `GET /api/public/coupons` / `GET /api/public/coupons/:id`
- `POST /api/coupons/claim/:id` / `GET /api/coupons/my`
- `GET /api/public/point-rules` / `GET /api/points/my` / `GET /api/points/my/logs`

管理端接口：

- `GET/POST/PUT/DELETE /api/admin/coupons/*`
- `GET/POST/PUT/DELETE /api/admin/point-rules/*`
- `GET /api/admin/point-logs`、`PUT /api/admin/points/adjust`

---

## 五、管理后台

### 5.1 页面清单

```
admin/src/views/
├── auth/Login.vue
├── dashboard/Overview.vue
├── bigscreen/Index.vue
├── users/UserList.vue
├── activities/ActivityList.vue、ActivityCreate.vue、ActivityDetail.vue
├── business/BusinessList.vue、BusinessCreate.vue、BusinessDetail.vue
├── mall/ProductList.vue、ProductCreate.vue、CategoryManagement.vue
├── orders/OrderList.vue
├── vip/VipPlanList.vue
├── banners/Index.vue
├── notifications/Index.vue
├── coupons/Index.vue
├── points/Index.vue、Logs.vue
└── settings/Index.vue
```

### 5.2 管理端接口前缀

所有管理端接口统一在 `/api/admin/*`，Controller 上加了：

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
```

### 5.3 用户管理（含角色）

| 方法 | 路径 | 关键函数 |
|---|---|---|
| GET | `/api/admin/users` | `getUsers(query)` |
| GET | `/api/admin/users/:id` | `getUserDetail(id)` |
| PUT | `/api/admin/users/:id` | `updateUser(id, dto)` |
| DELETE | `/api/admin/users/:id` | `deleteUser(id)` |
| PUT | `/api/admin/users/:id/disable` | `disableUser(id)` |
| PUT | `/api/admin/users/:id/enable` | `enableUser(id)` |
| PUT | `/api/admin/users/:id/password` | `changeUserPassword(id, password)` |
| GET | `/api/admin/roles` | `getSystemRoles()` → `VALID_ROLES` |
| PUT | `/api/admin/users/:id/roles` | `updateUserRoles(id, roles, operator)` |

---

## 六、移动端

> 移动端为 Vue 3 + Vite 单页应用（SPA），路由配置在 `mobile/src/router/index.ts`，部署在服务器 `/h5/` 子路径；同时通过 Capacitor 8 打包为安卓 APK。

### 6.1 页面路由（`mobile/src/views`）

```
├── index/index.vue          # 首页（Banner / 热门活动 / 通知）
├── login/index.vue          # 登录
├── register/index.vue       # 注册
├── forgot-password/index.vue# 忘记密码
├── about/index.vue          # 关于我们（富文本）
├── activity/list.vue        # 活动列表
├── activity/detail.vue      # 活动详情
├── activity/publish.vue     # 发布活动
├── activity/my.vue          # 我的报名
├── activity/verify.vue      # 扫码核销
├── business/list.vue        # 商机列表
├── business/detail.vue      # 商机详情
├── business/publish.vue     # 发布商机
├── business/my.vue          # 我的商机
├── opportunity/list.vue     # 商机大厅（分类筛选）
├── card/index.vue           # 我的名片
├── card/edit.vue            # 编辑名片
├── card/share.vue           # 名片分享页（无需登录）
├── card/friend.vue          # 好友 / 人脉
├── mall/index.vue           # 商城首页
├── mall/detail.vue          # 商品详情
├── cart/index.vue           # 购物车
├── order/confirm.vue        # 订单确认
├── order/list.vue           # 我的订单
├── order/detail.vue         # 订单详情
├── order/pay.vue            # 支付页
├── order/success.vue        # 支付成功
├── address/edit.vue         # 地址编辑
├── vip/index.vue            # VIP 会员
├── vip/pay.vue              # VIP 开通支付
├── message/index.vue        # 消息通知
├── coupon/index.vue         # 我的优惠券
├── coupon/claim.vue         # 领券中心
├── points/index.vue         # 积分
├── balance/index.vue        # 余额
├── history/index.vue        # 浏览历史
├── dajia/index.vue          # 大咖人脉
├── profile/index.vue        # 个人中心
├── setting/index.vue        # 设置
├── setting/pay-password.vue # 支付密码
├── app-download/index.vue   # App 下载页（APK 分发）
└── order/confirm.vue        # 订单确认
```

### 6.2 API 封装

移动端 API 统一封装在 `mobile/src/api/index.ts`，基于 `mobile/src/api/request.ts`（**axios** 实例封装，非 uni.request）。

约定（详见用户记忆中的 baseURL 规范）：
- 业务代码**显式带 `/api/` 前缀**（如 `request.get('/api/public/businesses')`）
- `baseURL = ''`（H5 与 APK 双端通用，由 Vite proxy / Caddy 统一转发到后端）

示例函数：

```typescript
export async function getActivities(params?: { page?: number; size?: number; filter?: string })
export async function signupActivity(activityId: number)
export async function getBusinesses(params?: { page?: number; size?: number; status?: string })
export async function unlockBusiness(id: number)
export async function getProducts(params?: { page?: number; size?: number; category?: string | number })
export async function createOrder(data: { productId: number; quantity: number; addressId?: number; remark?: string })
export async function createOrderFromCart(data: { cartItemIds: number[]; addressId?: number; remark?: string })
export async function payOrder(id: number)
export async function addToCart(data: { productId: number; quantity?: number; specs?: any })
export async function getMyCard()
export async function updateMyCard(data: Record<string, any>)
export async function getMyCardQrcode()
export async function subscribeVip(planId: number)
export async function getMessages(params?: { page?: number; size?: number })
export async function uploadFile(file: File)
```

---

## 七、API 规范

### 7.1 统一响应格式

```typescript
// 成功
{
  "code": 0,
  "message": "success",
  "data": { /* 业务数据 */ }
}

// 失败
{
  "code": 1001,
  "message": "参数校验失败",
  "data": null
}
```

### 7.2 鉴权

- 登录接口返回 `accessToken` 与 `refreshToken`
- 移动端（H5 / APK）：`localStorage.setItem('token', accessToken)`（见 `mobile/src/store/user.ts`）
- 管理端：`localStorage.setItem('admin_token', accessToken)`
- 受保护接口 Header：`Authorization: Bearer <accessToken>`

---

## 八、与 README_V2 文档的差异说明

### 8.1 已变更/废弃

| 项目 | README_V2 描述 | 当前代码（v2.0） |
|---|---|---|
| 数据库 | MySQL 8.0 | **MySQL 5.7+ / 8.0**（v2.0 已切换，schema.prisma `provider = "mysql"`） |
| 缓存 | Redis | 未接入业务 |
| 文件存储 | OSS | 本地上传 |
| 支付 | 微信支付真实对接 | Mock 支付，无真实签名/回调 |
| 消息推送 | 微信订阅消息 + 站内信 | 仅站内信 |
| 角色设计 | `role` 枚举 + `admin_level` + `admin_roles` 表 | 逗号分隔多角色字符串 `user,editor,moderator,operator,admin` |
| 用户端编辑活动/商机 | 有 `PUT /api/activities/:id` 等 | 未实现，仅管理端可编辑 |
| 用户端申请退款 | `POST /api/payment/refund` | 未实现，仅管理端有退款审批 |
| 订单超时自动取消 | 定时任务扫描 | 未实现 |
| 活动满员/结束自动状态 | `full` / `ended` | 未实现 |
| 头像墙独立接口 | `GET /api/activities/:id/avatars` | 未实现 |
| 健康检查 | `GET /api/health` | 未实现 |

### 8.2 已新增（V2 未描述）

- 活动核销：`POST /api/activities/:id/verify`、核销二维码生成、报名 CSV 导出
- 优惠券系统：创建/领取/使用/后台精准发放
- 积分系统：规则引擎、积分日志、手动调整
- 数据大屏：`GET /api/admin/big-screen`
- 版本检查：`GET /api/public/version/check`
- 首页内容管理：`HomeSection`、`Banner`、`Announcement`、`SystemConfig`
- 手机号 AES 加密：`UserService.encryptPhone/decryptPhone`
- Refresh Token 机制

### 8.3 接口路径差异汇总

| README_V2 路径 | 当前实际路径 |
|---|---|
| `GET /api/activities` | `GET /api/public/activities` |
| `GET /api/activities/:id` | `GET /api/public/activities/:id` |
| `GET /api/users/me/activities` | `GET /api/activities/signed` |
| `GET /api/businesses` | `GET /api/public/businesses` |
| `GET /api/businesses/:id` | `GET /api/public/businesses/:id` |
| `GET /api/business-categories` | `GET /api/public/business-categories` |
| `GET /api/products` | `GET /api/public/products` |
| `GET /api/product-categories` | `GET /api/public/product-categories` |
| `GET /api/users/me/orders` | `GET /api/orders/my` |
| `POST /api/orders/:id/pay` | `PUT /api/orders/:id/pay` |
| `GET /api/message-unread-count` | `GET /api/messages/unread-count` |
| `POST /api/payment/prepay` | `POST /api/payment/unified-order` |

---

## 九、部署说明

### 9.1 生产环境架构（当前线上）

生产部署在**腾讯云 CVM（Ubuntu 22.04）**，采用 **PM2 + Caddy + 本地 MySQL** 方案（非 docker）：

| 组件 | 作用 |
|---|---|
| **PM2** | 守护后端进程（`node dist/main`，端口 3000），崩溃自动重启 |
| **Caddy** | Web 服务器：自动 HTTPS；静态托管 `/admin`、`/h5`；`/api` 反向代理到后端 3000；提供 `/app/shequn.apk` 下载 |
| **MySQL 8.0** | 数据库 `community_card`（表结构用 `prisma db push` 同步） |
| **本地磁盘** | 上传图片存 `/home/ubuntu/shequn/backend/uploads` |

代码部署到服务器 `/home/ubuntu/shequn`。

### 9.2 CI 自动部署（推荐）

项目已配置 GitHub Actions（`.github/workflows/`），**push 到 main 分支即自动部署**：

- `ci.yml` — 构建 & 测试
- `deploy-prod.yml` — 打包源码 → SCP 到 CVM → `deploy/scripts/deploy.sh` 执行（npm install → build → `prisma db push` → PM2 重启）
- `build-apk.yml` — 构建安卓 APK → 上传 artifact → SCP 到服务器 `/home/ubuntu/shequn/deploy/app/shequn.apk`（下载页指向此文件）

### 9.3 手动部署（新服务器首次）

```bash
# 1. 服务器安装基础环境
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
# Caddy：https://caddyserver.com/docs/install
sudo apt install -y mysql-server

# 2. 拉取代码
cd /home/ubuntu && git clone https://github.com/jugege07-lgtm/shequn.git

# 3. 后端配置 + 启动
cd shequn/backend
cp .env.example .env && vim .env   # 必填：DATABASE_URL / JWT_SECRET / PHONE_ENCRYPT_KEY / ADMIN 账号密码
npm install
npx prisma db push                 # 同步表结构（本项目用 db push，不用 migrate dev）
npm run build
pm2 start dist/main.js --name shequn-backend

# 4. 前端构建
cd ../admin && npm install && npm run build   # 产物 dist → 服务器 /var/www/shequn/admin
cd ../mobile && npm install && npm run build  # 产物 dist → 服务器 /var/www/shequn/h5

# 5. 配置 Caddy（参考 deploy/nginx/shequn.conf 的对应规则）
#    - www.jugekeji.com/h5  → 移动端 H5
#    - www.jugekeji.com/admin → 管理后台
#    - api.jugekeji.com      → 后端 127.0.0.1:3000（或统一走主域 /api）
```

### 9.4 管理后台与移动端构建

```bash
# 管理后台（Vue3 + Vite）
cd admin
npm install
npm run build

# 移动端 H5（Vue3 + Vite）
cd mobile
npm install
npm run build

# 移动端安卓 APK（需 Android SDK / Android Studio）
cd mobile
npx cap sync android
npx cap open android   # Android Studio 中 Build → Build APK(s)
```

---

## 十、注意事项

1. **支付为 Mock**：`PaymentService.createUnifiedOrder` 未调用真实微信支付，生产接入需替换实现并配置回调地址。
2. **短信验证码为 Mock**：`sendCode` 固定返回 `1234`。
3. **商机解锁未扣费**：`BusinessService.unlockBusiness` 中 `feePaid` 写入 `0`。
4. **VIP 折扣未生效**：商城/商机解锁未根据 `vipLevel` / `discountRate` 计算价格。
5. **图片上传本地存储**：生产若使用 OSS，需替换 `UploadService.saveFile` 实现。
6. **角色管理安全**：`updateUserRoles` 保护最后一名管理员不被移除。

---

> **文档版本**: 基于代码同步更新  
> **更新日期**: 2026-08-13
