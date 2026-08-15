<template>
  <text class="share-icon-glyph" :style="{ fontSize: (size * 0.62) + 'px' }">{{ glyph }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'wechat' | 'moments' | 'qq' | 'system' | 'link'
  size?: number
  color?: string
}>(), {
  type: 'wechat',
  size: 24,
  color: '#ffffff',
})

const GLYPHS: Record<string, string> = {
  wechat: '💬',
  moments: '🌐',
  qq: '🐧',
  system: '📤',
  link: '🔗',
}

const glyph = computed(() => GLYPHS[props.type] || '🔗')
</script>

<style scoped>
.share-icon-glyph {
  line-height: 1;
}
</style>
