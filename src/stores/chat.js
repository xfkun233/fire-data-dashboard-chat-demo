import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // 读取环境变量（Vite）
  const ENV_API_URL = import.meta.env?.VITE_DEEPSEEK_API_URL || ''
  const ENV_API_KEY = import.meta.env?.VITE_DEEPSEEK_API_KEY || ''
  const ENV_MODEL   = import.meta.env?.VITE_DEEPSEEK_MODEL || ''

  // 对话列表
  const conversations = ref([])
  // 当前对话ID
  const currentConversationId = ref(null)
  // 消息列表
  const messages = ref([])
  // 加载状态
  const isLoading = ref(false)
  // 流式响应状态
  const isStreaming = ref(false)
  // 当前流式消息内容
  const streamingContent = ref('')
  // 当前流式“思考过程”内容
  const streamingThinkingContent = ref('')
  
  // AI设置（默认优先使用环境变量，用户手动输入后将覆盖并持久化）
  const settings = ref({
    apiUrl: ENV_API_URL || 'https://api.deepseek.com/v1',
    apiKey: ENV_API_KEY || '',
    modelName: ENV_MODEL || 'deepseek-chat',
    enableThinking: false,
    maxTokens: 4000,
    temperature: 0.7
  })
  
  // 计算属性：当前对话
  const currentConversation = computed(() => {
    return conversations.value.find(conv => conv.id === currentConversationId.value)
  })
  
  // 计算属性：当前对话的消息
  const currentMessages = computed(() => {
    if (!currentConversationId.value) return []
    return messages.value.filter(msg => msg.conversationId === currentConversationId.value)
  })
  
  // 创建新对话
  const createConversation = (title = '新对话') => {
    const id = Date.now().toString()
    const conversation = {
      id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    conversations.value.unshift(conversation)
    currentConversationId.value = id
    return conversation
  }
  
  // 切换对话
  const switchConversation = (conversationId) => {
    currentConversationId.value = conversationId
  }
  
  // 删除对话
  const deleteConversation = (conversationId) => {
    const index = conversations.value.findIndex(conv => conv.id === conversationId)
    if (index > -1) {
      conversations.value.splice(index, 1)
      // 删除对话相关的消息
      messages.value = messages.value.filter(msg => msg.conversationId !== conversationId)
      // 如果删除的是当前对话，切换到第一个对话或创建新对话
      if (currentConversationId.value === conversationId) {
        if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        } else {
          currentConversationId.value = null
        }
      }
    }
  }
  
  // 更新对话标题
  const updateConversationTitle = (conversationId, title) => {
    const conversation = conversations.value.find(conv => conv.id === conversationId)
    if (conversation) {
      conversation.title = title
      conversation.updatedAt = new Date().toISOString()
    }
  }
  
  // 添加消息（可包含thinking字段）
  const addMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      conversationId: currentConversationId.value,
      timestamp: new Date().toISOString(),
      thinking: '',
      ...message
    }
    messages.value.push(newMessage)
    
    // 更新对话的最后更新时间
    const conversation = conversations.value.find(conv => conv.id === currentConversationId.value)
    if (conversation) {
      conversation.updatedAt = new Date().toISOString()
      // 如果是用户消息且对话标题是默认的，自动更新标题
      if (message.role === 'user' && conversation.title === '新对话') {
        const title = message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
        updateConversationTitle(currentConversationId.value, title)
      }
    }
    
    return newMessage
  }
  
  // 更新消息内容（用于流式响应）
  const updateMessage = (messageId, content) => {
    const message = messages.value.find(msg => msg.id === messageId)
    if (message) {
      message.content = content
      message.timestamp = new Date().toISOString()
    }
  }

  // 更新消息的思考内容
  const updateMessageThinking = (messageId, thinking) => {
    const message = messages.value.find(msg => msg.id === messageId)
    if (message) {
      message.thinking = thinking
      message.timestamp = new Date().toISOString()
    }
  }
  
  // 删除消息
  const deleteMessage = (messageId) => {
    const index = messages.value.findIndex(msg => msg.id === messageId)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }
  
  // 清空当前对话消息
  const clearCurrentMessages = () => {
    if (currentConversationId.value) {
      messages.value = messages.value.filter(msg => msg.conversationId !== currentConversationId.value)
    }
  }
  
  // 设置加载状态
  const setLoading = (loading) => {
    isLoading.value = loading
  }
  
  // 设置流式响应状态
  const setStreaming = (streaming) => {
    isStreaming.value = streaming
    if (!streaming) {
      streamingContent.value = ''
      streamingThinkingContent.value = ''
    }
  }
  
  // 更新流式内容
  const updateStreamingContent = (content) => {
    streamingContent.value = content
  }

  // 更新流式思考内容
  const updateStreamingThinkingContent = (content) => {
    streamingThinkingContent.value = content
  }
  
  // 获取设置
  const getSettings = () => {
    return { ...settings.value }
  }
  
  // 更新设置
  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
  }
  
  // 检查设置是否完整
  const isSettingsValid = () => {
    return settings.value.apiUrl && settings.value.apiKey && settings.value.modelName
  }
  
  // 重置设置为默认值（再次以 env 为默认）
  const resetSettings = () => {
    settings.value = {
      apiUrl: ENV_API_URL || 'https://api.deepseek.com/v1',
      apiKey: ENV_API_KEY || '',
      modelName: ENV_MODEL || 'deepseek-chat',
      enableThinking: false,
      maxTokens: 4000,
      temperature: 0.7
    }
  }
  
  // 重置所有状态
  const reset = () => {
    conversations.value = []
    currentConversationId.value = null
    messages.value = []
    isLoading.value = false
    isStreaming.value = false
    streamingContent.value = ''
    streamingThinkingContent.value = ''
  }
  
  return {
    // 状态
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    streamingThinkingContent,
    settings,
    
    // 计算属性
    currentConversation,
    currentMessages,
    
    // 方法
    createConversation,
    switchConversation,
    deleteConversation,
    updateConversationTitle,
    addMessage,
    updateMessage,
    updateMessageThinking,
    deleteMessage,
    clearCurrentMessages,
    setLoading,
    setStreaming,
    updateStreamingContent,
    updateStreamingThinkingContent,
    getSettings,
    updateSettings,
    isSettingsValid,
    resetSettings,
    reset
  }
}, {
  persist: {
    key: 'chat-store',
    storage: localStorage,
    paths: ['conversations', 'messages', 'currentConversationId', 'settings']
  }
})