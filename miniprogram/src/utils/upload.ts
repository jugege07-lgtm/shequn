/**
 * 图片选择 + 上传（小程序版，替代 H5 的 input[type=file]）
 * - chooseAndUpload：uni.chooseMedia → uni.uploadFile → 返回后端相对路径 /uploads/xxx
 * - 后端约定与 H5 一致：响应 { code: 0, data: { url } }
 */
import { getApiBase } from './apiBase'
import { showToast } from './toast'

export interface UploadResult {
  url: string
}

/** 单选/多选图片并上传，返回后端相对路径数组（保存时保留相对路径，展示用 normalizeImageUrl 补全） */
export function chooseAndUploadImages(count = 1, sourceType: ('album' | 'camera')[] = ['album', 'camera']): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType,
      sizeType: ['compressed'],
      success: (res) => {
        const files = res.tempFiles.map((f) => f.tempFilePath)
        Promise.all(files.map((p) => uploadImage(p)))
          .then((urls) => resolve(urls))
          .catch(reject)
      },
      fail: (err) => {
        // 用户取消不视为错误，返回空数组
        if (String(err?.errMsg || '').includes('cancel')) resolve([])
        else reject(err)
      },
    })
  })
}

/** 上传单张本地图片，返回后端相对路径 */
export function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: `${getApiBase()}/api/upload/image`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (body?.code === 0) {
            const url = body.data?.url || body.data || ''
            resolve(String(url))
          } else {
            showToast(body?.message || '上传失败')
            reject(new Error(body?.message || '上传失败'))
          }
        } catch (e) {
          showToast('上传失败')
          reject(e)
        }
      },
      fail: (err) => {
        showToast('上传失败，请检查网络')
        reject(err)
      },
    })
  })
}
