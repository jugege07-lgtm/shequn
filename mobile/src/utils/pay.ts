/**
 * 调起微信支付（兼容 uni-app 小程序与 H5 开发环境）
 * @param data 后端 /api/payment/unified-order 返回的调起参数
 */
export function requestPayment(data: {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // 真实小程序环境
    if (typeof uni !== 'undefined' && uni.requestPayment) {
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: data,
        ...data,
        success: () => resolve(),
        fail: (err: any) => reject(new Error(err?.errMsg || '支付取消或失败')),
      })
      return
    }

    // H5 浏览器开发环境：无法直接调起微信支付，给出明确提示
    // eslint-disable-next-line no-alert
    alert('H5 开发环境无法直接调起微信支付，请在微信小程序中测试。\n\n调起参数：' + JSON.stringify(data, null, 2))
    reject(new Error('H5 不支持微信支付'))
  })
}
