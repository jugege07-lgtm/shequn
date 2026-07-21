<template>
  <div class="login-container">
    <div class="login-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
      <div class="shape s3"></div>
    </div>
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <div class="logo-icon">
            <el-icon :size="28"><Share /></el-icon>
          </div>
          <h2 class="login-title">聚格软件管理后台</h2>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" @keyup.enter="handleLogin" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" size="large" class="login-btn" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
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
    const res: any = await request.post('/auth/admin-login', {
      username: form.username,
      password: form.password,
    })
    if (!res?.accessToken) {
      throw new Error('登录响应缺少 accessToken')
    }
    localStorage.setItem('admin_token', res.accessToken)
    localStorage.setItem('admin_refreshToken', res.refreshToken || '')
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  position: relative;
  overflow: hidden;
}
.login-bg-shapes { position: absolute; inset: 0; overflow: hidden; }
.login-bg-shapes .shape {
  position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
}
.login-bg-shapes .shape.s1 { width: 300px; height: 300px; top: -80px; right: -60px; }
.login-bg-shapes .shape.s2 { width: 200px; height: 200px; bottom: -50px; left: -40px; }
.login-bg-shapes .shape.s3 { width: 120px; height: 120px; top: 60px; left: 120px; }

.login-card {
  width: 420px;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  overflow: visible;
  z-index: 1;
}
:deep(.el-card__header) {
  padding: 0;
  border-bottom: none;
}
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0 20px;
}
.logo-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  margin-bottom: 14px;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
}
:deep(.el-card__body) {
  padding: 28px 32px 32px;
}
:deep(.el-form-item) {
  margin-bottom: 20px;
}
:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 14px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset;
}
.login-btn {
  width: 100%;
  border-radius: 12px;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border: none;
}
.login-btn:hover {
  opacity: 0.9;
}
</style>
