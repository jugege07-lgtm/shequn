/**
 * 调起微信支付（兼容 uni-app 小程序 JSAPI 与 H5 浏览器支付）
 * @param data 后端 /api/pay/unified-order 返回的调起参数
 *   - JSAPI 模式: { appId, timeStamp, nonceStr, package, signType, paySign }
 *   - H5 模式:    { channel: 'wechat_h5', h5Url }
 */
export function requestPayment(data: {
  appId?: string
  timeStamp?: string
  nonceStr?: string
  package?: string
  signType?: string
  paySign?: string
  channel?: string
  h5Url?: string
}): Promise<void> {
  // H5 支付：跳转微信 H5 支付中间页（在手机浏览器中唤起微信 App 完成支付）
  if (data.channel === 'wechat_h5' || data.h5Url) {
    if (!data.h5Url) {
      return Promise.reject(new Error('未获取到 H5 支付跳转链接'))
    }
    // 跳转后当前页面会被微信支付页替换，无需 resolve
    window.location.href = data.h5Url
    return new Promise<void>(() => {})
  }

  // JSAPI 支付（微信小程序 / 公众号环境）
  if (typeof uni !== 'undefined' && uni.requestPayment) {
    return new Promise<void>((resolve, reject) => {
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: data,
        ...data,
        success: () => resolve(),
        fail: (err: any) => reject(new Error(err?.errMsg || '支付取消或失败')),
      })
    })
  }

  // 兜底提示
  // eslint-disable-next-line no-alert
  alert('当前环境不支持微信支付。\n\n调起参数：' + JSON.stringify(data, null, 2))
  return Promise.reject(new Error('环境不支持微信支付'))
}
