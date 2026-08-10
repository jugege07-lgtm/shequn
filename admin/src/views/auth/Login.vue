<template>
  <div class="login-container">
    <div class="bg-grain"></div>
    <div class="bg-orb or-1"></div>
    <div class="bg-orb or-2"></div>
    <div class="bg-orb or-3"></div>

    <div class="login-card">
      <!-- ===== 左侧品牌区 ===== -->
      <div class="brand-panel">
        <div class="brand-top">
          <div class="brand-logo">
            <img class="brand-logo-img" src="/logo.jpg" alt="聚格软件" />
          </div>
          <span class="brand-name">聚格软件</span>
        </div>

        <div class="brand-mid">
          <h1 class="brand-title">聚格软件软件社群管理系统</h1>
          <p class="brand-sub">连接资源 · 沉淀人脉 · 赋能社群协作</p>
        </div>

        <div class="brand-foot">
          <div class="brand-line"></div>
          <span class="brand-copy">© 2026 JUGEGE · 管理平台</span>
        </div>
      </div>

      <!-- ===== 右侧表单区 ===== -->
      <div class="form-panel">
        <div class="form-welcome">
          <h2 class="form-title">欢迎登录</h2>
          <p class="form-sub">请使用您的管理账号登录</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" class="login-input" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" class="login-input" @keyup.enter="handleLogin" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" size="large" class="login-btn" @click="handleLogin">
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-tip">安全提示：请勿在公共设备上勾选记住密码</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res: any = await request.post('/auth/staff-login', {
      username: form.username,
      password: form.password,
    })
    if (!res?.accessToken) {
      throw new Error('登录响应缺少 accessToken')
    }
    localStorage.setItem('admin_token', res.accessToken)
    localStorage.setItem('admin_refreshToken', res.refreshToken || '')
    // 保存当前登录用户信息（含角色），用于菜单与操作权限控制
    if (res.user) {
      localStorage.setItem('admin_user', JSON.stringify(res.user))
    }
    router.push('/')
  } catch (err: any) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(150deg, #0e1a2e 0%, #16284a 48%, #0f1f3d 100%);
  padding: 24px;
}

/* ===== 背景氛围 ===== */
.bg-grain {
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(212,175,122,0.10) 0, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(80,120,200,0.12) 0, transparent 45%);
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.bg-orb.or-1 { width: 420px; height: 420px; top: -140px; right: -100px; background: rgba(212,175,122,0.16); }
.bg-orb.or-2 { width: 380px; height: 380px; bottom: -160px; left: -120px; background: rgba(80,120,200,0.18); }
.bg-orb.or-3 { width: 220px; height: 220px; top: 48%; left: 55%; background: rgba(212,175,122,0.08); }

/* ===== 卡片 ===== */
.login-card {
  position: relative;
  z-index: 1;
  width: 920px;
  max-width: 100%;
  min-height: 560px;
  display: flex;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.5);
  background: #fff;
}

/* ===== 左侧品牌区 ===== */
.brand-panel {
  position: relative;
  width: 44%;
  padding: 44px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
  background:
    radial-gradient(circle at 85% 15%, rgba(212,175,122,0.22), transparent 45%),
    linear-gradient(160deg, #1b2f56 0%, #122244 100%);
  overflow: hidden;
}
.brand-panel::after {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 34px 34px;
  pointer-events: none;
}
.brand-top {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 14px;
}
.brand-logo {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}
.brand-logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.brand-name { font-size: 20px; font-weight: 700; letter-spacing: 2px; }

.brand-mid { position: relative; z-index: 1; }
.brand-title {
  font-size: 30px;
  line-height: 1.35;
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: 1px;
}
.brand-sub {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(212,175,122,0.9);
  margin: 0;
  letter-spacing: 0.5px;
}

.brand-foot { position: relative; z-index: 1; }
.brand-line {
  width: 56px; height: 2px;
  background: linear-gradient(90deg, #d4af7a, transparent);
  margin-bottom: 14px;
}
.brand-copy { font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: 1px; }

/* ===== 右侧表单区 ===== */
.form-panel {
  flex: 1;
  padding: 64px 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-welcome { margin-bottom: 36px; }
.form-title {
  font-size: 30px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 10px;
  letter-spacing: 1px;
}
.form-sub { font-size: 15px; color: #9ca3af; margin: 0; }

.login-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 6px 14px;
  height: 52px;
  box-shadow: 0 0 0 1px #e5e7eb inset;
  background: #fafbfc;
  transition: box-shadow 0.2s, background 0.2s;
}
.login-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #1b2f56 inset;
  background: #fff;
}
.login-input :deep(.el-input__inner) { color: #1f2937; font-size: 15px; }

.login-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border: none;
  background: linear-gradient(135deg, #1b2f56 0%, #24406e 100%);
  box-shadow: 0 10px 30px rgba(27,47,86,0.28);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.login-btn:hover { opacity: 0.94; box-shadow: 0 14px 36px rgba(27,47,86,0.36); }
.login-btn:active { transform: translateY(1px); }

.form-tip {
  margin-top: 26px;
  text-align: center;
  font-size: 12px;
  color: #b6bcc7;
}

/* ===== 响应式 ===== */
@media (max-width: 720px) {
  .brand-panel { display: none; }
  .login-card { max-width: 460px; }
  .form-panel { padding: 48px 32px 40px; }
}
</style>