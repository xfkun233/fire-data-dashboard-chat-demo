// OpenAI兼容 API 服务
class DeepSeekService {
  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    this.baseURL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'
    this.model = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
    this.maxTokens = 4000
    this.temperature = 0.7
    this.enableThinking = false
  }
  
  /**
   * 更新配置
   * @param {Object} config - 配置对象
   */
  updateConfig(config) {
    this.apiKey = config.apiKey || this.apiKey
    this.baseURL = config.apiUrl || config.baseURL || this.baseURL
    this.model = config.modelName || config.model || this.model
    this.temperature = config.temperature || this.temperature
    this.maxTokens = config.maxTokens || this.maxTokens
    this.enableThinking = config.enableThinking !== undefined ? config.enableThinking : this.enableThinking
  }
  
  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      apiKey: this.apiKey,
      apiUrl: this.baseURL,
      modelName: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      enableThinking: this.enableThinking
    }
  }

  // 规范化拼接 chat/completions 路径（兼容用户填入完整路径或基础路径）
  _getCompletionsUrl() {
    if (!this.baseURL) return '/chat/completions'
    const trimmed = this.baseURL.replace(/\/$/, '')
    if (/\/chat\/completions$/.test(trimmed)) return trimmed
    return `${trimmed}/chat/completions`
  }

  // 仅DeepSeek自家R1/Reasoner模型并且主机为deepseek.com时才发送thinking参数
  _isDeepSeekHost() {
    try {
      const url = new URL(this.baseURL)
      return /(^|\.)deepseek\.com$/i.test(url.hostname)
    } catch {
      return false
    }
  }

  _modelSupportsThinking() {
    const name = (this.model || '').toLowerCase()
    return name.includes('r1') || name.includes('reasoner')
  }

  // Ark(方舟) 主机与模型支持判断（deepseek v3.1 也支持 thinking 参数）
  _isArkHost() {
    try {
      const url = new URL(this.baseURL)
      return /(^|\.)ark\.cn-beijing\.volces\.com$/i.test(url.hostname)
    } catch {
      return false
    }
  }

  _arkModelSupportsThinking() {
    const name = (this.model || '').toLowerCase()
    return name.includes('v3-1') || name.includes('v3.1') || name.includes('reasoner') || name.includes('r1')
  }

  _buildCommonPayload(messages, { stream = false } = {}) {
    const payload = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      top_p: 0.9
    }
    if (stream) payload.stream = true

    // 按不同服务商规范设置 thinking 参数
    if (this.enableThinking) {
      if (this._isArkHost() && this._arkModelSupportsThinking()) {
        // Ark要求为对象形态
        payload.thinking = { type: 'enabled' }
      } else if (this._isDeepSeekHost() && this._modelSupportsThinking()) {
        // DeepSeek自家R1/Reasoner保留为布尔（如后续需要再按官方文档切换为对象形态）
        payload.thinking = true
      }
    }

    return payload
  }

  /**
   * 发送聊天请求（流式响应）
   * @param {Array} messages - 消息历史
   * @param {Function} onChunk - 流式数据回调
   * @param {Function} onComplete - 完成回调
   * @param {Function} onError - 错误回调
   */
  async streamChat(messages, onChunk, onComplete, onError, onThinkingChunk) {
    try {
      const url = this._getCompletionsUrl()
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(this._buildCommonPayload(messages, { stream: true }))
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let fullThinking = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.trim() === 'data: [DONE]') {
            onThinkingChunk?.(fullThinking)
            onComplete(fullContent)
            return fullContent
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              const deltaObj = data.choices?.[0]?.delta || {}
              const contentDelta = deltaObj.content
              // 兼容不同厂商思考字段
              const thinkingDelta = 
                deltaObj.reasoning_content || 
                deltaObj.thinking || 
                data.reasoning_content || 
                data.thinking
              
              if (typeof thinkingDelta === 'string' && thinkingDelta.length) {
                fullThinking += thinkingDelta
                onThinkingChunk?.(fullThinking)
              }
              
              if (typeof contentDelta === 'string' && contentDelta.length) {
                fullContent += contentDelta
                onChunk(fullContent)
              }
            } catch (e) {
              console.warn('解析SSE数据失败:', e)
            }
          }
        }
      }

      onThinkingChunk?.(fullThinking)
      onComplete(fullContent)
      return fullContent

    } catch (error) {
      console.error('DeepSeek API调用失败:', error)
      onError?.(error)
      throw error
    }
  }

  /**
   * 发送聊天请求（非流式）
   * @param {Array} messages - 消息历史
   */
  async chat(messages) {
    try {
      const url = this._getCompletionsUrl()
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(this._buildCommonPayload(messages))
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content

    } catch (error) {
      console.error('DeepSeek API调用失败:', error)
      throw error
    }
  }

  /**
   * 检查API配置是否完整
   */
  isConfigured() {
    return !!(this.apiKey && this.baseURL && this.model)
  }

  /**
   * 设置API密钥
   * @param {string} apiKey 
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey
  }
  
  /**
   * 验证配置
   */
  validateConfig() {
    const errors = []
    
    if (!this.apiKey) {
      errors.push('API密钥不能为空')
    }
    
    if (!this.baseURL) {
      errors.push('API地址不能为空')
    } else {
      try {
        new URL(this.baseURL)
      } catch {
        errors.push('API地址格式不正确')
      }
    }
    
    if (!this.model) {
      errors.push('模型名称不能为空')
    }
    
    if (this.maxTokens < 100 || this.maxTokens > 32000) {
      errors.push('最大Token数应在100-32000之间')
    }
    
    if (this.temperature < 0 || this.temperature > 2) {
      errors.push('温度参数应在0-2之间')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 创建单例实例
const deepseekService = new DeepSeekService()

export default deepseekService

// 导出类以便测试
export { DeepSeekService }