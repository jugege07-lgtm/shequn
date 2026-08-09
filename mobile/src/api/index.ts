import request from './request'

// ==================== 公开接口 ====================

export async function getHomepageData() {
  return request.get('/api/public/homepage')
}

export async function getAnnouncements() {
  return request.get('/api/public/announcements')
}

export async function getBanners(position?: string) {
  return request.get('/api/public/banners', { params: { position } })
}

export async function getHomeSections() {
  return request.get('/api/public/sections')
}

export async function checkAppVersion(platform: string, versionCode: number) {
  return request.get('/api/public/version/check', { params: { platform, versionCode } })
}

export async function getSystemConfig(key: string) {
  return request.get(`/api/public/config/${key}`)
}

export async function getPublicCard(id: number) {
  return request.get(`/api/public/cards/${id}`)
}

// ==================== 认证接口 ====================

export async function wechatLogin(code: string) {
  return request.post('/api/auth/wechat-login', { code })
}

export async function register(data: {
  phone: string
  code: string
  realName: string
  nickname?: string
  company?: string
  position?: string
  wechat?: string
  intro?: string
  avatarUrl?: string
}) {
  return request.post('/api/auth/register', data)
}

export async function login(data: { phone: string; password: string }) {
  return request.post('/api/auth/phone-password-login', data)
}

export async function sendCode(phone: string) {
  return request.post('/api/auth/send-code', { phone })
}

// ==================== 用户接口 ====================

export async function getCurrentUser() {
  return request.get('/api/users/me')
}

export async function updateProfile(data: { nickname?: string; avatarUrl?: string; phone?: string; gender?: number }) {
  return request.put('/api/users/profile', data)
}

// ==================== 名片接口 ====================

export async function getMyCard() {
  return request.get('/api/cards/me')
}

export async function updateMyCard(data: Record<string, any>) {
  return request.put('/api/cards/me', data)
}

export async function getMyCardQrcode() {
  return request.get('/api/cards/me/qrcode')
}

export async function getCardShare(id: number) {
  return request.get(`/api/public/cards/${id}/share`)
}

// ==================== 活动接口 ====================

export async function getActivities(params?: { page?: number; size?: number; filter?: string }) {
  return request.get('/api/public/activities', { params })
}

export async function getSignedActivities(params?: { page?: number; size?: number }) {
  return request.get('/api/activities/signed', { params })
}

export async function verifySignup(activityId: number, token: string) {
  return request.post(`/api/activities/${activityId}/verify`, { token })
}

export async function getActivityDetail(id: number) {
  return request.get(`/api/public/activities/${id}`)
}

export async function createActivity(data: Record<string, any>) {
  return request.post('/api/activities', data)
}

export async function signupActivity(activityId: number) {
  return request.post(`/api/activities/${activityId}/signup`)
}

export async function getActivitySignupStatus(activityId: number) {
  return request.get(`/api/activities/${activityId}/signup-status`)
}

export async function getMyActivities(params?: { page?: number; size?: number }) {
  return request.get('/api/activities/my', { params })
}

// ==================== 商机接口 ====================

export async function getBusinesses(params?: { page?: number; size?: number; status?: string; categoryId?: string | number }) {
  return request.get('/api/public/businesses', { params })
}

export async function getBusinessDetail(id: number) {
  return request.get(`/api/public/businesses/${id}`)
}

export async function getBusinessCategories() {
  return request.get('/api/public/business-categories')
}

export async function createBusiness(data: Record<string, any>) {
  return request.post('/api/businesses', data)
}

export async function unlockBusiness(id: number) {
  return request.post(`/api/businesses/${id}/unlock`)
}

export async function getBusinessUnlockStatus(id: number) {
  return request.get(`/api/businesses/${id}/unlock-status`)
}

export async function getMyBusinesses(params?: { page?: number; size?: number }) {
  return request.get('/api/businesses/my', { params })
}

// ==================== 商城接口 ====================

export async function getProductCategories() {
  return request.get('/api/public/product-categories')
}

export async function getProducts(params?: { page?: number; size?: number; category?: string | number }) {
  return request.get('/api/public/products', { params })
}

export async function getProduct(id: number) {
  return request.get(`/api/public/products/${id}`)
}

export async function createOrder(data: { productId: number; quantity: number; addressId?: number; remark?: string }) {
  return request.post('/api/orders', data)
}

export async function createOrderFromCart(data: { cartItemIds: number[]; addressId?: number; remark?: string }) {
  return request.post('/api/orders/from-cart', data)
}

export async function getOrder(id: number) {
  return request.get(`/api/orders/${id}`)
}

export async function getMyOrders(params?: { page?: number; size?: number; status?: string }) {
  return request.get('/api/orders/my', { params })
}

export async function payOrder(id: number) {
  return request.put(`/api/orders/${id}/pay`, {})
}

export async function confirmOrder(id: number) {
  return request.put(`/api/orders/${id}/complete`, {})
}

// ==================== 购物车接口 ====================

export async function getCart() {
  return request.get('/api/cart')
}

export async function addToCart(data: { productId: number; quantity?: number; specs?: any }) {
  return request.post('/api/cart', data)
}

export async function updateCartItem(id: number, quantity: number) {
  return request.put(`/api/cart/${id}`, { quantity })
}

export async function removeCartItem(id: number) {
  return request.delete(`/api/cart/${id}`)
}

export async function clearCart() {
  return request.delete('/api/cart/clear/all')
}

// ==================== 收货地址接口 ====================

export async function getAddresses() {
  return request.get('/api/users/addresses')
}

export async function createAddress(data: {
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: number
}) {
  return request.post('/api/users/addresses', data)
}

export async function updateAddress(id: number, data: {
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: number
}) {
  return request.put(`/api/users/addresses/${id}`, data)
}

export async function deleteAddress(id: number) {
  return request.delete(`/api/users/addresses/${id}`)
}

export async function setDefaultAddress(id: number) {
  return request.put(`/api/users/addresses/${id}/default`, {})
}

// ==================== 支付接口 ====================

export async function createUnifiedOrder(orderId: number) {
  return request.post('/api/pay/unified-order', { orderId })
}

// ==================== VIP 接口 ====================

export async function getVipPlans() {
  return request.get('/api/vip/plans')
}

export async function subscribeVip(planId: number) {
  return request.post('/api/vip/subscribe', { planId })
}

export async function getMyVipSubscriptions() {
  return request.get('/api/vip/subscriptions')
}

// ==================== 消息接口 ====================

export async function getMessages(params?: { page?: number; size?: number }) {
  return request.get('/api/messages', { params })
}

export async function markMessageRead(id: number) {
  return request.put(`/api/messages/${id}/read`)
}

export async function getUnreadMessageCount() {
  return request.get('/api/messages/unread-count')
}

// ==================== 优惠券接口 ====================

export async function getCoupons(params?: { page?: number; size?: number }) {
  return request.get('/api/public/coupons', { params })
}

export async function claimCoupon(id: number) {
  return request.post(`/api/coupons/claim/${id}`)
}

export async function getUserCoupons(params?: { page?: number; size?: number; status?: string }) {
  return request.get('/api/coupons/my', { params })
}

// ==================== 积分接口 ====================

export async function getMyPoints() {
  return request.get('/api/points/my')
}

export async function getMyPointLogs(params?: { page?: number; size?: number }) {
  return request.get('/api/points/my/logs', { params })
}

export async function getPointRules(params?: { page?: number; size?: number }) {
  return request.get('/api/public/point-rules', { params })
}

// ==================== 上传接口 ====================

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
