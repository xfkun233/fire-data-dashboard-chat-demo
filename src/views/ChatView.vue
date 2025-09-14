<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <a-button type="primary" @click="createNewChat" block>
          <template #icon>
            <icon-plus />
          </template>
          新建对话
        </a-button>
      </div>
      
      <div class="conversation-list">
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: conversation.id === currentConversationId }"
          @click="switchChat(conversation.id)"
        >
          <div class="conversation-content">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-time">{{ formatTime(conversation.updatedAt) }}</div>
          </div>
          <a-dropdown trigger="click" @select="handleConversationAction">
            <a-button type="text" size="small" class="conversation-menu">
              <template #icon>
                <icon-more />
              </template>
            </a-button>
            <template #content>
              <a-doption :value="{ action: 'rename', id: conversation.id }">
                <template #icon>
                  <icon-edit />
                </template>
                重命名
              </a-doption>
              <a-doption :value="{ action: 'delete', id: conversation.id }" class="danger">
                <template #icon>
                  <icon-delete />
                </template>
                删除
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
    
    <!-- 主聊天区域 -->
    <div class="chat-main">
      <div class="chat-header">
        <h2>{{ currentConversation?.title || 'AI 助手' }}</h2>
        <div class="chat-actions">
          <a-button type="text" @click="showSettings">
            <template #icon>
              <icon-settings />
            </template>
            设置
          </a-button>
          <a-button type="text" @click="clearCurrentChat">
            <template #icon>
              <icon-delete />
            </template>
            清空对话
          </a-button>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="currentMessages.length === 0" class="empty-state">
          <div class="empty-icon">
            <icon-robot />
          </div>
          <h3>开始与 AI 对话</h3>
          <p>发送消息开始您的对话，我会尽力为您提供帮助。</p>
        </div>
        
        <div 
          v-for="message in currentMessages" 
          :key="message.id"
          class="message-item"
          :class="message.role"
        >
          <div class="message-avatar">
            <icon-user v-if="message.role === 'user'" />
            <icon-robot v-else />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '您' : 'AI 助手' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>

            <!-- 思考过程块（已完成的消息） -->
            <div v-if="message.role==='assistant' && message.thinking" class="thinking-block">
              <div class="thinking-header" @click="toggleThinking(message)">
                <span class="thinking-title">思考过程</span>
                <a-tag size="small" color="arcoblue" v-if="!message._thinkingCollapsed">已展开</a-tag>
                <a-tag size="small" v-else>已折叠</a-tag>
              </div>
              <transition name="fade">
                <div class="thinking-content" v-show="!message._thinkingCollapsed">
                  <pre>{{ message.thinking }}</pre>
                </div>
              </transition>
            </div>

            <div class="message-text" v-html="renderMessage(message.content)"></div>
          </div>
        </div>
        
        <!-- 流式响应消息 -->
        <div v-if="isStreaming" class="message-item assistant">
          <div class="message-avatar">
            <icon-robot />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">AI 助手</span>
              <span class="message-time">正在输入...</span>
            </div>

            <!-- 流式思考过程，实时显示，完成后自动折叠 -->
            <div v-if="streamingThinkingContent" class="thinking-block live">
              <div class="thinking-header">
                <span class="thinking-title">思考过程（进行中）</span>
              </div>
              <div class="thinking-content">
                <pre>{{ streamingThinkingContent }}</pre>
              </div>
            </div>

            <div class="message-text" v-html="renderMessage(streamingContent)"></div>
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="input-container">
          <a-textarea 
            v-model="inputMessage"
            placeholder="输入您的问题..."
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keydown="handleKeyDown"
            :disabled="isLoading || isStreaming"
          />
          <a-button 
            type="primary" 
            @click="sendMessage"
            :loading="isLoading || isStreaming"
            :disabled="!inputMessage.trim()"
            class="send-button"
          >
            <template #icon>
              <icon-send />
            </template>
          </a-button>
        </div>
        <div class="input-tips">
          <span>按 Ctrl + Enter 发送消息</span>
        </div>
      </div>
    </div>
    
    <!-- 设置弹窗 -->
    <SettingsModal 
      v-model:modelValue="settingsVisible" 
      @saved="onSettingsSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { 
  IconPlus, 
  IconMore, 
  IconEdit, 
  IconDelete, 
  IconUser, 
  IconRobot, 
  IconSend,
  IconSettings
} from '@arco-design/web-vue/es/icon'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import deepseekService from '@/services/deepseek'
import SettingsModal from '@/components/SettingsModal.vue'

// 初始化markdown解析器
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

// 使用chat store
const chatStore = useChatStore()
const { 
  conversations, 
  currentConversationId, 
  currentConversation,
  currentMessages,
  isLoading,
  isStreaming,
  streamingContent,
  streamingThinkingContent
} = storeToRefs(chatStore)

// 新增：本地UI所需的refs
const inputMessage = ref('')
const messagesContainer = ref(null)
const settingsVisible = ref(false)

// 思考折叠状态切换
const toggleThinking = (message) => {
  message._thinkingCollapsed = !message._thinkingCollapsed
}

// 新增：对话管理与消息发送方法
const createNewChat = () => {
  const conv = chatStore.createConversation('新对话')
  nextTick(() => scrollToBottom())
  return conv
}

const switchChat = (conversationId) => {
  chatStore.switchConversation(conversationId)
  nextTick(() => scrollToBottom())
}

const clearCurrentChat = () => {
  chatStore.clearCurrentMessages()
}

const handleConversationAction = async ({ action, id }) => {
  if (action === 'rename') {
    const target = conversations.value.find(c => c.id === id)
    const newTitle = prompt('输入新的对话标题：', target?.title || '')
    if (newTitle && newTitle.trim()) {
      chatStore.updateConversationTitle(id, newTitle.trim())
    }
  } else if (action === 'delete') {
    if (confirm('确定删除该对话吗？此操作不可恢复。')) {
      chatStore.deleteConversation(id)
    }
  }
}

const sendMessage = async () => {
  const content = (inputMessage.value || '').trim()
  if (!content) return
  chatStore.addMessage({ role: 'user', content })
  inputMessage.value = ''
  await nextTick()
  scrollToBottom()
  await callAI(content)
}

// 调用AI API（OpenAI兼容接口）
const callAI = async (userMessage) => {
  try {
    chatStore.setLoading(true)
    chatStore.setStreaming(true)
    chatStore.updateStreamingThinkingContent('')
    chatStore.updateStreamingContent('')
    
    // 更新API服务配置
    const settings = chatStore.getSettings()
    deepseekService.updateConfig(settings)
    
    // 构建消息历史
    const messages = currentMessages.value.map(msg => ({
      role: msg.role,
      content: String(msg.content ?? '')
    }))
    
    // 配置检查和验证
    if (!deepseekService.isConfigured()) {
      const response = await simulateStreamResponse(userMessage)
      chatStore.addMessage({ role: 'assistant', content: response })
      return
    }
    const validation = deepseekService.validateConfig()
    if (!validation.isValid) {
      const response = await simulateStreamResponse(userMessage)
      chatStore.addMessage({ role: 'assistant', content: response })
      return
    }
    
    // 流式调用：解析可见内容与思考内容
    let finalResponse = ''
    let finalThinking = ''
    await deepseekService.streamChat(
      messages,
      // onChunk -> 可见内容
      (chunkText) => {
        chatStore.updateStreamingContent(chunkText)
        nextTick(() => scrollToBottom())
      },
      // onComplete
      (content) => {
        finalResponse = content
        const added = chatStore.addMessage({ role: 'assistant', content: finalResponse, thinking: finalThinking })
        if (added) {
          const msg = currentMessages.value.find(m => m.id === added.id)
          if (msg) msg._thinkingCollapsed = true // 完成后自动折叠
        }
      },
      // onError
      (error) => {
        console.error('DeepSeek API调用失败:', error)
        chatStore.addMessage({ role: 'assistant', content: '抱歉，我遇到了一些问题，请稍后再试。' + (error?.message ? `\n\n错误详情：${error.message}` : '') })
      },
      // onThinkingChunk -> 思考过程
      (thinkingText) => {
        finalThinking = thinkingText || ''
        chatStore.updateStreamingThinkingContent(finalThinking)
        nextTick(() => scrollToBottom())
      }
    )
  } catch (error) {
    console.error('AI API调用失败:', error)
    const response = await simulateStreamResponse(userMessage)
    chatStore.addMessage({ role: 'assistant', content: response + '\n\n*注意：当前使用模拟响应。*' })
  } finally {
    // 结束清理：清空实时思考区与流式内容
    chatStore.setLoading(false)
    chatStore.setStreaming(false)
    chatStore.updateStreamingThinkingContent('')
    chatStore.updateStreamingContent('')
    await nextTick()
    scrollToBottom()
  }
}

const simulateStreamResponse = async (userMessage) => {
  const responses = [
    '我理解您的问题。',
    '让我为您详细解答：',
    '\n\n这是一个很好的问题。根据我的理解，',
    '我可以从以下几个方面来回答：',
    '\n\n1. **首先**，我们需要考虑...',
    '\n2. **其次**，还要注意...',
    '\n3. **最后**，建议您...',
    '\n\n希望这个回答对您有帮助！如果您还有其他问题，请随时告诉我。'
  ]
  
  let fullResponse = ''
  
  for (let i = 0; i < responses.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
    fullResponse += responses[i]
    chatStore.updateStreamingContent(fullResponse)
    await nextTick()
    scrollToBottom()
  }
  
  return fullResponse
}

// 渲染消息内容
const renderMessage = (content) => {
  return md.render(content)
}

// 显示设置弹窗
const showSettings = () => {
  settingsVisible.value = true
}

// 设置保存后的回调
const onSettingsSaved = () => {
  // 重新初始化API服务配置
  const settings = chatStore.getSettings()
  deepseekService.updateConfig(settings)
  
  // 验证新配置
  const validation = deepseekService.validateConfig()
  if (validation.isValid) {
    console.log('设置已保存并验证通过')
  } else {
    console.warn('设置保存但验证失败:', validation.errors)
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 处理键盘事件
const handleKeyDown = (event) => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault()
    sendMessage()
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化API服务配置
  const settings = chatStore.getSettings()
  deepseekService.updateConfig(settings)
  
  // 如果没有对话，创建第一个对话
  if (conversations.value.length === 0) {
    createNewChat()
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background: #f8f9fa;
}

.conversation-item.active {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.conversation-menu {
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conversation-menu {
  opacity: 1;
}

/* 主聊天区域样式 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.chat-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.message-item {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin: 0 12px;
}

.message-item.user .message-avatar {
  background: #1890ff;
  color: white;
}

.message-item.assistant .message-avatar {
  background: #f0f0f0;
  color: #666;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 56px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-role {
  font-weight: 500;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-text {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-item.user .message-text {
  background: #1890ff;
  color: white;
}

.message-item.assistant .message-text {
  background: #f8f9fa;
  color: #333;
}

/* 代码高亮样式 */
.message-text :deep(.hljs) {
  background: #f6f8fa !important;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.message-item.user .message-text :deep(.hljs) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  margin-right: 4px;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* 输入区域样式 */
.chat-input {
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  background: white;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-container :deep(.arco-textarea) {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
}

.input-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* 危险操作样式 */
.danger {
  color: #f53f3f;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }
  
  .chat-header {
    padding: 12px 16px;
  }
  
  .chat-messages {
    padding: 12px 16px;
  }
  
  .chat-input {
    padding: 12px 16px;
  }
}

/* 思考块样式（合并） */
.thinking-block {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 6px 0 10px 0;
}
.thinking-block.live {
  border-style: dashed;
}
.thinking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.thinking-title {
  font-size: 12px;
  color: #86909c;
}
.thinking-content {
  margin-top: 6px;
  white-space: pre-wrap;
  color: #4e5969;
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>