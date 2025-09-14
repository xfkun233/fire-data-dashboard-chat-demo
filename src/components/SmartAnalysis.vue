<template>
  <div class="smart-analysis">
    <div class="actions">
      <el-button type="primary" :loading="loading" @click="analyze">
        <el-icon><MagicStick /></el-icon>
        一键智能分析
      </el-button>
      <span class="hint">基于当前看板数据，由 AI 给出结构化建议</span>
    </div>

    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      show-icon
      class="error-alert"
      :title="error"
    />

    <div v-if="result" class="analysis-result">
      <div v-html="renderResult(result)"></div>
    </div>
    <div v-else-if="!loading" class="placeholder">
      点击上方按钮，生成面向值班与处置的智能建议
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import deepseekService from '@/services/deepseek'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const props = defineProps({
  // 由父组件提供：构建用于 chat 的 messages 数组（system + user）
  buildMessages: {
    type: Function,
    required: true
  }
})

const loading = ref(false)
const error = ref('')
const result = ref('')

// 与 ChatView 保持一致的 markdown 渲染配置
const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

const renderResult = (text) => md.render(text || '')

const analyze = async () => {
  error.value = ''
  result.value = ''
  loading.value = true
  try {
    const chatStore = useChatStore()
    // 同步用户在设置中的 DeepSeek 配置
    deepseekService.updateConfig(chatStore.settings)

    const messages = await props.buildMessages()
    const content = await deepseekService.chat(messages)
    result.value = content
  } catch (e) {
    console.error(e)
    error.value = e?.message || '分析失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.smart-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.error-alert {
  margin-top: 4px;
}

.placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  padding: 8px 0;
}

.analysis-result {
  flex: 1;
  overflow: auto;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.analysis-result :deep(h1),
.analysis-result :deep(h2),
.analysis-result :deep(h3) {
  color: #fff;
}

.analysis-result :deep(pre),
.analysis-result :deep(code) {
  white-space: pre-wrap;
}
</style>