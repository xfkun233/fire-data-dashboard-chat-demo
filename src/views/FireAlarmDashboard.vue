<template>
  <div class="fire-alarm-dashboard">
    <!-- 顶部标题栏 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <el-icon class="logo-icon"><Warning /></el-icon>
            <span class="logo-text">火灾预警数据看板</span>
          </div>
          <div class="system-info">
            <div class="current-time">{{ currentTime }}</div>
            <div class="system-status">
              <el-tag 
                :type="systemStatus.type" 
                :class="{ 'blinking': systemStatus.level === 'critical' }"
                size="large"
                class="status-tag"
              >
                <span class="status-text">{{ systemStatus.text }}</span>
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <div class="quick-actions">
            <el-button type="danger" @click="emergencyResponse" :disabled="!hasEmergency">
              <el-icon><AlarmClock /></el-icon>
              紧急响应
            </el-button>
            <el-button type="warning" @click="silenceAllAlarms" :disabled="!hasActiveAlarms">
              <el-icon><Mute /></el-icon>
              静音报警
            </el-button>
            <el-button type="primary" @click="refreshAll">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
          
          <div class="layout-controls">
            <el-tooltip content="全屏显示" placement="bottom">
              <el-button type="info" @click="toggleFullscreen">
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="dashboard-content" :class="{ 'fullscreen': isFullscreen }">
      <div class="dashboard-grid">
        <!-- 第一行：火灾预警状态和紧急响应 -->
        <div class="row-container row-1">
          <section class="tile tile-fire">
            <div class="tile-header">火灾预警状态</div>
            <div class="tile-body">
              <FireAlarmStatus ref="fireAlarmRef" @status-change="handleStatusChange" />
            </div>
          </section>

          <section class="tile tile-temperature">
            <div class="tile-header">温湿度监控</div>
            <div class="tile-body">
              <TemperatureHumidity ref="temperatureRef" @alert="handleAlert" />
            </div>
          </section>
        </div>

        <!-- 第二行：紧急响应和传感器数据 -->
        <div class="row-container row-2">
          <section class="tile tile-emergency">
            <div class="tile-header">紧急响应</div>
            <div class="tile-body">
              <EmergencyResponse ref="emergencyRef" @emergency-action="handleEmergencyAction" />
            </div>
          </section>

          <section class="tile tile-sensor">
            <div class="tile-header">传感器数据</div>
            <div class="tile-body">
              <FireSensorData ref="sensorRef" @sensor-alert="handleSensorAlert" />
            </div>
          </section>
        </div>

        <!-- 第三行：视频监控 -->
        <section class="tile tile-video">
          <div class="tile-header">视频监控</div>
          <div class="tile-body">
            <VideoMonitoring ref="videoRef" @fire-detected="handleFireDetected" />
          </div>
        </section>

        <!-- 第四行：故障检测 -->
        <section class="tile tile-fault">
          <div class="tile-header">故障检测</div>
          <div class="tile-body">
            <FaultDetection ref="faultRef" @fault-alert="handleFaultAlert" />
          </div>
        </section>

        <!-- 第五行：历史数据与趋势 -->
        <section class="tile tile-history">
          <div class="tile-header">历史数据与趋势</div>
          <div class="tile-body">
            <HistoryTrends ref="historyRef" @trend-alert="handleTrendAlert" />
          </div>
        </section>

        <!-- 第六行：智能分析建议 -->
        <section class="tile tile-analysis">
          <div class="tile-header">智能分析建议</div>
          <div class="tile-body">
            <SmartAnalysis :build-messages="buildAnalysisMessages" />
          </div>
        </section>
      </div>
    </div>

    <!-- 浮动通知面板 -->
    <div class="notification-panel" v-if="notifications.length > 0">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon><Bell /></el-icon>
          <span>实时通知</span>
        </div>
        <el-button type="text" @click="clearNotifications">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="notification-list">
        <div 
          v-for="notification in notifications.slice(0, 5)" 
          :key="notification.id"
          class="notification-item"
          :class="`severity-${notification.severity}`"
        >
          <div class="notification-icon">
            <el-icon><component :is="getNotificationIcon(notification.type)" /></el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
          <div class="notification-actions">
            <el-button type="text" size="small" @click="dismissNotification(notification.id)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <!-- 紧急响应对话框 -->
    <el-dialog 
      v-model="emergencyDialogVisible" 
      title="紧急响应" 
      width="800px"
      :show-close="false"
      :close-on-click-modal="false"
    >
      <div class="emergency-response">
        <div class="emergency-header">
          <el-alert 
            title="检测到火灾紧急情况！" 
            type="error" 
            :closable="false"
            show-icon
          >
            <template #default>
              <div>系统已自动启动紧急响应程序，请立即采取相应措施。</div>
            </template>
          </el-alert>
        </div>
        
        <div class="emergency-actions">
          <div class="action-group">
            <div class="action-title">疏散指令</div>
            <div class="action-buttons">
              <el-button type="danger" size="large" @click="startEvacuation">
                <el-icon><Position /></el-icon>
                启动疏散程序
              </el-button>
              <el-button type="warning" size="large" @click="broadcastEvacuation">
                <el-icon><Microphone /></el-icon>
                广播疏散通知
              </el-button>
            </div>
          </div>
          
          <div class="action-group">
            <div class="action-title">灭火系统</div>
            <div class="action-buttons">
              <el-button type="primary" size="large" @click="activateFireSuppression">
                <el-icon><MagicStick /></el-icon>
                启动自动灭火
              </el-button>
              <el-button type="info" size="large" @click="manualFireControl">
                <el-icon><Operation /></el-icon>
                手动灭火控制
              </el-button>
            </div>
          </div>
          
          <div class="action-group">
            <div class="action-title">紧急联络</div>
            <div class="action-buttons">
              <el-button type="danger" size="large" @click="callFireDepartment">
                <el-icon><Phone /></el-icon>
                呼叫消防部门
              </el-button>
              <el-button type="warning" size="large" @click="notifyManagement">
                <el-icon><Message /></el-icon>
                通知管理层
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="success" @click="confirmEmergencyHandled">
            <el-icon><CircleCheck /></el-icon>
            确认处理完成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import FireAlarmStatus from '../components/FireAlarmStatus.vue'
import TemperatureHumidity from '../components/TemperatureHumidity.vue'
import FireSensorData from '../components/FireSensorData.vue'
import EmergencyResponse from '../components/EmergencyResponse.vue'
import VideoMonitoring from '../components/VideoMonitoring.vue'
import FaultDetection from '../components/FaultDetection.vue'
import HistoryTrends from '../components/HistoryTrends.vue'
import SmartAnalysis from '../components/SmartAnalysis.vue'

// 响应式数据
const currentTime = ref('')
const isFullscreen = ref(false)
const layoutDialogVisible = ref(false)
const emergencyDialogVisible = ref(false)
const notifications = ref([])
const systemAlerts = ref([])

// 设置相关
const displayMode = ref('normal')
const autoRefresh = ref(true)
const refreshInterval = ref(10000)
const soundEnabled = ref(true)
const themeColor = ref('blue')

// 组件引用
const fireAlarmRef = ref(null)
const temperatureRef = ref(null)
const sensorRef = ref(null)
const emergencyRef = ref(null)
const videoRef = ref(null)
const faultRef = ref(null)
const historyRef = ref(null)

// 定时器
let timeInterval = null
let refreshTimer = null

// 计算属性
const systemStatus = computed(() => {
  const criticalAlerts = systemAlerts.value.filter(alert => alert.severity === 'critical')
  const highAlerts = systemAlerts.value.filter(alert => alert.severity === 'high')
  const mediumAlerts = systemAlerts.value.filter(alert => alert.severity === 'medium')
  
  if (criticalAlerts.length > 0) {
    return { type: 'danger', text: '紧急状态', level: 'critical' }
  } else if (highAlerts.length > 0) {
    return { type: 'danger', text: '火灾报警', level: 'high' }
  } else if (mediumAlerts.length > 0) {
    return { type: 'warning', text: '系统警告', level: 'medium' }
  } else {
    return { type: 'success', text: '系统正常', level: 'normal' }
  }
})

const hasEmergency = computed(() => {
  return systemAlerts.value.some(alert => alert.severity === 'critical' || alert.type === 'fire')
})

const hasActiveAlarms = computed(() => {
  return systemAlerts.value.some(alert => alert.isActive)
})

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

// 获取通知图标
const getNotificationIcon = (type) => {
  const iconMap = {
    fire: 'Warning',
    smoke: 'Smoking',
    temperature: 'Thermometer',
    fault: 'CircleCloseFilled',
    emergency: 'AlarmClock',
    system: 'Setting'
  }
  return iconMap[type] || 'Bell'
}

// 添加通知
const addNotification = (notification) => {
  const newNotification = {
    id: Date.now(),
    timestamp: Date.now(),
    ...notification
  }
  
  notifications.value.unshift(newNotification)
  
  // 限制通知数量
  if (notifications.value.length > 20) {
    notifications.value = notifications.value.slice(0, 20)
  }
  
  // 声音提醒
  if (soundEnabled.value && notification.severity === 'high') {
    playAlertSound()
  }
  
  // 系统通知
  ElNotification({
    title: notification.title,
    message: notification.message,
    type: notification.severity === 'high' ? 'error' : notification.severity === 'medium' ? 'warning' : 'info',
    duration: notification.severity === 'high' ? 0 : 4500,
    position: 'top-right'
  })
}

// 播放报警声音
const playAlertSound = () => {
  // 这里可以添加实际的声音播放逻辑
  console.log('播放报警声音')
}

// 处理状态变化
const handleStatusChange = (status) => {
  if (status.level === 'critical') {
    systemAlerts.value.push({
      id: Date.now(),
      type: 'fire',
      severity: 'critical',
      isActive: true,
      message: status.message
    })
    
    addNotification({
      type: 'fire',
      severity: 'high',
      title: '火灾报警',
      message: status.message
    })
    
    // 自动弹出紧急响应对话框
    emergencyDialogVisible.value = true
  }
}

// 处理温湿度报警
const handleAlert = (alert) => {
  systemAlerts.value.push({
    id: Date.now(),
    type: 'temperature',
    severity: alert.severity,
    isActive: true,
    message: alert.message
  })
  
  addNotification({
    type: 'temperature',
    severity: alert.severity,
    title: '温湿度报警',
    message: alert.message
  })
}

// 处理传感器报警
const handleSensorAlert = (alert) => {
  systemAlerts.value.push({
    id: Date.now(),
    type: 'smoke',
    severity: alert.severity,
    isActive: true,
    message: alert.message
  })
  
  addNotification({
    type: 'smoke',
    severity: alert.severity,
    title: '传感器报警',
    message: alert.message
  })
}

// 处理紧急响应动作
const handleEmergencyAction = (action) => {
  addNotification({
    type: 'emergency',
    severity: 'medium',
    title: '紧急响应',
    message: `已执行: ${action.name}`
  })
}

// 处理火焰检测
const handleFireDetected = (detection) => {
  systemAlerts.value.push({
    id: Date.now(),
    type: 'fire',
    severity: 'critical',
    isActive: true,
    message: `摄像头检测到火焰: ${detection.location}`
  })
  
  addNotification({
    type: 'fire',
    severity: 'high',
    title: '视频火焰检测',
    message: `摄像头检测到火焰: ${detection.location}`
  })
  
  emergencyDialogVisible.value = true
}

// 处理故障报警
const handleFaultAlert = (fault) => {
  systemAlerts.value.push({
    id: Date.now(),
    type: 'fault',
    severity: fault.severity,
    isActive: true,
    message: fault.message
  })
  
  addNotification({
    type: 'fault',
    severity: fault.severity,
    title: '设备故障',
    message: fault.message
  })
}

// 处理趋势报警
const handleTrendAlert = (trend) => {
  addNotification({
    type: 'system',
    severity: 'medium',
    title: '趋势分析',
    message: trend.message
  })
}

// 紧急响应
const emergencyResponse = () => {
  emergencyDialogVisible.value = true
}

// 静音所有报警
const silenceAllAlarms = () => {
  systemAlerts.value.forEach(alert => {
    alert.isActive = false
  })
  
  ElMessage({
    message: '所有报警已静音',
    type: 'success',
    duration: 2000
  })
}

// 刷新所有数据
const refreshAll = () => {
  ElMessage({
    message: '正在刷新所有数据...',
    type: 'info',
    duration: 1000
  })
  
  // 刷新各个组件
  setTimeout(() => {
    ElMessage({
      message: '数据刷新完成',
      type: 'success',
      duration: 2000
    })
  }, 1000)
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 显示布局设置
const showLayoutSettings = () => {
  layoutDialogVisible.value = true
}

// 处理布局对话框关闭
const handleLayoutDialogClose = () => {
  layoutDialogVisible.value = false
}

// 切换自动刷新
const toggleAutoRefresh = (enabled) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    refreshAll()
  }, refreshInterval.value)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 重置布局设置
const resetLayoutSettings = () => {
  displayMode.value = 'normal'
  autoRefresh.value = true
  refreshInterval.value = 10000
  soundEnabled.value = true
  themeColor.value = 'blue'
}

// 保存布局设置
const saveLayoutSettings = () => {
  // 这里可以保存到本地存储
  localStorage.setItem('dashboardSettings', JSON.stringify({
    displayMode: displayMode.value,
    autoRefresh: autoRefresh.value,
    refreshInterval: refreshInterval.value,
    soundEnabled: soundEnabled.value,
    themeColor: themeColor.value
  }))
  
  layoutDialogVisible.value = false
  
  ElMessage({
    message: '设置已保存',
    type: 'success',
    duration: 2000
  })
  
  // 应用自动刷新设置
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('dashboardSettings')
  if (saved) {
    const settings = JSON.parse(saved)
    displayMode.value = settings.displayMode || 'normal'
    autoRefresh.value = settings.autoRefresh !== false
    refreshInterval.value = settings.refreshInterval || 10000
    soundEnabled.value = settings.soundEnabled !== false
    themeColor.value = settings.themeColor || 'blue'
  }
}

// 清除通知
const clearNotifications = () => {
  notifications.value = []
}

// 关闭单个通知
const dismissNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 紧急响应动作
const startEvacuation = () => {
  ElMessage({
    message: '疏散程序已启动',
    type: 'success',
    duration: 2000
  })
}

const broadcastEvacuation = () => {
  ElMessage({
    message: '疏散通知已广播',
    type: 'success',
    duration: 2000
  })
}

const activateFireSuppression = () => {
  ElMessage({
    message: '自动灭火系统已启动',
    type: 'success',
    duration: 2000
  })
}

const manualFireControl = () => {
  ElMessage({
    message: '手动灭火控制已激活',
    type: 'success',
    duration: 2000
  })
}

const callFireDepartment = () => {
  ElMessage({
    message: '正在呼叫消防部门...',
    type: 'info',
    duration: 2000
  })
}

const notifyManagement = () => {
  ElMessage({
    message: '管理层通知已发送',
    type: 'success',
    duration: 2000
  })
}

const confirmEmergencyHandled = () => {
  emergencyDialogVisible.value = false
  systemAlerts.value = systemAlerts.value.filter(alert => alert.severity !== 'critical')
  
  ElMessage({
    message: '紧急情况处理完成',
    type: 'success',
    duration: 2000
  })
}

// 构建智能分析的 messages（供 SmartAnalysis 调用）
const buildAnalysisMessages = async () => {
  try {
    const temperature = temperatureRef.value?.getData?.()
    const sensors = sensorRef.value?.getData?.()
    const history = historyRef.value?.getData?.()
    const status = systemStatus.value
    const latest = notifications.value.slice(0, 5)

    const context = {
      timestamp: new Date().toLocaleString('zh-CN'),
      systemStatus: status,
      temperatureModule: temperature,
      sensorsModule: sensors,
      historyModule: history,
      latestNotifications: latest
    }

    const systemPrompt = [
      '你是消防安全与应急处置专家助手。',
      '基于传感器、温湿度、历史趋势与当前系统状态，输出对班组值班友好、可执行的建议。',
      '请严格按以下结构化格式用中文输出：',
      '1) 当前风险等级与判断依据（要点列表）',
      '2) 立即处置建议（分条列出，按优先级标注 [高]/[中]/[低]）',
      '3) 监控重点区域（列出点位与阈值、预计风险演变）',
      '4) 设备健康与维护建议（故障与需检修项）',
      '5) 后续复盘与记录建议（需要留存的关键信息）',
      '注意：若存在火焰或>80%烟雾或>60°C高温，请将风险等级至少设为“高”。',
    ].join('\n')

    const userContent = [
      '以下是当前看板汇总数据（JSON）：',
      '```json',
      JSON.stringify(context, null, 2),
      '```',
      '',
      '请基于以上数据生成结构化建议。若数据缺失也请给出稳健默认建议与补数建议。'
    ].join('\n')

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]
  } catch (e) {
    console.error('buildAnalysisMessages 失败:', e)
    // 回退到最小上下文，避免前端报错
    return [
      { role: 'system', content: '你是消防安全与应急处置专家助手，请输出结构化、可执行的中文建议。' },
      { role: 'user', content: '当前无法获取全部数据，请给出一般性的巡检要点、风险识别与处置建议。' }
    ]
  }
}

// 组件挂载
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  loadSettings()
  
  if (autoRefresh.value) {
    startAutoRefresh()
  }
  
  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  
  stopAutoRefresh()
})
</script>

<style lang="scss" scoped>
.fire-alarm-dashboard {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  height: 80px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 24px;
  position: relative;
  z-index: 100;
  flex-shrink: 0;

  .header-content {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;

    &-icon {
      font-size: 32px;
      color: #ff6b6b;
    }

    &-text {
      font-size: 24px;
      font-weight: bold;
      background: linear-gradient(45deg, #ff6b6b, #ffd93d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .system-info {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .current-time {
    font-size: 18px;
    font-weight: 500;
    color: #e0e6ed;
  }

  .system-status {
    .el-tag {
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 20px;

      &.blinking {
        animation: blink 1s infinite;
      }
    }
    
    .status-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .el-icon {
        font-size: 14px;
      }
      
      .status-text {
        line-height: 1;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .quick-actions {
    display: flex;
    gap: 12px;

    .el-button {
      padding: 10px 20px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .layout-controls {
    display: flex;
    gap: 8px;

    .el-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      padding: 0;
    }
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.dashboard-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  min-height: 0; // 允许子级网格在两列布局时正确计算高度
   
   &.fullscreen {
     padding: 8px;
   }
}

.dashboard-grid {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: auto; /* 允许整体随内容拉伸，外层容器滚动 */
}

.row-container {
  display: flex;
  gap: 16px;
  min-height: 320px;
  
  .tile {
    flex: 1;
  }
}

.tile {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  .tile-header {
    padding: 10px 14px;
    font-weight: 600;
    color: #e8eef7;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
  }

  .tile-body {
    flex: 1;

    padding: 10px;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    place-items: stretch;
  }

  // 确保插入的自定义组件（如 ECharts 容器）在两列布局下被拉伸填满
  .tile-body > * {
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;

  }
 }

// 旧布局类保留但不再使用
.content-row, .content-col { display: none; }

// 响应式
@media (max-width: 1200px) {
  .row-container {
    flex-direction: column;
    min-height: auto;
    
    .tile {
      min-height: 240px;
    }
  }
}

@media (max-width: 768px) {
  .dashboard-content { padding: 12px; }
  .dashboard-grid { gap: 12px; }
  
  .row-container {
    gap: 12px;
    
    .tile {
      min-height: 200px;
    }
  }
}

@media (max-width: 480px) {
  .dashboard-content { padding: 8px; }
  .dashboard-grid { gap: 8px; }
  
  .row-container {
    gap: 8px;
    
    .tile {
      min-height: 180px;
    }
  }
}

.notification-panel {
  position: fixed;
  top: 120px;
  right: 24px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
    color: white;

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .notification-list {
    max-height: 500px;
    overflow-y: auto;

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f2f5;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f5f7fa;
      }

      &:last-child {
        border-bottom: none;
      }

      &.severity-high .notification-icon {
        background-color: #f56c6c;
      }

      &.severity-medium .notification-icon {
        background-color: #e6a23c;
      }

      &.severity-low .notification-icon {
        background-color: #409eff;
      }

      .notification-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        flex-shrink: 0;
      }

      .notification-content {
        flex: 1;

        .notification-title {
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .notification-message {
          color: #606266;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .notification-time {
          color: #909399;
          font-size: 12px;
        }
      }

      .notification-actions {
        display: flex;
        align-items: flex-start;
      }
    }
  }
}

.layout-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .setting-group {
    display: flex;
    align-items: center;
    gap: 16px;

    .setting-label {
      width: 100px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.emergency-response {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .emergency-header {
    margin-bottom: 8px;
  }

  .emergency-actions {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .action-group {
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 8px;
      border-left: 4px solid #f56c6c;

      .action-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .el-button {
          font-weight: 600;
        }
      }
    }
  }
}

/* 动画效果 */
@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

.blinking {
  animation: blink 1s infinite;
}

// 响应式设计
@media (max-width: 1200px) {
  .dashboard-header {
    .header-left {
      gap: 20px;
    }

    .quick-actions {
      .el-button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }
  }

  .dashboard-content {
    .content-row {
      &.row-3,
      &.row-4 {
        display: none; // 在中等屏幕上隐藏视频监控和历史数据
      }
    }
  }

  .notification-panel {
    width: 350px;
    right: 12px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    height: 60px;
    padding: 0 16px;

    .header-content {
      flex-direction: column;
      gap: 12px;
    }

    .header-left {
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }

    .logo {
      &-text {
        font-size: 18px;
      }
    }

    .current-time {
      font-size: 14px;
    }

    .quick-actions {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;

      .el-button {
        padding: 6px 12px;
        font-size: 12px;
      }
    }

    .layout-controls {
      .el-button {
        width: 32px;
        height: 32px;
      }
    }
  }

  .dashboard-content {
    padding: 12px;
    gap: 12px;

    .content-row {
      flex-direction: column;
      gap: 12px;

      &.row-2,
      &.row-3,
      &.row-4 {
        display: none; // 移动端只显示第一行
      }
    }
  }

  .notification-panel {
    width: calc(100vw - 24px);
    right: 12px;
    left: 12px;
    top: 80px;
  }

  .emergency-response {
    .action-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-group {
      padding: 16px;
    }
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    height: 50px;
    padding: 0 12px;

    .logo {
      &-text {
        font-size: 16px;
      }
    }

    .system-status .el-tag {
      font-size: 12px;
      padding: 4px 8px;
    }
  }

  .dashboard-content {
    padding: 8px;
    gap: 8px;
  }

  .notification-panel {
    width: calc(100vw - 16px);
    right: 8px;
    left: 8px;
    top: 60px;
  }
}

</style>