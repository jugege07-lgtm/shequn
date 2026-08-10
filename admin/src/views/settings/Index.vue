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

          <el-divider content-position="left">免费商机解锁次数</el-divider>
          <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
            <template #title>限制同一用户可免费解锁（解锁费用为 0）的商机数量。普通会员与各 VIP 等级可分别设置，达到上限后需付费解锁或升级会员。</template>
          </el-alert>
          <el-form label-width="160px" style="max-width: 640px;" v-loading="unlockCfgLoading">
            <el-form-item label="普通会员解锁次数">
              <el-input-number v-model.number="unlockCfg.default" :min="0" :max="1000" style="width: 200px;" />
              <span class="form-tip">非 VIP 用户可免费解锁的商机次数，0 表示禁止免费解锁</span>
            </el-form-item>
            <el-form-item
              v-for="lv in vipLevels"
              :key="lv"
              :label="`VIP ${lv} 级解锁次数`"
            >
              <el-input-number v-model.number="unlockCfg.vip[lv]" :min="0" :max="1000" style="width: 200px;" />
              <span class="form-tip">VIP {{ lv }} 级用户可免费解锁的商机次数，0 表示禁止免费解锁</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveUnlockCfg" :loading="unlockCfgSaving">保存解锁次数配置</el-button>
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
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="120px" style="max-width: 460px;">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前登录密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位，需包含字母和数字" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="pwdSaving">确认修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="账号管理" name="staff">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <el-input v-model="staffKeyword" placeholder="搜索用户名/姓名/手机号" clearable style="width: 260px;" @keyup.enter="loadStaff" @clear="loadStaff" />
            <el-button type="primary" @click="openStaffDialog()">新增账号</el-button>
          </div>
          <el-table :data="staffList" border stripe v-loading="staffLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="nickname" label="用户名" min-width="100" />
            <el-table-column prop="realName" label="姓名" min-width="90" />
            <el-table-column prop="phone" label="联系方式" min-width="120" />
            <el-table-column label="角色" min-width="150">
              <template #default="{ row }">
                <el-tag v-for="r in parseRoles(row.role)" :key="r" :type="roleTagType(r)" size="small" style="margin-right: 4px;">{{ roleLabel(r) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'normal' ? 'success' : 'info'">{{ row.status === 'normal' ? '正常' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openStaffDialog(row)">编辑</el-button>
                <el-button size="small" type="warning" @click="openResetPwd(row)">重置密码</el-button>
                <el-popconfirm title="确定删除该账号？" @confirm="deleteStaff(row)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            style="margin-top: 14px; justify-content: center;"
            v-model:current-page="staffPage"
            :page-size="staffSize"
            :total="staffTotal"
            layout="total, prev, pager, next"
            @current-change="loadStaff"
          />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="logs">
          <div style="margin-bottom: 12px; display: flex; gap: 10px;">
            <el-input v-model="logKeyword" placeholder="搜索操作人/详情" clearable style="width: 240px;" @keyup.enter="loadLogs" @clear="loadLogs" />
            <el-select v-model="logModule" placeholder="模块筛选" clearable style="width: 160px;" @change="loadLogs">
              <el-option v-for="m in logModules" :key="m.value" :label="m.label" :value="m.value" />
            </el-select>
            <el-button @click="loadLogs">查询</el-button>
          </div>
          <el-table :data="logList" border stripe v-loading="logLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="operator" label="操作人" width="110" />
            <el-table-column label="模块" width="100">
              <template #default="{ row }"><el-tag size="small" effect="plain">{{ logModuleLabel(row.module) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="动作" width="130">
              <template #default="{ row }"><span>{{ actionLabel(row.action) }}</span></template>
            </el-table-column>
            <el-table-column prop="detail" label="操作详情" min-width="220" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column prop="createdAt" label="时间" width="170" />
          </el-table>
          <el-pagination
            style="margin-top: 14px; justify-content: center;"
            v-model:current-page="logPage"
            :page-size="logSize"
            :total="logTotal"
            layout="total, prev, pager, next"
            @current-change="loadLogs"
          />
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

    <!-- 新增/编辑后台账号对话框 -->
    <el-dialog v-model="showStaffDialog" :title="editingStaff ? '编辑账号' : '新增账号'" width="520px">
      <el-form :model="staffForm" :rules="staffRules" ref="staffFormRef" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="staffForm.username" :disabled="!!editingStaff" placeholder="3-20位字母、数字或下划线" />
        </el-form-item>
        <el-form-item v-if="!editingStaff" label="密码" prop="password">
          <el-input v-model="staffForm.password" type="password" show-password placeholder="至少6位，需包含字母和数字" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="staffForm.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系方式" prop="phone">
          <el-input v-model="staffForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-checkbox-group v-model="staffForm.roles">
            <el-checkbox v-for="r in staffRoleOptions" :key="r.value" :label="r.value">{{ r.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStaffDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStaff" :loading="staffSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="showResetPwd" :title="`重置密码 - ${resetTarget?.nickname || ''}`" width="440px">
      <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" label-width="90px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" type="password" show-password placeholder="至少6位，需包含字母和数字" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetPwd = false">取消</el-button>
        <el-button type="primary" @click="saveResetPwd" :loading="resetSaving">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
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

// ========== 免费商机解锁次数配置 ==========
const unlockCfgLoading = ref(false)
const unlockCfgSaving = ref(false)
const vipLevels = ref<number[]>([])
const unlockCfg = reactive<{ default: number; vip: Record<string, number> }>({ default: 3, vip: {} })

async function loadUnlockCfg() {
  unlockCfgLoading.value = true
  try {
    const [cfgRes, planRes]: any = await Promise.all([
      request.get('/admin/config/business_free_unlock'),
      request.get('/admin/vip-plans'),
    ])
    const raw = cfgRes?.value
    let parsed: any = { default: 3, vip: {} }
    if (raw) { try { parsed = { default: 3, vip: {}, ...JSON.parse(raw) } } catch { /* 忽略 */ } }
    unlockCfg.default = Number(parsed.default) || 3
    unlockCfg.vip = {}
    const levels = new Set<number>()
    ;(planRes?.list || []).forEach((p: any) => { if (p?.level) levels.add(Number(p.level)) })
    if (levels.size === 0) { for (let i = 1; i <= 3; i++) levels.add(i) }
    vipLevels.value = Array.from(levels).sort((a, b) => a - b)
    vipLevels.value.forEach((lv) => {
      unlockCfg.vip[String(lv)] = parsed.vip?.[String(lv)] != null ? Number(parsed.vip[String(lv)]) : 0
    })
  } catch (err: any) {
    ElMessage.error(err.message || '加载解锁次数配置失败')
  } finally {
    unlockCfgLoading.value = false
  }
}

async function saveUnlockCfg() {
  unlockCfgSaving.value = true
  try {
    const payload = { value: JSON.stringify({ default: unlockCfg.default, vip: unlockCfg.vip }), description: '免费商机解锁次数配置（普通会员与各VIP等级差异化）' }
    await request.put('/admin/config/business_free_unlock', payload)
    ElMessage.success('解锁次数配置保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    unlockCfgSaving.value = false
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

// ========== 修改密码 ==========
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdFormRef = ref<FormInstance>()
const pwdSaving = ref(false)
const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为6-32位', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码需同时包含字母和数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r: any, v: string, cb: (e?: Error) => void) => {
        if (v !== pwdForm.newPassword) cb(new Error('两次输入的密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

async function changePassword() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  pwdSaving.value = true
  try {
    await request.put('/admin/profile/password', pwdForm)
    ElMessage.success('密码修改成功，请使用新密码重新登录')
    pwdFormRef.value?.resetFields()
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refreshToken')
    localStorage.removeItem('admin_user')
    setTimeout(() => { window.location.href = '/login' }, 1200)
  } catch (err: any) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    pwdSaving.value = false
  }
}

// ========== 账号管理 ==========
const staffList = ref<any[]>([])
const staffLoading = ref(false)
const staffKeyword = ref('')
const staffPage = ref(1)
const staffSize = ref(20)
const staffTotal = ref(0)
const showStaffDialog = ref(false)
const staffSaving = ref(false)
const editingStaff = ref<any>(null)
const staffFormRef = ref<FormInstance>()
const staffForm = reactive({ username: '', password: '', realName: '', phone: '', roles: [] as string[] })
const staffRoleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '内容编辑' },
  { value: 'moderator', label: '审核员' },
  { value: 'operator', label: '运营' },
]
const staffRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20位字母、数字或下划线', trigger: 'blur' },
  ],
  password: [
    { validator: (_r: any, v: string, cb: (e?: Error) => void) => {
      if (editingStaff.value) { cb(); return }
      if (!v) { cb(new Error('请输入密码')); return }
      if (v.length < 6 || v.length > 32) { cb(new Error('密码长度为6-32位')); return }
      if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(v)) { cb(new Error('密码需同时包含字母和数字')); return }
      cb()
    }, trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roles: [{ required: true, type: 'array', min: 1, message: '请至少选择一个角色', trigger: 'change' }],
}

async function loadStaff() {
  staffLoading.value = true
  try {
    const data: any = await request.get('/admin/staff', { params: { page: staffPage.value, size: staffSize.value, keyword: staffKeyword.value } })
    staffList.value = data?.list || []
    staffTotal.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    staffLoading.value = false
  }
}

function openStaffDialog(row?: any) {
  editingStaff.value = row || null
  Object.assign(staffForm, {
    username: row?.nickname || '',
    password: '',
    realName: row?.realName || '',
    phone: row?.phone || '',
    roles: parseRoles(row?.role),
  })
  showStaffDialog.value = true
}

async function saveStaff() {
  const valid = await staffFormRef.value?.validate().catch(() => false)
  if (!valid) return
  staffSaving.value = true
  try {
    if (editingStaff.value) {
      await request.put(`/admin/staff/${editingStaff.value.id}`, { realName: staffForm.realName, phone: staffForm.phone, roles: staffForm.roles })
    } else {
      await request.post('/admin/staff', staffForm)
    }
    ElMessage.success('保存成功')
    showStaffDialog.value = false
    loadStaff()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    staffSaving.value = false
  }
}

async function deleteStaff(row: any) {
  try {
    await request.delete(`/admin/staff/${row.id}`)
    ElMessage.success('删除成功')
    loadStaff()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

function parseRoles(role?: string): string[] {
  return String(role || '').split(',').map((s) => s.trim()).filter(Boolean)
}
function roleLabel(r: string) {
  return staffRoleOptions.find((o) => o.value === r)?.label || r
}
function roleTagType(r: string) {
  return r === 'admin' ? 'danger' : r === 'moderator' ? 'warning' : 'primary'
}

// ========== 重置密码 ==========
const showResetPwd = ref(false)
const resetTarget = ref<any>(null)
const resetSaving = ref(false)
const resetFormRef = ref<FormInstance>()
const resetForm = reactive({ newPassword: '', confirmPassword: '' })
const resetRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为6-32位', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码需同时包含字母和数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r: any, v: string, cb: (e?: Error) => void) => {
        if (v !== resetForm.newPassword) cb(new Error('两次输入的密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}
function openResetPwd(row: any) {
  resetTarget.value = row
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  showResetPwd.value = true
}
async function saveResetPwd() {
  const valid = await resetFormRef.value?.validate().catch(() => false)
  if (!valid) return
  resetSaving.value = true
  try {
    await request.put(`/admin/staff/${resetTarget.value.id}/password`, resetForm)
    ElMessage.success('密码重置成功')
    showResetPwd.value = false
  } catch (err: any) {
    ElMessage.error(err.message || '重置失败')
  } finally {
    resetSaving.value = false
  }
}

// ========== 操作日志 ==========
const logList = ref<any[]>([])
const logLoading = ref(false)
const logKeyword = ref('')
const logModule = ref('')
const logPage = ref(1)
const logSize = ref(20)
const logTotal = ref(0)
const logModules = [
  { value: 'system', label: '系统' },
  { value: 'role', label: '角色权限' },
  { value: 'user', label: '用户' },
  { value: 'activity', label: '活动' },
  { value: 'business', label: '商机' },
  { value: 'order', label: '订单' },
  { value: 'product', label: '商品' },
]
const logModuleLabel = (m: string) => logModules.find((x) => x.value === m)?.label || m
const actionLabelMap: Record<string, string> = {
  change_password: '修改密码',
  create_admin: '新增账号',
  update_admin: '编辑账号',
  delete_admin: '删除账号',
  reset_password: '重置密码',
  update_role_permission: '更新角色权限',
  create_role: '新增角色',
  update_role: '编辑角色',
  delete_role: '删除角色',
}
const actionLabel = (a: string) => actionLabelMap[a] || a

async function loadLogs() {
  logLoading.value = true
  try {
    const data: any = await request.get('/admin/operation-logs', { params: { page: logPage.value, size: logSize.value, keyword: logKeyword.value, module: logModule.value } })
    logList.value = data?.list || []
    logTotal.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载日志失败')
  } finally {
    logLoading.value = false
  }
}

onMounted(() => {
  loadConfigs()
  loadVipRules()
  loadUnlockCfg()
  loadPaymentConfig()
  loadAnnouncements()
  loadVersions()
  loadAboutUs()
  loadStaff()
  loadLogs()
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
