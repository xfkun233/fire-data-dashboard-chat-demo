<template>
  <div class="fault-detection">
    <el-card class="fault-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Warning /></el-icon>
          <span class="header-title">故障检测和报警</span>
          <div class="header-status">
            <el-tag 
              :type="overallStatus.type" 
              :class="{ 'blinking': overallStatus.level === 'critical' }"
              size="large"
              class="status-tag"
            >
              <span>{{ overallStatus.text }}</span>
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 总体状态概览 -->
      <div class="status-overview">
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-icon normal">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ statusCounts.normal }}</div>
              <div class="overview-label">正常设备</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon warning">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ statusCounts.warning }}</div>
              <div class="overview-label">警告设备</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon error">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ statusCounts.error }}</div>
              <div class="overview-label">故障设备</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon offline">
              <el-icon><SwitchButton /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-number">{{ statusCounts.offline }}</div>
              <div class="overview-label">离线设备</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="filter-section">
          <el-select v-model="selectedCategory" @change="filterDevices" placeholder="设备类型">
            <el-option label="全部设备" value="all"></el-option>
            <el-option label="火灾探测器" value="fire_detector"></el-option>
            <el-option label="烟雾探测器" value="smoke_detector"></el-option>
            <el-option label="温度传感器" value="temperature_sensor"></el-option>
            <el-option label="湿度传感器" value="humidity_sensor"></el-option>
            <el-option label="摄像头" value="camera"></el-option>
            <el-option label="报警器" value="alarm"></el-option>
            <el-option label="灭火系统" value="fire_suppression"></el-option>
          </el-select>
          
          <el-select v-model="selectedStatus" @change="filterDevices" placeholder="设备状态">
            <el-option label="全部状态" value="all"></el-option>
            <el-option label="正常" value="normal"></el-option>
            <el-option label="警告" value="warning"></el-option>
            <el-option label="故障" value="error"></el-option>
            <el-option label="离线" value="offline"></el-option>
          </el-select>
          
          <el-input 
            v-model="searchKeyword" 
            @input="filterDevices"
            placeholder="搜索设备名称或位置"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="action-section">
          <el-button type="primary" @click="refreshDevices">
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>
          <el-button type="warning" @click="testAllDevices">
            <el-icon><Operation /></el-icon>
            全部测试
          </el-button>
          <el-button type="danger" @click="silenceAllAlarms" :disabled="!hasActiveAlarms">
            <el-icon><Mute /></el-icon>
            静音报警
          </el-button>
          <el-button type="info" @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
        </div>
      </div>

      <!-- 设备列表 -->
      <div class="device-list">
        <div class="list-header">
          <div class="header-item device-name">设备名称</div>
          <div class="header-item device-type">类型</div>
          <div class="header-item device-location">位置</div>
          <div class="header-item device-status">状态</div>
          <div class="header-item device-last-check">最后检查</div>
          <div class="header-item device-actions">操作</div>
        </div>
        
        <div class="device-items">
          <div 
            v-for="device in filteredDevices" 
            :key="device.id"
            class="device-item"
            :class="`status-${device.status}`"
          >
            <div class="item-content device-name">
              <div class="device-icon">
                <el-icon><component :is="getDeviceIcon(device.type)" /></el-icon>
              </div>
              <div class="device-info">
                <div class="device-title">{{ device.name }}</div>
                <div class="device-id">ID: {{ device.id }}</div>
              </div>
            </div>
            
            <div class="item-content device-type">
              <el-tag size="small" :type="getTypeTagType(device.type)">
                {{ getTypeLabel(device.type) }}
              </el-tag>
            </div>
            
            <div class="item-content device-location">
              <div class="location-info">
                <div class="location-building">{{ device.location.building }}</div>
                <div class="location-room">{{ device.location.room }}</div>
              </div>
            </div>
            
            <div class="item-content device-status">
              <div class="status-info">
                <el-tag 
                  :type="getStatusTagType(device.status)"
                  :class="{ 'blinking': device.status === 'error' && device.isAlarming }"
                >
                  <el-icon><component :is="getStatusIcon(device.status)" /></el-icon>
                  {{ getStatusLabel(device.status) }}
                </el-tag>
                <div v-if="device.faultCode" class="fault-code">
                  故障码: {{ device.faultCode }}
                </div>
                <div v-if="device.errorMessage" class="error-message">
                  {{ device.errorMessage }}
                </div>
              </div>
            </div>
            
            <div class="item-content device-last-check">
              <div class="check-info">
                <div class="check-time">{{ device.lastCheck }}</div>
                <div class="check-method">{{ device.checkMethod }}</div>
              </div>
            </div>
            
            <div class="item-content device-actions">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="testDevice(device)"
                  :disabled="device.status === 'offline'"
                >
                  <el-icon><Operation /></el-icon>
                  测试
                </el-button>
                
                <el-button 
                  v-if="device.status === 'error' && device.isAlarming"
                  type="warning" 
                  size="small" 
                  @click="silenceAlarm(device)"
                >
                  <el-icon><Mute /></el-icon>
                  静音
                </el-button>
                
                <el-button 
                  v-if="device.status === 'error'"
                  type="success" 
                  size="small" 
                  @click="resetDevice(device)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  重置
                </el-button>
                
                <el-dropdown @command="handleDeviceAction">
                  <el-button type="info" size="small">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'details', device }">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'history', device }">
                        <el-icon><Clock /></el-icon>
                        历史记录
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'calibrate', device }" :disabled="device.status === 'offline'">
                        <el-icon><Setting /></el-icon>
                        校准设备
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'maintenance', device }">
                        <el-icon><Tools /></el-icon>
                        维护记录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 故障统计图表 -->
      <div class="fault-statistics">
        <div class="statistics-header">
          <div class="statistics-title">
            <el-icon><TrendCharts /></el-icon>
            <span>故障统计</span>
          </div>
          <div class="time-range">
            <el-radio-group v-model="statisticsRange" @change="updateStatistics">
              <el-radio-button label="24h">24小时</el-radio-button>
              <el-radio-button label="7d">7天</el-radio-button>
              <el-radio-button label="30d">30天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        
        <div class="statistics-content">
          <div class="chart-container">
            <div ref="faultChart" class="fault-chart"></div>
          </div>
          
          <div class="statistics-summary">
            <div class="summary-item">
              <div class="summary-label">总故障次数</div>
              <div class="summary-value error">{{ faultStatistics.totalFaults }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">平均修复时间</div>
              <div class="summary-value warning">{{ faultStatistics.avgRepairTime }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">设备可用率</div>
              <div class="summary-value success">{{ faultStatistics.availability }}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">预防性维护</div>
              <div class="summary-value info">{{ faultStatistics.preventiveMaintenance }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 报警历史 -->
      <div class="alarm-history">
        <div class="history-header">
          <div class="history-title">
            <el-icon><Bell /></el-icon>
            <span>报警历史</span>
          </div>
          <el-button type="text" @click="clearAlarmHistory">
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
        </div>
        
        <div class="alarm-timeline">
          <div 
            v-for="alarm in alarmHistory" 
            :key="alarm.id"
            class="alarm-item"
            :class="`severity-${alarm.severity}`"
          >
            <div class="alarm-time">
              <div class="time-date">{{ formatDate(alarm.timestamp) }}</div>
              <div class="time-clock">{{ formatTime(alarm.timestamp) }}</div>
            </div>
            
            <div class="alarm-indicator">
              <div class="indicator-dot"></div>
              <div class="indicator-line"></div>
            </div>
            
            <div class="alarm-content">
              <div class="alarm-header">
                <div class="alarm-title">{{ alarm.title }}</div>
                <el-tag 
                  :type="getSeverityTagType(alarm.severity)"
                  size="small"
                >
                  {{ getSeverityLabel(alarm.severity) }}
                </el-tag>
              </div>
              
              <div class="alarm-details">
                <div class="alarm-device">设备: {{ alarm.deviceName }}</div>
                <div class="alarm-location">位置: {{ alarm.location }}</div>
                <div class="alarm-description">{{ alarm.description }}</div>
              </div>
              
              <div class="alarm-actions">
                <div class="alarm-status">
                  <el-tag 
                    :type="alarm.status === 'resolved' ? 'success' : alarm.status === 'acknowledged' ? 'warning' : 'danger'"
                    size="small"
                  >
                    {{ getAlarmStatusLabel(alarm.status) }}
                  </el-tag>
                </div>
                
                <div class="alarm-buttons" v-if="alarm.status === 'active'">
                  <el-button type="warning" size="small" @click="acknowledgeAlarm(alarm)">
                    <el-icon><Check /></el-icon>
                    确认
                  </el-button>
                  <el-button type="success" size="small" @click="resolveAlarm(alarm)">
                    <el-icon><CircleCheck /></el-icon>
                    解决
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 响应式数据
const selectedCategory = ref('all')
const selectedStatus = ref('all')
const searchKeyword = ref('')
const statisticsRange = ref('24h')
const faultChart = ref(null)
let chartInstance = null

// 设备数据
const devices = ref([
  {
    id: 'FD001',
    name: '火灾探测器-大厅01',
    type: 'fire_detector',
    location: { building: 'A栋', room: '1楼大厅' },
    status: 'normal',
    lastCheck: '2024-01-15 14:30:00',
    checkMethod: '自动检测',
    isAlarming: false
  },
  {
    id: 'SD002',
    name: '烟雾探测器-301室',
    type: 'smoke_detector',
    location: { building: 'A栋', room: '3楼301室' },
    status: 'error',
    lastCheck: '2024-01-15 14:25:00',
    checkMethod: '自动检测',
    faultCode: 'E001',
    errorMessage: '传感器响应异常',
    isAlarming: true
  },
  {
    id: 'TS003',
    name: '温度传感器-机房',
    type: 'temperature_sensor',
    location: { building: 'B栋', room: '2楼机房' },
    status: 'warning',
    lastCheck: '2024-01-15 14:28:00',
    checkMethod: '自动检测',
    errorMessage: '温度读数偏高',
    isAlarming: false
  },
  {
    id: 'HS004',
    name: '湿度传感器-仓库',
    type: 'humidity_sensor',
    location: { building: 'C栋', room: '地下仓库' },
    status: 'offline',
    lastCheck: '2024-01-15 12:00:00',
    checkMethod: '手动检测',
    errorMessage: '设备离线',
    isAlarming: false
  },
  {
    id: 'CAM005',
    name: '监控摄像头-停车场',
    type: 'camera',
    location: { building: 'C栋', room: '地下车库' },
    status: 'normal',
    lastCheck: '2024-01-15 14:32:00',
    checkMethod: '自动检测',
    isAlarming: false
  },
  {
    id: 'AL006',
    name: '声光报警器-楼梯间',
    type: 'alarm',
    location: { building: 'A栋', room: '楼梯间' },
    status: 'error',
    lastCheck: '2024-01-15 14:20:00',
    checkMethod: '手动测试',
    faultCode: 'E003',
    errorMessage: '声音输出故障',
    isAlarming: true
  },
  {
    id: 'FS007',
    name: '自动灭火系统-数据中心',
    type: 'fire_suppression',
    location: { building: 'B栋', room: '1楼数据中心' },
    status: 'warning',
    lastCheck: '2024-01-15 14:15:00',
    checkMethod: '定期检查',
    errorMessage: '压力不足',
    isAlarming: false
  }
])

// 故障统计数据
const faultStatistics = ref({
  totalFaults: 23,
  avgRepairTime: '2.5小时',
  availability: 96.8,
  preventiveMaintenance: 15
})

// 报警历史数据
const alarmHistory = ref([
  {
    id: 1,
    timestamp: new Date('2024-01-15 14:25:00'),
    title: '烟雾探测器故障',
    deviceName: '烟雾探测器-301室',
    location: 'A栋3楼301室',
    description: '传感器响应异常，无法正常检测烟雾',
    severity: 'high',
    status: 'active'
  },
  {
    id: 2,
    timestamp: new Date('2024-01-15 14:20:00'),
    title: '声光报警器故障',
    deviceName: '声光报警器-楼梯间',
    location: 'A栋楼梯间',
    description: '声音输出模块故障，无法发出报警声',
    severity: 'medium',
    status: 'acknowledged'
  },
  {
    id: 3,
    timestamp: new Date('2024-01-15 12:00:00'),
    title: '湿度传感器离线',
    deviceName: '湿度传感器-仓库',
    location: 'C栋地下仓库',
    description: '设备失去网络连接，无法获取数据',
    severity: 'low',
    status: 'resolved'
  },
  {
    id: 4,
    timestamp: new Date('2024-01-15 10:30:00'),
    title: '温度传感器异常',
    deviceName: '温度传感器-机房',
    location: 'B栋2楼机房',
    description: '温度读数持续偏高，可能存在校准问题',
    severity: 'medium',
    status: 'resolved'
  }
])

// 计算属性
const statusCounts = computed(() => {
  const counts = { normal: 0, warning: 0, error: 0, offline: 0 }
  devices.value.forEach(device => {
    counts[device.status]++
  })
  return counts
})

const overallStatus = computed(() => {
  if (statusCounts.value.error > 0) {
    return { type: 'danger', text: '系统故障', level: 'critical' }
  } else if (statusCounts.value.warning > 0 || statusCounts.value.offline > 0) {
    return { type: 'warning', text: '系统警告', level: 'warning' }
  } else {
    return { type: 'success', text: '系统正常', level: 'normal' }
  }
})

const hasActiveAlarms = computed(() => {
  return devices.value.some(device => device.isAlarming)
})

const filteredDevices = computed(() => {
  return devices.value.filter(device => {
    const categoryMatch = selectedCategory.value === 'all' || device.type === selectedCategory.value
    const statusMatch = selectedStatus.value === 'all' || device.status === selectedStatus.value
    const keywordMatch = searchKeyword.value === '' || 
      device.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      device.location.building.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      device.location.room.toLowerCase().includes(searchKeyword.value.toLowerCase())
    
    return categoryMatch && statusMatch && keywordMatch
  })
})

// 设备图标映射
const getDeviceIcon = (type) => {
  const iconMap = {
    fire_detector: 'Warning',
    smoke_detector: 'Smoking',
    temperature_sensor: 'Thermometer',
    humidity_sensor: 'Drizzling',
    camera: 'VideoCamera',
    alarm: 'Bell',
    fire_suppression: 'MagicStick'
  }
  return iconMap[type] || 'QuestionFilled'
}

// 状态图标映射
const getStatusIcon = (status) => {
  const iconMap = {
    normal: 'CircleCheckFilled',
    warning: 'WarningFilled',
    error: 'CircleCloseFilled',
    offline: 'SwitchButton'
  }
  return iconMap[status] || 'QuestionFilled'
}

// 获取类型标签类型
const getTypeTagType = (type) => {
  const typeMap = {
    fire_detector: 'danger',
    smoke_detector: 'warning',
    temperature_sensor: 'primary',
    humidity_sensor: 'info',
    camera: 'success',
    alarm: 'danger',
    fire_suppression: 'warning'
  }
  return typeMap[type] || ''
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const labelMap = {
    fire_detector: '火灾探测器',
    smoke_detector: '烟雾探测器',
    temperature_sensor: '温度传感器',
    humidity_sensor: '湿度传感器',
    camera: '摄像头',
    alarm: '报警器',
    fire_suppression: '灭火系统'
  }
  return labelMap[type] || type
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const statusMap = {
    normal: 'success',
    warning: 'warning',
    error: 'danger',
    offline: 'info'
  }
  return statusMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    normal: '正常',
    warning: '警告',
    error: '故障',
    offline: '离线'
  }
  return labelMap[status] || status
}

// 获取严重程度标签类型
const getSeverityTagType = (severity) => {
  const severityMap = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return severityMap[severity] || ''
}

// 获取严重程度标签文本
const getSeverityLabel = (severity) => {
  const labelMap = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labelMap[severity] || severity
}

// 获取报警状态标签文本
const getAlarmStatusLabel = (status) => {
  const labelMap = {
    active: '活跃',
    acknowledged: '已确认',
    resolved: '已解决'
  }
  return labelMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return date.toLocaleDateString('zh-CN')
}

// 格式化时间
const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN')
}

// 过滤设备
const filterDevices = () => {
  // 过滤逻辑已在计算属性中实现
}

// 刷新设备状态
const refreshDevices = () => {
  ElMessage({
    message: '正在刷新设备状态...',
    type: 'info',
    duration: 1000
  })
  
  setTimeout(() => {
    ElMessage({
      message: '设备状态已更新',
      type: 'success',
      duration: 2000
    })
  }, 1000)
}

// 测试所有设备
const testAllDevices = async () => {
  try {
    await ElMessageBox.confirm('确定要测试所有设备吗？这可能需要几分钟时间。', '确认测试', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    ElMessage({
      message: '正在测试所有设备...',
      type: 'info',
      duration: 2000
    })
    
    // 模拟测试过程
    setTimeout(() => {
      ElMessage({
        message: '设备测试完成',
        type: 'success',
        duration: 2000
      })
    }, 2000)
  } catch {
    // 用户取消测试
  }
}

// 静音所有报警
const silenceAllAlarms = () => {
  devices.value.forEach(device => {
    if (device.isAlarming) {
      device.isAlarming = false
    }
  })
  
  ElMessage({
    message: '所有报警已静音',
    type: 'success',
    duration: 2000
  })
}

// 导出报告
const exportReport = () => {
  ElMessage({
    message: '正在生成故障检测报告...',
    type: 'info',
    duration: 2000
  })
  
  setTimeout(() => {
    ElMessage({
      message: '报告已导出到下载文件夹',
      type: 'success',
      duration: 2000
    })
  }, 1000)
}

// 测试设备
const testDevice = (device) => {
  ElMessage({
    message: `正在测试 ${device.name}...`,
    type: 'info',
    duration: 1000
  })
  
  setTimeout(() => {
    ElMessage({
      message: `${device.name} 测试完成`,
      type: 'success',
      duration: 2000
    })
  }, 1000)
}

// 静音报警
const silenceAlarm = (device) => {
  device.isAlarming = false
  ElMessage({
    message: `${device.name} 报警已静音`,
    type: 'success',
    duration: 2000
  })
}

// 重置设备
const resetDevice = async (device) => {
  try {
    await ElMessageBox.confirm(`确定要重置 ${device.name} 吗？`, '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    ElMessage({
      message: `正在重置 ${device.name}...`,
      type: 'info',
      duration: 1000
    })
    
    setTimeout(() => {
      device.status = 'normal'
      device.isAlarming = false
      device.faultCode = ''
      device.errorMessage = ''
      
      ElMessage({
        message: `${device.name} 重置成功`,
        type: 'success',
        duration: 2000
      })
    }, 1000)
  } catch {
    // 用户取消重置
  }
}

// 处理设备操作
const handleDeviceAction = ({ action, device }) => {
  const actionMap = {
    details: () => ElMessage({ message: `查看 ${device.name} 详情`, type: 'info', duration: 2000 }),
    history: () => ElMessage({ message: `查看 ${device.name} 历史记录`, type: 'info', duration: 2000 }),
    calibrate: () => ElMessage({ message: `校准 ${device.name}`, type: 'info', duration: 2000 }),
    maintenance: () => ElMessage({ message: `查看 ${device.name} 维护记录`, type: 'info', duration: 2000 })
  }
  
  if (actionMap[action]) {
    actionMap[action]()
  }
}

// 确认报警
const acknowledgeAlarm = (alarm) => {
  alarm.status = 'acknowledged'
  ElMessage({
    message: '报警已确认',
    type: 'success',
    duration: 2000
  })
}

// 解决报警
const resolveAlarm = (alarm) => {
  alarm.status = 'resolved'
  ElMessage({
    message: '报警已解决',
    type: 'success',
    duration: 2000
  })
}

// 清空报警历史
const clearAlarmHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有报警历史吗？', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    alarmHistory.value = []
    ElMessage({
      message: '报警历史已清空',
      type: 'success',
      duration: 2000
    })
  } catch {
    // 用户取消清空
  }
}

// 更新统计数据
const updateStatistics = () => {
  ElMessage({
    message: `正在加载${statisticsRange.value}统计数据...`,
    type: 'info',
    duration: 1000
  })
  
  setTimeout(() => {
    initChart()
  }, 500)
}

// 初始化图表
const initChart = () => {
  if (!faultChart.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(faultChart.value)
  
  const option = {
    title: {
      text: '故障趋势图',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['故障次数', '修复次数', '预防性维护'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    series: [
      {
        name: '故障次数',
        type: 'line',
        data: [2, 1, 3, 2, 4, 1, 2],
        itemStyle: {
          color: '#f56c6c'
        },
        areaStyle: {
          color: 'rgba(245, 108, 108, 0.1)'
        }
      },
      {
        name: '修复次数',
        type: 'line',
        data: [1, 2, 2, 3, 3, 2, 1],
        itemStyle: {
          color: '#67c23a'
        },
        areaStyle: {
          color: 'rgba(103, 194, 58, 0.1)'
        }
      },
      {
        name: '预防性维护',
        type: 'bar',
        data: [1, 0, 1, 1, 0, 1, 0],
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

// 组件卸载
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.fault-detection {
  width: 100%;
}

.fault-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
}

.header-icon {
  font-size: 20px;
  margin-right: 8px;
}

.header-status .el-tag {
  font-weight: 600;
}

.status-overview {
  margin-bottom: 24px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.overview-item:nth-child(1) {
  border-left-color: #67c23a;
}

.overview-item:nth-child(2) {
  border-left-color: #e6a23c;
}

.overview-item:nth-child(3) {
  border-left-color: #f56c6c;
}

.overview-item:nth-child(4) {
  border-left-color: #909399;
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.overview-icon.normal {
  background-color: #67c23a;
}

.overview-icon.warning {
  background-color: #e6a23c;
}

.overview-icon.error {
  background-color: #f56c6c;
}

.overview-icon.offline {
  background-color: #909399;
}

.overview-content {
  flex: 1;
}

.overview-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.overview-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-section .el-select,
.filter-section .el-input {
  width: 180px;
}

.action-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.device-list {
  margin-bottom: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1.5fr 2fr;
  gap: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.device-items {
  max-height: 400px;
  overflow-y: auto;
}

.device-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1.5fr 2fr;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  transition: all 0.3s ease;
  align-items: center;
}

.device-item:hover {
  background-color: #f5f7fa;
}

.device-item.status-error {
  background-color: rgba(245, 108, 108, 0.05);
  border-left: 4px solid #f56c6c;
}

.device-item.status-warning {
  background-color: rgba(230, 162, 60, 0.05);
  border-left: 4px solid #e6a23c;
}

.device-item.status-offline {
  background-color: rgba(144, 147, 153, 0.05);
  border-left: 4px solid #909399;
}

.item-content {
  display: flex;
  align-items: center;
}

.device-name .device-icon {
  width: 32px;
  height: 32px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.device-info {
  flex: 1;
}

.device-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.device-id {
  font-size: 12px;
  color: #909399;
}

.location-info {
  display: flex;
  flex-direction: column;
}

.location-building {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.location-room {
  font-size: 12px;
  color: #606266;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fault-code {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 600;
}

.error-message {
  font-size: 12px;
  color: #606266;
}

.check-info {
  display: flex;
  flex-direction: column;
}

.check-time {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.check-method {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.fault-statistics {
  margin-bottom: 24px;
}

.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.statistics-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.statistics-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

.fault-chart {
  width: 100%;
  height: 300px;
}

.statistics-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.summary-value.success {
  color: #67c23a;
}

.summary-value.warning {
  color: #e6a23c;
}

.summary-value.error {
  color: #f56c6c;
}

.summary-value.info {
  color: #409eff;
}

.alarm-history {
  margin-bottom: 24px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.alarm-timeline {
  position: relative;
  max-height: 400px;
  overflow-y: auto;
}

.alarm-item {
  display: grid;
  grid-template-columns: 120px 40px 1fr;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.alarm-item:last-child {
  border-bottom: none;
}

.alarm-item:last-child .indicator-line {
  display: none;
}

.alarm-time {
  text-align: right;
  padding-right: 8px;
}

.time-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.time-clock {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.alarm-indicator {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #409eff;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #409eff;
  z-index: 1;
}

.severity-high .indicator-dot {
  background-color: #f56c6c;
  box-shadow: 0 0 0 2px #f56c6c;
}

.severity-medium .indicator-dot {
  background-color: #e6a23c;
  box-shadow: 0 0 0 2px #e6a23c;
}

.severity-low .indicator-dot {
  background-color: #909399;
  box-shadow: 0 0 0 2px #909399;
}

.indicator-line {
  width: 2px;
  flex: 1;
  background-color: #e4e7ed;
  margin-top: 8px;
}

.alarm-content {
  padding-left: 8px;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alarm-title {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.alarm-details {
  margin-bottom: 12px;
}

.alarm-device,
.alarm-location {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.alarm-description {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.alarm-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-buttons {
  display: flex;
  gap: 8px;
}

/* 状态标签样式 */
.status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .el-icon {
    font-size: 14px;
  }
  
  span {
    line-height: 1;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .statistics-content {
    grid-template-columns: 1fr;
  }
  
  .list-header,
  .device-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-item,
  .item-content {
    padding: 4px 0;
  }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section,
  .action-section {
    width: 100%;
    justify-content: center;
  }
  
  .filter-section .el-select,
  .filter-section .el-input {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .alarm-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .alarm-indicator {
    display: none;
  }
  
  .alarm-time {
    text-align: left;
    padding-right: 0;
  }
}
</style>