<template>
  <a-modal
    v-model:visible="visible"
    title="AI 设置"
    :width="600"
    @ok="handleSave"
    @cancel="handleCancel"
    ok-text="保存"
    cancel-text="取消"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="settings-form"
    >
      <a-form-item label="接口地址" field="apiUrl" required>
        <a-input
          v-model="formData.apiUrl"
          placeholder="请输入API接口地址，如：https://api.openai.com/v1"
          allow-clear
        />
        <div class="form-tip">支持OpenAI兼容接口，如DeepSeek、通义千问等</div>
      </a-form-item>

      <a-form-item label="API 密钥" field="apiKey" required>
        <a-input-password
          v-model="formData.apiKey"
          placeholder="请输入API密钥"
          allow-clear
        />
        <div class="form-tip">您的API密钥将安全存储在本地</div>
      </a-form-item>

      <a-form-item label="模型名称" field="modelName" required>
        <a-input
          v-model="formData.modelName"
          placeholder="请输入模型名称，如：deepseek-chat"
          allow-clear
        />
        <div class="form-tip">请根据您使用的服务商填写正确的模型名称</div>
      </a-form-item>

      <a-form-item label="启用 Thinking 模式" field="enableThinking">
        <a-switch
          v-model="formData.enableThinking"
          checked-text="开启"
          unchecked-text="关闭"
        />
        <div class="form-tip">开启后模型会显示思考过程（仅支持部分模型）</div>
      </a-form-item>

      <a-form-item label="最大 Token 数" field="maxTokens">
        <a-input-number
          v-model="formData.maxTokens"
          :min="100"
          :max="32000"
          :step="100"
          placeholder="4000"
          style="width: 200px"
        />
        <div class="form-tip">控制单次回复的最大长度</div>
      </a-form-item>

      <a-form-item label="温度参数" field="temperature">
        <a-slider
          v-model="formData.temperature"
          :min="0"
          :max="2"
          :step="0.1"
          :format-tooltip="(value) => `${value}`"
          style="width: 300px"
        />
        <div class="form-tip">控制回复的随机性，0为最确定，2为最随机</div>
      </a-form-item>
    </a-form>

    <template #footer>
      <div class="modal-footer">
        <a-button @click="handleReset" style="margin-right: auto;">重置为默认</a-button>
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useChatStore } from '../stores/chat'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const chatStore = useChatStore()
const formRef = ref()
const saving = ref(false)

const visible = ref(props.modelValue)

const formData = reactive({
  apiUrl: '',
  apiKey: '',
  modelName: '',
  enableThinking: false,
  maxTokens: 4000,
  temperature: 0.7
})

const rules = {
  apiUrl: [
    { required: true, message: '请输入API接口地址' },
    { 
      validator: (value, callback) => {
        try {
          new URL(value)
          callback()
        } catch {
          callback('请输入有效的URL地址')
        }
      }
    }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥' },
    { min: 10, message: 'API密钥长度至少10位' }
  ],
  modelName: [
    { required: true, message: '请输入模型名称' },
    { min: 2, message: '模型名称至少2个字符' }
  ]
}

// 监听外部visible变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    loadSettings()
  }
})

// 监听内部visible变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 加载设置
const loadSettings = () => {
  const settings = chatStore.getSettings()
  formData.apiUrl = settings.apiUrl || ''
  formData.apiKey = settings.apiKey || ''
  formData.modelName = settings.modelName || ''
  formData.enableThinking = settings.enableThinking || false
  formData.maxTokens = settings.maxTokens || 4000
  formData.temperature = settings.temperature || 0.7
}

// 保存设置
const handleSave = async () => {
  // 先进行表单校验，并给出具体错误信息
  try {
    await formRef.value.validate()
  } catch (errors) {
    let messages = []
    if (Array.isArray(errors)) {
      messages = errors.map(e => e?.message).filter(Boolean)
    } else if (errors && Array.isArray(errors?.errors)) {
      messages = errors.errors.map(e => e?.message).filter(Boolean)
    }
    Message.warning(messages.length ? messages.join('；') : '请检查表单输入')
    return
  }

  saving.value = true
  try {
    // 额外验证API连接
    try {
      await testApiConnection()
    } catch (testError) {
      const shouldContinue = await new Promise((resolve) => {
        Modal.confirm({
          title: 'API连接测试失败',
          content: `无法连接到API服务：${testError.message}\n\n是否仍要保存设置？`,
          okText: '仍要保存',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        })
      })
      
      if (!shouldContinue) {
        return
      }
    }
    
    // 保存到store
    chatStore.updateSettings({
      apiUrl: formData.apiUrl,
      apiKey: formData.apiKey,
      modelName: formData.modelName,
      enableThinking: formData.enableThinking,
      maxTokens: formData.maxTokens,
      temperature: formData.temperature
    })

    Message.success('设置保存成功')
    visible.value = false
    emit('saved')
  } catch (error) {
    console.error('保存设置失败:', error)
    Message.error(`保存设置失败：${error.message || '未知错误'}`)
  } finally {
    saving.value = false
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
}

// 测试API连接
const testApiConnection = async () => {
  // 规范化拼接 chat/completions 路径（兼容填入基础路径或完整路径）
  const base = (formData.apiUrl || '').replace(/\/$/, '')
  const testUrl = /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`
  
  const response = await fetch(testUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${formData.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: formData.modelName,
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
      max_tokens: 1
    })
  })
  
  if (!response.ok) {
    // 尝试读取错误信息
    let detail = ''
    try {
      const errJson = await response.json()
      detail = errJson?.error?.message || JSON.stringify(errJson)
    } catch {}
    throw new Error(`HTTP ${response.status}: ${response.statusText}${detail ? ' - ' + detail : ''}`)
  }
  
  // 可选：解析一次返回，确认结构
  try {
    const data = await response.json()
    if (!data || !data.choices) {
      throw new Error('返回结构异常：未包含 choices')
    }
  } catch (e) {
    throw new Error(e.message || '解析返回结果失败')
  }
  
  return true
}

// 重置为默认（优先使用环境变量，通过 store.resetSettings() 应用）
const handleReset = () => {
  Modal.confirm({
    title: '确认重置',
    content: '确定要重置为默认设置吗？这将清空当前所有配置。',
    okText: '确认重置',
    cancelText: '取消',
    onOk: () => {
      chatStore.resetSettings()
      loadSettings()
      Message.info('已重置为默认设置（来自环境变量或内置默认）')
    }
  })
}
</script>

<style scoped>
.settings-form {
  max-height: 500px;
  overflow-y: auto;
}

.form-tip {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.arco-form-item) {
  margin-bottom: 20px;
}

:deep(.arco-form-item-label) {
  font-weight: 500;
  color: var(--color-text-1);
}

:deep(.arco-input-wrapper) {
  border-radius: 6px;
}

:deep(.arco-input-number) {
  border-radius: 6px;
}

:deep(.arco-slider) {
  margin: 8px 0;
}
</style>