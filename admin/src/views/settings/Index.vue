<template>
  <div class="settings-page">
    <el-card header="系统配置" style="margin-bottom: 20px;">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本设置" name="basic">
          <el-form label-width="120px" style="max-width: 600px;" v-loading="loading">
            <el-form-item v-for="item in configList" :key="item.key" :label="getLabel(item.key)">
              <el-input
                v-if="item.key !== 'maintenance_mode'"
                v-model="item.value"
                :placeholder="item.description"
              />
              <el-switch
                v-else
                v-model="item.value"
                active-value="true"
                inactive-value="false"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveConfigs" :loading="saving">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="VIP权限" name="vip">
          <el-form label-width="160px" style="max-width: 640px;" v-loading="vipLoading">
            <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
              <template #title>配置各项 VIP 功能所需的最低会员等级，低于该等级的用户无法使用对应功能。</template>
            </el-alert>
            <el-form-item label="大咖人脉最低VIP级别">
              <el-input-number v-model="vipRule.dajiaMinVipLevel" :min="1" :max="10" style="width: 200px;" />
              <span class="form-tip">用户需达到该 VIP 等级方可使用「大咖人脉」功能</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveVipRules" :loading="vipSaving">保存VIP权限配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="支付配置" name="payment">
          <el-form :model="payForm" label-width="150px" style="max-width: 720px;" v-loading="payLoading">
            <el-form-item label="支付渠道" prop="channel">
              <el-select v-model="payForm.channel" placeholder="请选择支付渠道" style="width: 240px;">
                <el-option label="微信支付" value="wechat" />
                <el-option label="支付宝" value="alipay" />
              </el-select>
              <span class="form-tip">保存后即时生效，调用支付接口时将读取最新配置</span>
            </el-form-item>

            <el-divider content-position="left">微信支付参数</el-divider>
            <el-form-item label="微信 AppID">
              <el-input v-model="payForm.wxAppId" placeholder="请输入微信开放平台 AppID" clearable />
            </el-form-item>
            <el-form-item label="微信 Secret">
              <el-input v-model="payForm.wxSecret" placeholder="请输入微信应用 Secret" show-password clearable />
            </el-form-item>
            <el-form-item label="微信商户号">
              <el-input v-model="payForm.wxMchId" placeholder="请输入微信商户号（mch_id）" clearable />
            </el-form-item>
            <el-form-item label="微信 API 密钥">
              <el-input v-model="payForm.wxApiKey" placeholder="请输入微信 API v2 密钥" show-password clearable />
            </el-form-item>
            <el-form-item label="微信回调地址">
              <el-input v-model="payForm.wxNotifyUrl" placeholder="https://your-domain.com/api/payment/notify/wechat" clearable />
            </el-form-item>
            <el-form-item label="微信退款回调地址">
              <el-input v-model="payForm.wxRefundNotifyUrl" placeholder="https://your-domain.com/api/payment/notify/wechat/refund" clearable />
            </el-form-item>
            <el-form-item label="微信证书路径">
              <el-input v-model="payForm.wxCertPath" placeholder="/path/to/apiclient_cert.pem" clearable />
            </el-form-item>
            <el-form-item label="微信证书私钥路径">
              <el-input v-model="payForm.wxCertKeyPath" placeholder="/path/to/apiclient_key.pem" clearable />
            </el-form-item>
            <el-form-item label="微信 P12 证书路径">
              <el-input v-model="payForm.wxP12Path" placeholder="/path/to/apiclient_cert.p12（可选）" clearable />
            </el-form-item>

            <el-divider content-position="left">支付宝参数</el-divider>
            <el-form-item label="支付宝 AppID">
              <el-input v-model="payForm.alipayAppId" placeholder="请输入支付宝应用 AppID" clearable />
            </el-form-item>
            <el-form-item label="支付宝私钥">
              <el-input v-model="payForm.alipayPrivateKey" type="textarea" :rows="3" placeholder="请输入支付宝应用私钥" show-password />
            </el-form-item>
            <el-form-item label="支付宝公钥">
              <el-input v-model="payForm.alipayPublicKey" type="textarea" :rows="3" placeholder="请输入支付宝公钥" show-password />
            </el-form-item>
            <el-form-item label="支付宝回调地址">
              <el-input v-model="payForm.alipayNotifyUrl" placeholder="https://your-domain.com/api/payment/notify/alipay" clearable />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="savePaymentConfig" :loading="paySaving">保存配置</el-button>
              <el-button @click="validatePaymentConfig" :loading="payValidating">校验配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="公告管理" name="announcements">
          <div style="margin-bottom: 12px;">
            <el-button type="primary" @click="showAnnDialog = true; editingAnn = null">新增公告</el-button>
          </div>
          <el-table :data="announcements" border stripe v-loading="annLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="editAnnouncement(row)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="deleteAnnouncement(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Banner管理" name="banners">
          <div style="margin-bottom: 12px;">
            <el-button type="primary" @click="showBannerDialog = true; editingBanner = null">新增Banner</el-button>
          </div>
          <el-table :data="banners" border stripe v-loading="bannerLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="图片" width="120">
              <template #default="{ row }">
                <el-image v-if="row.imageUrl" :src="row.imageUrl" style="width: 80px; height: 40px;" fit="cover" />
                <span v-else style="color: #999;">无图片</span>
              </template>
            </el-table-column>
            <el-table-column prop="linkType" label="链接类型" width="80" />
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="editBanner(row)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="deleteBanner(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="版本管理" name="versions">
          <div style="margin-bottom: 12px;">
            <el-button type="primary" @click="showVersionDialog = true; editingVersion = null">新增版本</el-button>
          </div>
          <el-table :data="versions" border stripe v-loading="verLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="platform" label="平台" width="80" />
            <el-table-column prop="version" label="版本号" width="100" />
            <el-table-column prop="versionCode" label="版本编码" width="100" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="强制更新" width="90">
              <template #default="{ row }">
                <el-tag :type="row.forceUpdate === 1 ? 'danger' : 'info'">{{ row.forceUpdate === 1 ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="editVersion(row)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="deleteVersion(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="关于我们" name="about">
          <div v-loading="aboutLoading" class="about-editor-wrap">
            <el-alert type="info" :closable="false" style="margin-bottom: 14px;">
              <template #title>编辑后的内容将即时同步到移动端「关于我们」页面。支持加粗、字号、颜色、图片上传等排版功能。</template>
            </el-alert>
            <div style="border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;">
              <Toolbar
                style="border-bottom: 1px solid #e4e7ed"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
              />
              <Editor
                style="height: 420px; overflow-y: hidden;"
                v-model="aboutContent"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleEditorCreated"
              />
            </div>
            <div class="about-actions">
              <el-button @click="loadAboutUs">重置</el-button>
              <el-button type="primary" @click="saveAboutUs" :loading="aboutSaving">保存内容</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 公告对话框 -->
    <el-dialog v-model="showAnnDialog" :title="editingAnn ? '编辑公告' : '新增公告'" width="500px">
      <el-form :model="annForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="annForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="annForm.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="annForm.type"><el-option label="通知" value="notice" /><el-option label="警告" value="warning" /></el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="annForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="annForm.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAnnDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAnnouncement" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Banner对话框 -->
    <el-dialog v-model="showBannerDialog" :title="editingBanner ? '编辑Banner' : '新增Banner'" width="500px">
      <el-form :model="bannerForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="bannerForm.title" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="bannerForm.imageUrl" /></el-form-item>
        <el-form-item label="链接地址"><el-input v-model="bannerForm.linkUrl" /></el-form-item>
        <el-form-item label="链接类型"><el-input v-model="bannerForm.linkType" placeholder="activity/vip/mall" /></el-form-item>
        <el-form-item label="位置"><el-select v-model="bannerForm.position"><el-option label="首页" value="home" /><el-option label="其他" value="other" /></el-select></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="bannerForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="bannerForm.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBannerDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBanner" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 版本对话框 -->
    <el-dialog v-model="showVersionDialog" :title="editingVersion ? '编辑版本' : '新增版本'" width="500px">
      <el-form :model="verForm" label-width="100px">
        <el-form-item label="平台"><el-input v-model="verForm.platform" placeholder="mobile" /></el-form-item>
        <el-form-item label="版本号"><el-input v-model="verForm.version" placeholder="1.0.0" /></el-form-item>
        <el-form-item label="版本编码"><el-input-number v-model="verForm.versionCode" :min="1" /></el-form-item>
        <el-form-item label="更新标题"><el-input v-model="verForm.title" /></el-form-item>
        <el-form-item label="更新内容"><el-input v-model="verForm.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="下载地址"><el-input v-model="verForm.downloadUrl" /></el-form-item>
        <el-form-item label="强制更新">
          <el-switch v-model="verForm.forceUpdate" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="verForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVersionDialog = false">取消</el-button>
        <el-button type="primary" @click="saveVersion" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { compressImage, MAX_BYTES } from '@/utils/imageCompress'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig } from '@wangeditor/editor'

const activeTab = ref('basic')
const loading = ref(false)
const saving = ref(false)


// ========== 关于我们 ==========
const aboutLoading = ref(false)
const aboutSaving = ref(false)
const aboutContent = ref('<p>欢迎使用聚格软件社群小程序！</p>')
const editorRef = shallowRef<IDomEditor | null>(null)

const toolbarConfig = {
  excludeKeys: ['fullScreen'],
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入关于我们的介绍内容...',
  MENU_CONF: {
    uploadImage: {
      /** 自定义上传：先压缩大图，再走 /api/upload 接口，统一补全为 /api/uploads/xxx */
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        try {
          let uploadFile = file
          if (file.type.startsWith('image/') && file.size > MAX_BYTES) {
            try {
              uploadFile = await compressImage(file)
            } catch (e) {
              console.warn('[AboutUs] 图片压缩失败，使用原图:', e)
              uploadFile = file
            }
          }
          const formData = new FormData()
          formData.append('file', uploadFile)
          const res: any = await request.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          let url = res?.url
          if (!url || typeof url !== 'string') {
            ElMessage.error('图片上传失败：未返回图片地址')
            return
          }
          // 后端返回相对路径 /uploads/xxx，统一补全为同域名的 /api/uploads/xxx，
          // 生产环境经 Caddy 转发到后端静态服务，确保富文本编辑器预览和移动端都能正常显示
          if (url.startsWith('/uploads/')) {
            url = url.replace('/uploads/', '/api/uploads/')
          }
          insertFn(url, '关于我们图片', url)
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || '图片上传失败'
          ElMessage.error(msg)
        }
      },
    },
  },
}

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
  editorRef.value = null
})

async function loadAboutUs() {
  aboutLoading.value = true
  try {
    const res: any = await request.get('/admin/config/about_us')
    aboutContent.value = res?.value || '<p>欢迎使用聚格软件社群小程序！</p>'
  } catch (err: any) {
    ElMessage.error(err.message || '加载关于我们失败')
  } finally {
    aboutLoading.value = false
  }
}

async function saveAboutUs() {
  aboutSaving.value = true
  try {
    await request.put('/admin/config/about_us', {
      value: aboutContent.value,
      description: '移动端「关于我们」页面富文本内容',
    })
    ElMessage.success('关于我们保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    aboutSaving.value = false
  }
}

// ========== 系统配置 ==========
const configList = ref<any[]>([])
const labelMap: Record<string, string> = {
  app_name: '应用名称',
  app_description: '应用描述',
  contact_phone: '客服电话',
  contact_email: '客服邮箱',
  maintenance_mode: '维护模式',
  maintenance_message: '维护提示语',
}
function getLabel(key: string) { return labelMap[key] || key }

async function loadConfigs() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/configs')
    configList.value = (data || []).filter((c: any) =>
      !c.key.startsWith('pay_') &&
      !c.key.startsWith('payment_') &&
      c.key !== 'about_us'
    )
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

async function saveConfigs() {
  saving.value = true
  try {
    await request.post('/admin/configs', configList.value)
    ElMessage.success('配置保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally { saving.value = false }
}

// ========== VIP权限配置 ==========
const vipLoading = ref(false)
const vipSaving = ref(false)
const vipRule = reactive({ dajiaMinVipLevel: 1 })

async function loadVipRules() {
  vipLoading.value = true
  try {
    const res: any = await request.get('/admin/config/dajia_min_vip_level')
    const val = Number(res?.value)
    vipRule.dajiaMinVipLevel = Number.isFinite(val) && val > 0 ? val : 1
  } catch (err: any) {
    ElMessage.error(err.message || '加载VIP权限配置失败')
  } finally {
    vipLoading.value = false
  }
}

async function saveVipRules() {
  vipSaving.value = true
  try {
    await request.put('/admin/config/dajia_min_vip_level', {
      value: String(vipRule.dajiaMinVipLevel),
      description: '大咖人脉功能所需最低 VIP 级别',
    })
    ElMessage.success('VIP权限配置保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    vipSaving.value = false
  }
}

// ========== 支付配置 ==========
const payLoading = ref(false)
const paySaving = ref(false)
const payValidating = ref(false)
const payForm = reactive({
  channel: '',
  wxAppId: '',
  wxSecret: '',
  wxMchId: '',
  wxApiKey: '',
  wxNotifyUrl: '',
  wxRefundNotifyUrl: '',
  wxCertPath: '',
  wxCertKeyPath: '',
  wxP12Path: '',
  alipayAppId: '',
  alipayPrivateKey: '',
  alipayPublicKey: '',
  alipayNotifyUrl: '',
})

async function loadPaymentConfig() {
  payLoading.value = true
  try {
    const res: any = await request.get('/admin/payment-config')
    const data = res?.data || {}
    Object.assign(payForm, {
      channel: data.channel || '',
      wxAppId: data.wxAppId || '',
      wxSecret: data.wxSecret || '',
      wxMchId: data.wxMchId || '',
      wxApiKey: data.wxApiKey || '',
      wxNotifyUrl: data.wxNotifyUrl || '',
      wxRefundNotifyUrl: data.wxRefundNotifyUrl || '',
      wxCertPath: data.wxCertPath || '',
      wxCertKeyPath: data.wxCertKeyPath || '',
      wxP12Path: data.wxP12Path || '',
      alipayAppId: data.alipayAppId || '',
      alipayPrivateKey: data.alipayPrivateKey || '',
      alipayPublicKey: data.alipayPublicKey || '',
      alipayNotifyUrl: data.alipayNotifyUrl || '',
    })
  } catch (err: any) {
    ElMessage.error(err.message || '加载支付配置失败')
  } finally { payLoading.value = false }
}

async function savePaymentConfig() {
  paySaving.value = true
  try {
    await request.put('/admin/payment-config', payForm)
    ElMessage.success('支付配置保存成功，已即时生效')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally { paySaving.value = false }
}

async function validatePaymentConfig() {
  payValidating.value = true
  try {
    const res: any = await request.post('/admin/payment-config/validate')
    const result = res?.data || {}
    if (result.valid) {
      ElMessage.success(result.message || '配置校验通过')
    } else {
      ElMessage.warning(result.message || '配置不完整')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '校验失败')
  } finally { payValidating.value = false }
}

// ========== 公告 ==========
const announcements = ref<any[]>([])
const annLoading = ref(false)
const showAnnDialog = ref(false)
const editingAnn = ref<any>(null)
const annForm = reactive({ title: '', content: '', type: 'notice', status: 1, sortOrder: 0 })

async function loadAnnouncements() {
  annLoading.value = true
  try {
    announcements.value = await request.get('/admin/announcements') || []
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { annLoading.value = false }
}

function editAnnouncement(row: any) {
  editingAnn.value = row
  Object.assign(annForm, { title: row.title, content: row.content, type: row.type, status: row.status, sortOrder: row.sortOrder })
  showAnnDialog.value = true
}

async function saveAnnouncement() {
  saving.value = true
  try {
    if (editingAnn.value) {
      await request.put(`/admin/announcements/${editingAnn.value.id}`, annForm)
    } else {
      await request.post('/admin/announcements', annForm)
    }
    ElMessage.success('保存成功')
    showAnnDialog.value = false
    loadAnnouncements()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally { saving.value = false }
}

async function deleteAnnouncement(id: number) {
  try {
    await request.delete(`/admin/announcements/${id}`)
    ElMessage.success('删除成功')
    loadAnnouncements()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

// ========== Banner ==========
const banners = ref<any[]>([])
const bannerLoading = ref(false)
const showBannerDialog = ref(false)
const editingBanner = ref<any>(null)
const bannerForm = reactive({ title: '', imageUrl: '', linkUrl: '', linkType: '', position: 'home', status: 1, sortOrder: 0 })

async function loadBanners() {
  bannerLoading.value = true
  try {
    banners.value = await request.get('/admin/banners') || []
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { bannerLoading.value = false }
}

function editBanner(row: any) {
  editingBanner.value = row
  Object.assign(bannerForm, { title: row.title, imageUrl: row.imageUrl, linkUrl: row.linkUrl, linkType: row.linkType, position: row.position || 'home', status: row.status, sortOrder: row.sortOrder })
  showBannerDialog.value = true
}

async function saveBanner() {
  saving.value = true
  try {
    if (editingBanner.value) {
      await request.put(`/admin/banners/${editingBanner.value.id}`, bannerForm)
    } else {
      await request.post('/admin/banners', bannerForm)
    }
    ElMessage.success('保存成功')
    showBannerDialog.value = false
    loadBanners()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally { saving.value = false }
}

async function deleteBanner(id: number) {
  try {
    await request.delete(`/admin/banners/${id}`)
    ElMessage.success('删除成功')
    loadBanners()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

// ========== 版本 ==========
const versions = ref<any[]>([])
const verLoading = ref(false)
const showVersionDialog = ref(false)
const editingVersion = ref<any>(null)
const verForm = reactive({ platform: 'mobile', version: '', versionCode: 1, title: '', content: '', downloadUrl: '', forceUpdate: 0, status: 1 })

async function loadVersions() {
  verLoading.value = true
  try {
    versions.value = await request.get('/admin/versions') || []
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { verLoading.value = false }
}

function editVersion(row: any) {
  editingVersion.value = row
  Object.assign(verForm, { platform: row.platform, version: row.version, versionCode: row.versionCode, title: row.title, content: row.content, downloadUrl: row.downloadUrl, forceUpdate: row.forceUpdate, status: row.status })
  showVersionDialog.value = true
}

async function saveVersion() {
  saving.value = true
  try {
    if (editingVersion.value) {
      await request.put(`/admin/versions/${editingVersion.value.id}`, verForm)
    } else {
      await request.post('/admin/versions', verForm)
    }
    ElMessage.success('保存成功')
    showVersionDialog.value = false
    loadVersions()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally { saving.value = false }
}

async function deleteVersion(id: number) {
  try {
    await request.delete(`/admin/versions/${id}`)
    ElMessage.success('删除成功')
    loadVersions()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(() => {
  loadConfigs()
  loadVipRules()
  loadPaymentConfig()
  loadAnnouncements()
  loadBanners()
  loadVersions()
  loadAboutUs()
})
</script>

<style scoped>
.settings-page { padding: 0; }
.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
.about-editor-wrap { padding: 8px 0; }
.about-actions {
  margin-top: 16px;
  display: flex; justify-content: flex-end; gap: 10px;
}
</style>
