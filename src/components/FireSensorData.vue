<template>
  <div class="fire-sensor-data">
    <el-card class="sensor-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Monitor /></el-icon>
          <span class="header-title">火灾传感器数据</span>
        </div>
      </template>

      <!-- 传感器列表 -->
      <div class="sensor-list">
        <div 
          v-for="sensor in sensors" 
          :key="sensor.id"
          class="sensor-item"
          :class="{ 
            'danger': sensor.smokeLevel > 80 || sensor.flameDetected,
            'warning': sensor.smokeLevel > 50 && sensor.smokeLevel <= 80
          }"
        >
          <div class="sensor-header">
            <div class="sensor-info">
              <div class="sensor-name">
                <el-icon><Location /></el-icon>
                {{ sensor.name }}
              </div>
              <div class="sensor-type">
                <el-tag size="small" type="info">{{ sensor.type }}</el-tag>
              </div>
            </div>
            <div class="sensor-status">
              <el-tag 
                :type="getSensorStatusType(sensor.status)"
                size="small"
              >
                {{ sensor.status }}
              </el-tag>
            </div>
          </div>

          <!-- 烟雾浓度 -->
          <div class="sensor-reading">
            <div class="reading-header">
              <div class="reading-title">
                <el-icon class="smoke-icon"><Smoking /></el-icon>
                <span>烟雾浓度</span>
              </div>
              <div class="reading-value" :class="getSmokeAlertClass(sensor.smokeLevel)">
                {{ sensor.smokeLevel }}%
              </div>
            </div>
            <div class="progress-container">
              <el-progress 
                :percentage="sensor.smokeLevel" 
                :color="getSmokeProgressColor(sensor.smokeLevel)"
                :stroke-width="8"
                :show-text="false"
              />
              <div class="threshold-markers">
                <div class="threshold-marker safe" style="left: 50%">
                  <span>安全</span>
                </div>
                <div class="threshold-marker warning" style="left: 80%">
                  <span>警告</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 火焰检测 -->
          <div class="flame-detection">
            <div class="flame-header">
              <div class="flame-title">
                <el-icon class="flame-icon"><Sunny /></el-icon>
                <span>火焰检测</span>
              </div>
              <div class="flame-status">
                <el-tag 
                  :type="sensor.flameDetected ? 'danger' : 'success'"
                  :class="{ 'blinking': sensor.flameDetected }"
                  size="large"
                >
                  <el-icon>
                    <component :is="sensor.flameDetected ? 'Warning' : 'CircleCheck'" />
                  </el-icon>
                  {{ sensor.flameDetected ? '检测到火焰' : '未检测到火焰' }}
                </el-tag>
              </div>
            </div>
            <div v-if="sensor.flameDetected" class="flame-details">
              <div class="flame-detail-item">
                <span class="detail-label">检测时间:</span>
                <span class="detail-value">{{ sensor.flameDetectedTime }}</span>
              </div>
              <div class="flame-detail-item">
                <span class="detail-label">火焰强度:</span>
                <span class="detail-value">{{ sensor.flameIntensity }}</span>
              </div>
            </div>
          </div>

          <!-- 传感器详细信息 -->
          <div class="sensor-details">
            <div class="detail-row">
              <div class="detail-item">
                <el-icon><Clock /></el-icon>
                <span>最后更新: {{ sensor.lastUpdate }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Connection /></el-icon>
                <span>信号强度: {{ sensor.signalStrength }}%</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <el-icon><Tools /></el-icon>
                <span>设备ID: {{ sensor.deviceId }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Calendar /></el-icon>
                <span>安装日期: {{ sensor.installDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 总体警报状态 -->
      <div class="overall-alert">
        <el-alert
          :title="getOverallAlertTitle()"
          :type="getOverallAlertType()"
          :description="getOverallAlertDescription()"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button type="primary" @click="refreshSensors">
          <el-icon><Refresh /></el-icon>
          刷新传感器
        </el-button>
        <el-button type="warning" @click="testSensors">
          <el-icon><Setting /></el-icon>
          传感器测试
        </el-button>
        <el-button type="info" @click="viewCalibration">
          <el-icon><Tools /></el-icon>
          校准设置
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 传感器数据
const sensors = ref([
  {
    id: 1,
    name: 'A栋1楼大厅',
    type: '烟雾+火焰检测器',
    status: '正常',
    smokeLevel: 15,
    flameDetected: false,
    flameDetectedTime: '',
    flameIntensity: '',
    lastUpdate: '2024-01-15 14:35:20',
    signalStrength: 95,
    deviceId: 'FSD-001',
    installDate: '2023-06-15'
  },
  {
    id: 2,
    name: 'A栋3楼301室',
    type: '烟雾+火焰检测器',
    status: '正常',
    smokeLevel: 85, // 高烟雾浓度
    flameDetected: true, // 检测到火焰
    flameDetectedTime: '2024-01-15 14:30:15',
    flameIntensity: '高',
    lastUpdate: '2024-01-15 14:35:18',
    signalStrength: 88,
    deviceId: 'FSD-002',
    installDate: '2023-06-15'
  },
  {
    id: 3,
    name: 'B栋2楼机房',
    type: '烟雾检测器',
    status: '正常',
    smokeLevel: 65, // 中等烟雾浓度
    flameDetected: false,
    flameDetectedTime: '',
    flameIntensity: '',
    lastUpdate: '2024-01-15 14:35:15',
    signalStrength: 92,
    deviceId: 'FSD-003',
    installDate: '2023-06-15'
  },
  {
    id: 4,
    name: 'C栋地下室',
    type: '火焰检测器',
    status: '故障',
    smokeLevel: 0,
    flameDetected: false,
    flameDetectedTime: '',
    flameIntensity: '',
    lastUpdate: '2024-01-15 14:20:10',
    signalStrength: 0,
    deviceId: 'FSD-004',
    installDate: '2023-06-15'
  }
])

// 获取传感器状态类型
const getSensorStatusType = (status) => {
  switch (status) {
    case '正常':
      return 'success'
    case '故障':
      return 'danger'
    case '维护':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取烟雾警报样式类
const getSmokeAlertClass = (level) => {
  if (level > 80) return 'danger'
  if (level > 50) return 'warning'
  return 'safe'
}

// 获取烟雾进度条颜色
const getSmokeProgressColor = (level) => {
  if (level > 80) return '#f56c6c'
  if (level > 50) return '#e6a23c'
  return '#67c23a'
}

// 获取总体警报标题
const getOverallAlertTitle = () => {
  const dangerSensors = sensors.value.filter(s => s.smokeLevel > 80 || s.flameDetected)
  const warningSensors = sensors.value.filter(s => s.smokeLevel > 50 && s.smokeLevel <= 80)
  const faultySensors = sensors.value.filter(s => s.status === '故障')
  
  if (dangerSensors.length > 0) {
    return '火灾危险警报'
  } else if (warningSensors.length > 0) {
    return '火灾预警'
  } else if (faultySensors.length > 0) {
    return '传感器故障'
  } else {
    return '系统正常'
  }
}

// 获取总体警报类型
const getOverallAlertType = () => {
  const dangerSensors = sensors.value.filter(s => s.smokeLevel > 80 || s.flameDetected)
  const warningSensors = sensors.value.filter(s => s.smokeLevel > 50 && s.smokeLevel <= 80)
  const faultySensors = sensors.value.filter(s => s.status === '故障')
  
  if (dangerSensors.length > 0) {
    return 'error'
  } else if (warningSensors.length > 0) {
    return 'warning'
  } else if (faultySensors.length > 0) {
    return 'warning'
  } else {
    return 'success'
  }
}

// 获取总体警报描述
const getOverallAlertDescription = () => {
  const dangerSensors = sensors.value.filter(s => s.smokeLevel > 80 || s.flameDetected)
  const warningSensors = sensors.value.filter(s => s.smokeLevel > 50 && s.smokeLevel <= 80)
  const faultySensors = sensors.value.filter(s => s.status === '故障')
  
  if (dangerSensors.length > 0) {
    return `检测到 ${dangerSensors.length} 个高危险区域，请立即采取紧急措施！`
  } else if (warningSensors.length > 0) {
    return `检测到 ${warningSensors.length} 个预警区域，请密切关注。`
  } else if (faultySensors.length > 0) {
    return `检测到 ${faultySensors.length} 个传感器故障，请及时维修。`
  } else {
    return '所有传感器运行正常，未检测到火灾风险。'
  }
}

// 刷新传感器
const refreshSensors = () => {
  sensors.value.forEach(sensor => {
    if (sensor.status === '正常') {
      sensor.lastUpdate = new Date().toLocaleString('zh-CN')
    }
  })
  
  ElMessage({
    message: '传感器数据已刷新',
    type: 'success',
    duration: 2000
  })
}

// 测试传感器
const testSensors = () => {
  ElMessage({
    message: '正在执行传感器自检...',
    type: 'warning',
    duration: 3000
  })
}

// 查看校准设置
const viewCalibration = () => {
  ElMessage({
    message: '正在打开校准设置页面...',
    type: 'info',
    duration: 2000
  })
}

// --- 暴露给父组件的摘要数据 ---
const getData = () => {
  const total = sensors.value.length
  const summarized = sensors.value.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    status: s.status,
    smokeLevel: s.smokeLevel,
    flameDetected: s.flameDetected,
    lastUpdate: s.lastUpdate,
    signalStrength: s.signalStrength,
    deviceId: s.deviceId,
    installDate: s.installDate
  }))
  const alarmCount = sensors.value.filter(s => s.smokeLevel > 80 || s.flameDetected).length
  const faultCount = sensors.value.filter(s => s.status === '故障').length
  const normalCount = sensors.value.filter(s => s.status === '正常' && !(s.smokeLevel > 80 || s.flameDetected)).length
  const healthScore = Math.max(0, Math.round((normalCount / Math.max(1, total)) * 100))
  return {
    summary: {
      total,
      alarmCount,
      faultCount,
      normalCount,
      healthScore // 0-100 越高越健康
    },
    sensors: summarized
  }
}

defineExpose({ getData })
</script>

<style scoped>
.fire-sensor-data {
  width: 100%;
  max-width: 600px;
}

.sensor-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 18px;
  color: #e6a23c;
}

.header-icon {
  font-size: 20px;
}

.sensor-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sensor-item {
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.sensor-item.warning {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.sensor-item.danger {
  border-color: #f56c6c;
  background-color: #fef0f0;
  animation: pulse-border 2s infinite;
}

.sensor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sensor-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sensor-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.sensor-reading {
  margin-bottom: 16px;
}

.reading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reading-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #606266;
}

.smoke-icon {
  color: #909399;
  font-size: 18px;
}

.reading-value {
  font-size: 18px;
  font-weight: 600;
}

.reading-value.safe {
  color: #67c23a;
}

.reading-value.warning {
  color: #e6a23c;
}

.reading-value.danger {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

.progress-container {
  position: relative;
}

.threshold-markers {
  position: relative;
  height: 20px;
  margin-top: 4px;
}

.threshold-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 10px;
  color: #909399;
}

.flame-detection {
  margin-bottom: 16px;
}

.flame-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.flame-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #606266;
}

.flame-icon {
  color: #f56c6c;
  font-size: 18px;
}

.flame-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding: 8px;
  background-color: #fef0f0;
  border-radius: 6px;
  border-left: 4px solid #f56c6c;
}

.flame-detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  color: #909399;
  min-width: 80px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
}

.sensor-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  flex: 1;
}

.overall-alert {
  margin: 20px 0;
}

.action-section {
  display: flex;
  gap: 12px;
}

.action-section .el-button {
  flex: 1;
}

/* 动画效果 */
.blinking {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes pulse-border {
  0%, 100% {
    border-color: #f56c6c;
  }
  50% {
    border-color: #ff8080;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>