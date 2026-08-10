<template>
  <div class="roles-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色权限管理</span>
          <el-button type="primary" size="small" @click="openRoleDialog()">新增角色</el-button>
        </div>
      </template>

      <el-alert type="info" :closable="false" style="margin-bottom: 14px;">
        <template #title>为每个角色勾选可用的操作权限。管理员角色自动拥有全部权限，无需勾选。系统内置角色不可删除，保存后即时生效。</template>
      </el-alert>

      <div v-loading="loading" class="role-layout">
        <div class="role-list">
          <div
            v-for="role in roleList"
            :key="role.code"
            class="role-item"
            :class="{ active: selectedRole === role.code }"
            @click="selectRole(role.code)"
          >
            <div class="role-item-top">
              <span class="role-item-name">{{ role.name }}</span>
              <el-tag v-if="role.isSystem === 1" size="small" type="info" effect="plain">内置</el-tag>
            </div>
            <div class="role-item-code">{{ role.code }}</div>
            <div class="role-item-desc">{{ role.description || '-' }}</div>
            <div class="role-item-actions">
              <el-button size="small" text type="primary" @click.stop="openRoleDialog(role)">编辑</el-button>
              <el-popconfirm v-if="role.isSystem !== 1" title="确定删除该角色？" @confirm="deleteRole(role)">
                <template #reference>
                  <el-button size="small" text type="danger" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <el-empty v-if="roleList.length === 0" description="暂无角色" />
        </div>

        <div class="role-perms">
          <div v-if="!currentRole" style="color: #909399; padding: 40px; text-align: center;">请选择左侧角色进行权限配置</div>
          <template v-else>
            <div class="role-perms-head">
              <span class="role-perms-title">{{ currentRole.name }} · 权限配置</span>
              <div>
                <el-button size="small" @click="checkAllCurrent">全选</el-button>
                <el-button size="small" @click="clearCurrent">清空</el-button>
                <el-button size="small" type="primary" :loading="saving" @click="saveRolePermission">保存权限</el-button>
              </div>
            </div>
            <el-divider style="margin: 8px 0 16px;" />
            <el-checkbox-group v-model="currentRolePerms">
              <div v-for="group in permissionGroups" :key="group.group" class="perm-group">
                <div class="perm-group-title">
                  <el-checkbox
                    :model-value="isGroupAllChecked(group.group)"
                    :indeterminate="isGroupIndeterminate(group.group)"
                    :disabled="currentRole.code === 'admin'"
                    @change="(v: any) => toggleGroup(group.group, v)"
                  >{{ group.group }}</el-checkbox>
                </div>
                <div class="perm-group-items">
                  <el-checkbox v-for="p in group.items" :key="p.code" :label="p.code" :disabled="currentRole.code === 'admin'">{{ p.label }}</el-checkbox>
                </div>
              </div>
            </el-checkbox-group>
          </template>
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="editingRole ? '编辑角色' : '新增角色'" width="520px">
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="90px">
        <el-form-item v-if="!editingRole" label="角色标识" prop="code">
          <el-input v-model="roleForm.code" placeholder="字母开头，仅含字母/数字/下划线，如 sales" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" placeholder="简要说明该角色的职责" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRole" :loading="roleSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/api/request'

const loading = ref(false)
const saving = ref(false)
const roleList = ref<any[]>([])
const selectedRole = ref('')
const permissionCatalog = ref<any[]>([])
const currentRolePerms = ref<string[]>([])

const currentRole = computed(() => roleList.value.find((r) => r.code === selectedRole.value) || null)
const permissionGroups = computed(() => {
  const groups: Record<string, any[]> = {}
  permissionCatalog.value.forEach((p) => {
    ;(groups[p.group] = groups[p.group] || []).push(p)
  })
  return Object.entries(groups).map(([group, items]) => ({ group, items }))
})

async function loadData() {
  loading.value = true
  try {
    const [roles, perms] = await Promise.all([
      request.get('/admin/role-permissions') as Promise<any>,
      request.get('/admin/permissions') as Promise<any>,
    ])
    roleList.value = roles || []
    permissionCatalog.value = perms || []
    const target = roleList.value.find((r) => r.code !== 'admin') || roleList.value[0]
    if (target) {
      selectedRole.value = target.code
      currentRolePerms.value = [...(target.permissions || [])]
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载角色失败')
  } finally {
    loading.value = false
  }
}

function selectRole(code: string) {
  selectedRole.value = code
  syncPerms()
}

function syncPerms() {
  const role = roleList.value.find((r) => r.code === selectedRole.value)
  currentRolePerms.value = role ? [...(role.permissions || [])] : []
}

function checkAllCurrent() {
  if (currentRole.value?.code === 'admin') return
  currentRolePerms.value = permissionGroups.value.flatMap((g) => g.items.map((p) => p.code))
}

function clearCurrent() {
  if (currentRole.value?.code === 'admin') return
  currentRolePerms.value = []
}

function isGroupAllChecked(group: string) {
  const codes = permissionGroups.value.find((g) => g.group === group)?.items.map((p) => p.code) || []
  return codes.length > 0 && codes.every((c) => currentRolePerms.value.includes(c))
}

function isGroupIndeterminate(group: string) {
  const codes = permissionGroups.value.find((g) => g.group === group)?.items.map((p) => p.code) || []
  const checked = codes.filter((c) => currentRolePerms.value.includes(c)).length
  return checked > 0 && checked < codes.length
}

function toggleGroup(group: string, checked: boolean) {
  if (currentRole.value?.code === 'admin') return
  const codes = permissionGroups.value.find((g) => g.group === group)?.items.map((p) => p.code) || []
  const set = new Set(currentRolePerms.value)
  if (checked) codes.forEach((c) => set.add(c))
  else codes.forEach((c) => set.delete(c))
  currentRolePerms.value = Array.from(set)
}

async function saveRolePermission() {
  if (!currentRole.value) return
  saving.value = true
  try {
    await request.put(`/admin/role-permissions/${currentRole.value.code}`, { permissions: currentRolePerms.value })
    ElMessage.success('权限保存成功')
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ========== 角色增删改 ==========
const roleDialogVisible = ref(false)
const roleSaving = ref(false)
const editingRole = ref<any>(null)
const roleFormRef = ref<FormInstance>()
const roleForm = reactive({ code: '', name: '', description: '' })
const roleRules: FormRules = {
  code: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{1,19}$/, message: '字母开头，仅含字母/数字/下划线，长度2-20', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

function openRoleDialog(role?: any) {
  editingRole.value = role || null
  Object.assign(roleForm, { code: role?.code || '', name: role?.name || '', description: role?.description || '' })
  roleDialogVisible.value = true
}

async function submitRole() {
  const valid = await roleFormRef.value?.validate().catch(() => false)
  if (!valid) return
  roleSaving.value = true
  try {
    if (editingRole.value) {
      await request.put(`/admin/roles/${editingRole.value.code}`, { name: roleForm.name, description: roleForm.description })
      ElMessage.success('角色保存成功')
    } else {
      await request.post('/admin/roles', roleForm)
      ElMessage.success('角色创建成功')
    }
    roleDialogVisible.value = false
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    roleSaving.value = false
  }
}

async function deleteRole(role: any) {
  try {
    await request.delete(`/admin/roles/${role.code}`)
    ElMessage.success('角色已删除')
    if (selectedRole.value === role.code) {
      selectedRole.value = ''
      currentRolePerms.value = []
    }
    await loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.role-layout { display: flex; gap: 16px; min-height: 420px; }
.role-list { width: 260px; flex-shrink: 0; border-right: 1px solid #f0f0f0; padding-right: 12px; overflow-y: auto; max-height: 560px; }
.role-item { padding: 12px 14px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; margin-bottom: 8px; transition: all 0.2s; }
.role-item:hover { background: #f5f7fa; }
.role-item.active { background: #ecf5ff; border-color: #409eff; }
.role-item-top { display: flex; align-items: center; justify-content: space-between; }
.role-item-name { font-size: 14px; font-weight: 600; color: #303133; }
.role-item-code { font-size: 12px; color: #909399; margin-top: 2px; }
.role-item-desc { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.4; }
.role-item-actions { margin-top: 8px; display: flex; gap: 4px; }
.role-perms { flex: 1; min-width: 0; }
.role-perms-head { display: flex; justify-content: space-between; align-items: center; }
.role-perms-title { font-size: 15px; font-weight: 600; color: #303133; }
.perm-group { margin-bottom: 16px; padding: 12px 14px; background: #fafafa; border-radius: 8px; }
.perm-group-title { font-size: 13px; font-weight: 600; color: #606266; margin-bottom: 10px; padding-left: 8px; border-left: 3px solid #409eff; }
.perm-group-items { display: flex; flex-wrap: wrap; gap: 4px 20px; padding-left: 6px; }
</style>