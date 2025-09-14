<template>
  <div class="fire-alarm-status">
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Warning /></el-icon>
          <span class="header-title">火灾预警状态</span>
        </div>
      </template>
      
      <!-- 当前状态 -->
      <div class="status-section">
        <div class="status-item">
          <div class="status-label">当前状态</div>
          <el-tag 
            :type="getStatusType(currentStatus)" 
            :class="{ 'blinking': currentStatus === '火灾预警中' }"
            size="large"
          >
            <el-icon><Bell /></el-icon>
            {{ currentStatus }}
          </el-tag>
        </div>
      </div>

      <!-- 预警等级 -->
      <div class="status-section">
        <div class="status-item">
          <div class="status-label">预警等级</div>
          <el-tag 
            :type="getAlarmLevelType(alarmLevel)" 
            :class="{ 'blinking': alarmLevel === '一级预警（紧急）' }"
            size="large"
          >
            <el-icon><Warning /></el-icon>
            {{ alarmLevel }}
          </el-tag>
        </div>
      </div>

      <!-- 火灾发生地点 -->
      <div class="status-section">
        <div class="status-item">
          <div class="status-label">发生地点</div>
          <div class="location-info">
            <el-icon class="location-icon"><Location /></el-icon>
            <span class="location-text">{{ fireLocation }}</span>
          </div>
        </div>
      </div>

      <!-- 报警时间 -->
      <div class="status-section">
        <div class="status-item">
          <div class="status-label">报警时间</div>
          <div class="time-info">
            <el-icon class="time-icon"><Clock /></el-icon>
            <span class="time-text">{{ alarmTime }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button type="primary" size="large" @click="handleEmergencyResponse">
          <el-icon><Phone /></el-icon>
          紧急响应
        </el-button>
        <el-button type="warning" size="large" @click="handleResetAlarm">
          <el-icon><RefreshRight /></el-icon>
          重置报警
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const currentStatus = ref('火灾预警中') // 可选值: '安全', '火灾预警中', '故障'
const alarmLevel = ref('一级预警（紧急）') // 可选值: '一级预警（紧急）', '二级预警（中等）', '三级预警（低）'
const fireLocation = ref('A栋3楼301会议室')
const alarmTime = ref('2024-01-15 14:30:25')

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case '安全':
      return 'success'
    case '火灾预警中':
      return 'danger'
    case '故障':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取预警等级类型
const getAlarmLevelType = (level) => {
  switch (level) {
    case '一级预警（紧急）':
      return 'danger'
    case '二级预警（中等）':
      return 'warning'
    case '三级预警（低）':
      return 'info'
    default:
      return 'info'
  }
}

// 处理紧急响应
const handleEmergencyResponse = () => {
  ElMessage({
    message: '正在启动紧急响应程序...',
    type: 'warning',
    duration: 3000
  })
}

// 重置报警
const handleResetAlarm = () => {
  currentStatus.value = '安全'
  alarmLevel.value = '三级预警（低）'
  fireLocation.value = '无'
  alarmTime.value = ''
  ElMessage({
    message: '报警已重置',
    type: 'success',
    duration: 2000
  })
}
</script>

<style scoped>
.fire-alarm-status {
  width: 100%;
  max-width: 400px;
}

.status-card {
  border-radius: 12px;
  border: 2px solid #f56c6c;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 18px;
  color: #f56c6c;
}

.header-icon {
  font-size: 20px;
}

.status-section {
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-label {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.location-info,
.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.location-icon,
.time-icon {
  color: #409eff;
  font-size: 16px;
}

.location-text,
.time-text {
  font-weight: 500;
  color: #303133;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-section .el-button {
  flex: 1;
}

/* 闪烁动画 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
  }
  
  .action-section .el-button {
    width: 100%;
  }
}
</style>