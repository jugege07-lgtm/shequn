<template>
  <div class="rich-editor" :class="{ 'is-disabled': disabled }">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      class="editor-toolbar"
    />
    <Editor
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      class="editor-content"
      :style="{ height: height }"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import request from '@/api/request'
import { compressImage } from '@/utils/imageCompress'

interface Props {
  modelValue?: string
  height?: string
  placeholder?: string
  disabled?: boolean
  mode?: 'default' | 'simple'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: '400px',
  placeholder: '请输入内容...',
  disabled: false,
  mode: 'default',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const editorRef = shallowRef<any>(null)
const valueHtml = ref(props.modelValue)

// 监听外部值变化（如重置表单）
watch(
  () => props.modelValue,
  (val) => {
    if (val !== valueHtml.value) {
      valueHtml.value = val
    }
  }
)

// 工具栏配置
const toolbarConfig = {
  excludeKeys: props.disabled
    ? ['headerSelect', 'italic', 'bold', 'underline', 'through', 'code', 'sub', 'sup', 'clearStyle', 'color', 'bgColor', 'fontSize', 'fontFamily', 'indent', 'delIndent', 'justifyLeft', 'justifyRight', 'justifyCenter', 'justifyJustify', 'insertLink', 'uploadImage', 'insertVideo', 'insertTable', 'divider', 'insertFormula', 'undo', 'redo']
    : [],
}

// 编辑器配置
const editorConfig: any = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {},
}

// 自定义图片上传：先压缩大图，再走后端 /api/upload 接口
editorConfig.MENU_CONF['uploadImage'] = {
  // 自定义上传
  async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
    try {
      // 大图自动压缩：最长边 > 1920px 或体积 > 1MB 时压缩，减小上传体积、加快加载（compressImage 内部判断）
      let uploadFile = file
      if (file.type.startsWith('image/')) {
        try {
          uploadFile = await compressImage(file)
        } catch (e) {
          console.warn('[RichTextEditor] 图片压缩失败，使用原图:', e)
          uploadFile = file
        }
      }
      const formData = new FormData()
      formData.append('file', uploadFile)
      const res: any = await request.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // 后端返回 { url: '/uploads/xxx.jpg', originalName: 'xxx.jpg' }
      // 统一补全为 /api/uploads/xxx，经 Vite 代理 / Caddy 转发到后端静态服务
      let fullUrl = res.url
      if (fullUrl && fullUrl.startsWith('/uploads/')) {
        fullUrl = fullUrl.replace('/uploads/', '/api/uploads/')
      }
      insertFn(fullUrl, res.originalName || file.name, fullUrl)
    } catch (err: any) {
      console.error('图片上传失败:', err)
    }
  },
}

// 编辑器创建回调
function handleCreated(editor: any) {
  editorRef.value = editor
}

// 内容变化回调
function handleChange(editor: any) {
  const html = editor.getHtml()
  emit('update:modelValue', html)
  emit('change', html)
}

// 组件销毁时，及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor === null) return
  editor.destroy()
  editorRef.value = null
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.rich-editor:focus-within {
  border-color: #409eff;
}
.rich-editor.is-disabled {
  background-color: #f5f7fa;
}
.editor-toolbar {
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}
.editor-content {
  overflow-y: auto;
}
/* 隐藏 wangeditor 的 textarea 焦点边框 */
:deep(.w-e-text-container) {
  border: none !important;
}
:deep(.w-e-toolbar) {
  border: none !important;
}
</style>
