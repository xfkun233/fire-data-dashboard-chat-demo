<template>
  <div class="temperature-humidity">
    <el-card class="monitor-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Thermometer /></el-icon>
          <span class="header-title">温湿度监控</span>
        </div>
      </template>

      <!-- 监控点列表 -->
      <div class="monitor-points">
        <div 
          v-for="point in monitorPoints" 
          :key="point.id"
          class="monitor-point"
          :class="{ 'warning': isTemperatureWarning(point.temperature) }"
        >
          <div class="point-header">
            <div class="point-name">
              <el-icon><Location /></el-icon>
              {{ point.name }}
            </div>
            <div class="sensor-status">
              <el-tag 
                :type="point.sensorStatus === '正常' ? 'success' : 'danger'"
                size="small"
              >
                {{ point.sensorStatus }}
              </el-tag>
            </div>
          </div>

          <div class="readings">
            <!-- 温度显示 -->
            <div class="reading-item temperature">
              <div class="reading-icon">
                <el-icon class="temp-icon"><Sunny /></el-icon>
              </div>
              <div class="reading-content">
                <div class="reading-label">温度</div>
                <div class="reading-value" :class="{ 'danger': isTemperatureWarning(point.temperature) }">
                  {{ point.temperature }}°C
                </div>
              </div>
              <div class="reading-trend">
                <el-icon 
                  :class="getTrendClass(point.temperatureTrend)"
                  class="trend-icon"
                >
                  <component :is="getTrendIcon(point.temperatureTrend)" />
                </el-icon>
              </div>
            </div>

            <!-- 湿度显示 -->
            <div class="reading-item humidity">
              <div class="reading-icon">
                <el-icon class="humidity-icon"><Cloudy /></el-icon>
              </div>
              <div class="reading-content">
                <div class="reading-label">湿度</div>
                <div class="reading-value">
                  {{ point.humidity }}%
                </div>
              </div>
              <div class="reading-trend">
                <el-icon 
                  :class="getTrendClass(point.humidityTrend)"
                  class="trend-icon"
                >
                  <component :is="getTrendIcon(point.humidityTrend)" />
                </el-icon>
              </div>
            </div>
          </div>

          <!-- 最后更新时间 -->
          <div class="last-update">
            <el-icon><Clock /></el-icon>
            <span>更新时间: {{ point.lastUpdate }}</span>
          </div>
        </div>
      </div>

      <!-- 总体状态 -->
      <div class="overall-status">
        <el-alert
          :title="getOverallStatusTitle()"
          :type="getOverallStatusType()"
          :description="getOverallStatusDescription()"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="info" @click="viewHistory">
          <el-icon><DataAnalysis /></el-icon>
          查看历史
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 监控点数据
const monitorPoints = ref([
  {
    id: 1,
    name: 'A栋1楼大厅',
    temperature: 24.5,
    humidity: 45,
    temperatureTrend: 'stable', // up, down, stable
    humidityTrend: 'down',
    sensorStatus: '正常',
    lastUpdate: '2024-01-15 14:35:20'
  },
  {
    id: 2,
    name: 'A栋3楼301室',
    temperature: 68.2, // 高温警告
    humidity: 35,
    temperatureTrend: 'up',
    humidityTrend: 'stable',
    sensorStatus: '正常',
    lastUpdate: '2024-01-15 14:35:18'
  },
  {
    id: 3,
    name: 'B栋2楼机房',
    temperature: 26.8,
    humidity: 52,
    temperatureTrend: 'stable',
    humidityTrend: 'up',
    sensorStatus: '正常',
    lastUpdate: '2024-01-15 14:35:15'
  },
  {
    id: 4,
    name: 'C栋地下室',
    temperature: 22.1,
    humidity: 68,
    temperatureTrend: 'down',
    humidityTrend: 'stable',
    sensorStatus: '故障',
    lastUpdate: '2024-01-15 14:30:10'
  }
])

// 判断温度是否警告
const isTemperatureWarning = (temp) => {
  return temp > 60 // 60度以上为高温警告
}

// 获取趋势图标
const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return 'ArrowUp'
    case 'down':
      return 'ArrowDown'
    case 'stable':
    default:
      return 'Minus'
  }
}

// 获取趋势样式类
const getTrendClass = (trend) => {
  switch (trend) {
    case 'up':
      return 'trend-up'
    case 'down':
      return 'trend-down'
    case 'stable':
    default:
      return 'trend-stable'
  }
}

// 获取总体状态标题
const getOverallStatusTitle = () => {
  const warningPoints = monitorPoints.value.filter(p => isTemperatureWarning(p.temperature))
  const faultyPoints = monitorPoints.value.filter(p => p.sensorStatus === '故障')
  
  if (warningPoints.length > 0) {
    return '高温警告'
  } else if (faultyPoints.length > 0) {
    return '传感器故障'
  } else {
    return '系统正常'
  }
}

// 获取总体状态类型
const getOverallStatusType = () => {
  const warningPoints = monitorPoints.value.filter(p => isTemperatureWarning(p.temperature))
  const faultyPoints = monitorPoints.value.filter(p => p.sensorStatus === '故障')
  
  if (warningPoints.length > 0) {
    return 'error'
  } else if (faultyPoints.length > 0) {
    return 'warning'
  } else {
    return 'success'
  }
}

// 获取总体状态描述
const getOverallStatusDescription = () => {
  const warningPoints = monitorPoints.value.filter(p => isTemperatureWarning(p.temperature))
  const faultyPoints = monitorPoints.value.filter(p => p.sensorStatus === '故障')
  
  if (warningPoints.length > 0) {
    return `检测到 ${warningPoints.length} 个监控点温度异常，请立即检查！`
  } else if (faultyPoints.length > 0) {
    return `检测到 ${faultyPoints.length} 个传感器故障，请及时维修。`
  } else {
    return '所有监控点运行正常，温湿度在安全范围内。'
  }
}

// 刷新数据
const refreshData = () => {
  // 模拟数据更新
  monitorPoints.value.forEach(point => {
    point.lastUpdate = new Date().toLocaleString('zh-CN')
  })
  
  ElMessage({
    message: '数据已刷新',
    type: 'success',
    duration: 2000
  })
}

// 查看历史数据
const viewHistory = () => {
  ElMessage({
    message: '正在打开历史数据页面...',
    type: 'info',
    duration: 2000
  })
}

// --- 暴露给父组件的摘要数据 ---
const getData = () => {
  const points = monitorPoints.value.map(p => ({
    id: p.id,
    name: p.name,
    temperature: p.temperature,
    humidity: p.humidity,
    temperatureTrend: p.temperatureTrend,
    humidityTrend: p.humidityTrend,
    sensorStatus: p.sensorStatus,
    lastUpdate: p.lastUpdate
  }))
  const warningCount = points.filter(p => p.temperature > 60).length
  const faultyCount = points.filter(p => p.sensorStatus === '故障').length
  return {
    summary: {
      statusTitle: getOverallStatusTitle(),
      statusType: getOverallStatusType(),
      description: getOverallStatusDescription(),
      warningCount,
      faultyCount,
      total: points.length
    },
    points
  }
}

defineExpose({ getData })
</script>

<style scoped>
.temperature-humidity {
  width: 100%;
  max-width: 500px;
}

.monitor-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
}

.header-icon {
  font-size: 20px;
}

.monitor-points {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-point {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.monitor-point.warning {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.point-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
}

.readings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.reading-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  background-color: white;
}

.reading-icon {
  font-size: 20px;
}

.temp-icon {
  color: #f56c6c;
}

.humidity-icon {
  color: #409eff;
}

.reading-content {
  flex: 1;
}

.reading-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.reading-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.reading-value.danger {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

.trend-icon {
  font-size: 16px;
}

.trend-up {
  color: #f56c6c;
}

.trend-down {
  color: #67c23a;
}

.trend-stable {
  color: #909399;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.overall-status {
  margin: 20px 0;
}

.action-section {
  display: flex;
  gap: 12px;
}

.action-section .el-button {
  flex: 1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .readings {
    grid-template-columns: 1fr;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>