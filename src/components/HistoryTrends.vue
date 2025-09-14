<template>
  <div class="history-trends">
    <el-card class="trends-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><DataAnalysis></DataAnalysis></el-icon>
          <span class="header-title">历史数据和趋势分析</span>
        </div>
      </template>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="time-range">
          <el-select v-model="selectedTimeRange" @change="updateCharts" placeholder="选择时间范围">
            <el-option label="最近24小时" value="24h"></el-option>
            <el-option label="最近7天" value="7d"></el-option>
            <el-option label="最近30天" value="30d"></el-option>
            <el-option label="最近3个月" value="3m"></el-option>
          </el-select>
        </div>
        <div class="chart-type">
          <el-radio-group v-model="selectedChartType" @change="updateCharts">
            <el-radio-button label="temperature">温度</el-radio-button>
            <el-radio-button label="humidity">湿度</el-radio-button>
            <el-radio-button label="smoke">烟雾浓度</el-radio-button>
            <el-radio-button label="events">火灾事件</el-radio-button>
          </el-radio-group>
        </div>
        <div class="actions">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh></Refresh></el-icon>
            刷新数据
          </el-button>
          <el-button type="info" @click="exportData">
            <el-icon><Download></Download></el-icon>
            导出数据
          </el-button>
        </div>
      </div>

      <!-- 图表容器 -->
      <div class="charts-container">
        <!-- 主趋势图 -->
        <div class="main-chart">
          <div class="chart-title">
            <h3>{{ getChartTitle() }}</h3>
            <div class="chart-info">
              <el-tag size="small" type="info">{{ selectedTimeRange === '24h' ? '每小时' : selectedTimeRange === '7d' ? '每天' : '每周' }}更新</el-tag>
            </div>
          </div>
          <div ref="mainChartRef" class="chart-content" style="height: 400px;"></div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-icon temperature">
                <el-icon><Sunny></Sunny></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">平均温度</div>
                <div class="stat-value">{{ stats.avgTemperature }}°C</div>
                <div class="stat-trend" :class="stats.temperatureTrend">
                  <el-icon>
                    <component :is="getTrendIcon(stats.temperatureTrend)"></component>
                  </el-icon>
                  <span>{{ stats.temperatureChange }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon humidity">
                <el-icon><Cloudy></Cloudy></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">平均湿度</div>
                <div class="stat-value">{{ stats.avgHumidity }}%</div>
                <div class="stat-trend" :class="stats.humidityTrend">
                  <el-icon>
                    <component :is="getTrendIcon(stats.humidityTrend)"></component>
                  </el-icon>
                  <span>{{ stats.humidityChange }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon smoke">
                <el-icon><Smoking></Smoking></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">最高烟雾浓度</div>
                <div class="stat-value">{{ stats.maxSmoke }}%</div>
                <div class="stat-trend" :class="stats.smokeTrend">
                  <el-icon>
                    <component :is="getTrendIcon(stats.smokeTrend)"></component>
                  </el-icon>
                  <span>{{ stats.smokeChange }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon events">
                <el-icon><Warning></Warning></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">火灾事件</div>
                <div class="stat-value">{{ stats.fireEvents }}</div>
                <div class="stat-trend" :class="stats.eventsTrend">
                  <el-icon>
                    <component :is="getTrendIcon(stats.eventsTrend)"></component>
                  </el-icon>
                  <span>{{ stats.eventsChange }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分区域对比图 -->
        <div class="comparison-chart">
          <div class="chart-title">
            <h3>分区域对比</h3>
            <div class="chart-info">
              <el-tag size="small" type="success">实时数据</el-tag>
            </div>
          </div>
          <div ref="comparisonChartRef" class="chart-content" style="height: 300px;"></div>
        </div>

        <!-- 火灾事件时间线 -->
        <div v-if="selectedChartType === 'events'" class="events-timeline">
          <div class="chart-title">
            <h3>火灾事件时间线</h3>
          </div>
          <div class="timeline-container">
            <el-timeline>
              <el-timeline-item
                v-for="event in fireEvents"
                :key="event.id"
                :timestamp="event.timestamp"
                :type="getEventType(event.level)"
                :icon="getEventIcon(event.type)"
                placement="top"
              >
                <el-card class="event-card">
                  <div class="event-header">
                    <div class="event-title">{{ event.title }}</div>
                    <el-tag :type="getEventTagType(event.level)" size="small">
                      {{ event.level }}
                    </el-tag>
                  </div>
                  <div class="event-content">
                    <div class="event-location">
                      <el-icon><Location></Location></el-icon>
                      <span>{{ event.location }}</span>
                    </div>
                    <div class="event-description">{{ event.description }}</div>
                    <div class="event-response">
                      <span class="response-label">响应时间:</span>
                      <span class="response-time">{{ event.responseTime }}</span>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 响应式数据
const selectedTimeRange = ref('24h')
const selectedChartType = ref('temperature')
const mainChartRef = ref(null)
const comparisonChartRef = ref(null)
let mainChart = null
let comparisonChart = null

// 统计数据
const stats = ref({
  avgTemperature: 24.5,
  temperatureTrend: 'up',
  temperatureChange: '+2.3°C',
  avgHumidity: 45,
  humidityTrend: 'down',
  humidityChange: '-5%',
  maxSmoke: 85,
  smokeTrend: 'up',
  smokeChange: '+15%',
  fireEvents: 3,
  eventsTrend: 'up',
  eventsChange: '+2'
})

// 火灾事件数据
const fireEvents = ref([
  {
    id: 1,
    timestamp: '2024-01-15 14:30:25',
    title: '高温预警',
    level: '一级预警',
    type: 'temperature',
    location: 'A栋3楼301室',
    description: '检测到异常高温，温度达到68.2°C',
    responseTime: '2分钟'
  },
  {
    id: 2,
    timestamp: '2024-01-15 12:15:10',
    title: '烟雾检测',
    level: '二级预警',
    type: 'smoke',
    location: 'B栋2楼机房',
    description: '烟雾浓度超过安全阈值，达到65%',
    responseTime: '3分钟'
  },
  {
    id: 3,
    timestamp: '2024-01-15 09:45:30',
    title: '传感器故障',
    level: '三级预警',
    type: 'fault',
    location: 'C栋地下室',
    description: '火焰检测器通信中断，需要维修',
    responseTime: '5分钟'
  }
])

// 生成模拟数据
const generateTimeSeriesData = (type, timeRange) => {
  const now = new Date()
  const data = []
  let interval, count
  
  switch (timeRange) {
    case '24h':
      interval = 60 * 60 * 1000 // 1小时
      count = 24
      break
    case '7d':
      interval = 24 * 60 * 60 * 1000 // 1天
      count = 7
      break
    case '30d':
      interval = 24 * 60 * 60 * 1000 // 1天
      count = 30
      break
    case '3m':
      interval = 7 * 24 * 60 * 60 * 1000 // 1周
      count = 12
      break
    default:
      interval = 60 * 60 * 1000
      count = 24
  }
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval)
    let value
    
    switch (type) {
      case 'temperature':
        value = 20 + Math.random() * 10 + (i < 5 ? Math.random() * 30 : 0) // 最近几个点可能有高温
        break
      case 'humidity':
        value = 40 + Math.random() * 30
        break
      case 'smoke':
        value = Math.random() * 20 + (i < 3 ? Math.random() * 60 : 0) // 最近几个点可能有高烟雾
        break
      case 'events':
        value = Math.floor(Math.random() * 3)
        break
      default:
        value = Math.random() * 100
    }
    
    data.push([time, Math.round(value * 100) / 100])
  }
  
  return data
}

// 获取图表标题
const getChartTitle = () => {
  const titles = {
    temperature: '温度趋势',
    humidity: '湿度趋势',
    smoke: '烟雾浓度趋势',
    events: '火灾事件统计'
  }
  return titles[selectedChartType.value] || '数据趋势'
}

// 获取趋势图标
const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return 'ArrowUp'
    case 'down':
      return 'ArrowDown'
    default:
      return 'Minus'
  }
}

// 获取事件类型
const getEventType = (level) => {
  switch (level) {
    case '一级预警':
      return 'danger'
    case '二级预警':
      return 'warning'
    case '三级预警':
      return 'info'
    default:
      return 'primary'
  }
}

// 获取事件图标
const getEventIcon = (type) => {
  switch (type) {
    case 'temperature':
      return 'Sunny'
    case 'smoke':
      return 'Smoking'
    case 'fault':
      return 'Tools'
    default:
      return 'Warning'
  }
}

// 获取事件标签类型
const getEventTagType = (level) => {
  switch (level) {
    case '一级预警':
      return 'danger'
    case '二级预警':
      return 'warning'
    case '三级预警':
      return 'info'
    default:
      return 'primary'
  }
}

// 初始化主图表
const initMainChart = () => {
  if (!mainChartRef.value) return
  
  mainChart = echarts.init(mainChartRef.value)
  updateMainChart()
}

// 更新主图表
const updateMainChart = () => {
  if (!mainChart) return
  
  const data = generateTimeSeriesData(selectedChartType.value, selectedTimeRange.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const date = new Date(params[0].value[0])
        const value = params[0].value[1]
        const unit = selectedChartType.value === 'temperature' ? '°C' : 
                    selectedChartType.value === 'humidity' ? '%' :
                    selectedChartType.value === 'smoke' ? '%' : '次'
        return `${date.toLocaleString('zh-CN')}<br/>${params[0].seriesName}: ${value}${unit}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: selectedChartType.value === 'temperature' ? '温度(°C)' : 
            selectedChartType.value === 'humidity' ? '湿度(%)' :
            selectedChartType.value === 'smoke' ? '烟雾浓度(%)' : '事件数量'
    },
    series: [{
      name: getChartTitle(),
      type: 'line',
      smooth: true,
      data: data,
      lineStyle: {
        color: selectedChartType.value === 'temperature' ? '#f56c6c' :
               selectedChartType.value === 'humidity' ? '#409eff' :
               selectedChartType.value === 'smoke' ? '#e6a23c' : '#909399'
      },
      areaStyle: {
        opacity: 0.3
      },
      markLine: selectedChartType.value === 'temperature' ? {
        data: [{
          yAxis: 60,
          name: '高温警戒线',
          lineStyle: { color: '#f56c6c', type: 'dashed' }
        }]
      } : selectedChartType.value === 'smoke' ? {
        data: [{
          yAxis: 50,
          name: '烟雾警戒线',
          lineStyle: { color: '#e6a23c', type: 'dashed' }
        }]
      } : undefined
    }]
  }
  
  mainChart.setOption(option)
}

// 初始化对比图表
const initComparisonChart = () => {
  if (!comparisonChartRef.value) return
  
  comparisonChart = echarts.init(comparisonChartRef.value)
  updateComparisonChart()
}

// 更新对比图表
const updateComparisonChart = () => {
  if (!comparisonChart) return
  
  const areas = ['A栋1楼', 'A栋3楼', 'B栋2楼', 'C栋地下室']
  const temperatureData = [24.5, 68.2, 26.8, 22.1]
  const humidityData = [45, 35, 52, 68]
  const smokeData = [15, 85, 65, 0]
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['温度(°C)', '湿度(%)', '烟雾浓度(%)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: areas
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '温度(°C)',
        type: 'bar',
        data: temperatureData,
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '湿度(%)',
        type: 'bar',
        data: humidityData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '烟雾浓度(%)',
        type: 'bar',
        data: smokeData,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }
  
  comparisonChart.setOption(option)
}

// 更新图表
const updateCharts = () => {
  nextTick(() => {
    updateMainChart()
    updateComparisonChart()
  })
}

// 刷新数据
const refreshData = () => {
  updateCharts()
  ElMessage({
    message: '数据已刷新',
    type: 'success',
    duration: 2000
  })
}

// 导出数据
const exportData = () => {
  ElMessage({
    message: '正在导出数据...',
    type: 'info',
    duration: 3000
  })
}

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initMainChart()
    initComparisonChart()
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (mainChart) mainChart.resize()
      if (comparisonChart) comparisonChart.resize()
    })
  })
})

// --- 暴露给父组件的摘要数据 ---
const getData = () => {
  const statsSummary = {
    avgTemperature: stats.value.avgTemperature,
    temperatureTrend: stats.value.temperatureTrend,
    temperatureChange: stats.value.temperatureChange,
    avgHumidity: stats.value.avgHumidity,
    humidityTrend: stats.value.humidityTrend,
    humidityChange: stats.value.humidityChange,
    maxSmoke: stats.value.maxSmoke,
    smokeTrend: stats.value.smokeTrend,
    smokeChange: stats.value.smokeChange,
    fireEvents: stats.value.fireEvents,
    eventsTrend: stats.value.eventsTrend,
    eventsChange: stats.value.eventsChange
  }
  const events = fireEvents.value.map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    title: e.title,
    level: e.level,
    type: e.type,
    location: e.location,
    description: e.description,
    responseTime: e.responseTime
  }))
  return {
    stats: statsSummary,
    fireEvents: events
  }
}

defineExpose({ getData })
</script>

<style scoped>
/* 统计卡片区域优化样式 */
.stats-cards {
  margin-top: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #ebeef5);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--el-border-color, #e0e3ea);
}

/* 左侧圆形图标（按类型着色） */
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  flex: 0 0 auto;
}

.stat-icon .el-icon {
  font-size: 22px;
}

.stat-icon.temperature {
  background: linear-gradient(135deg, #ff7a59, #ffae42);
}

.stat-icon.humidity {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.stat-icon.smoke {
  background: linear-gradient(135deg, #e6a23c, #f3d19e);
}

.stat-icon.events {
  background: linear-gradient(135deg, #f56c6c, #fab6b6);
}

/* 右侧文字区域 */
.stat-content {
  margin-left: 14px;
  display: grid;
  row-gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  line-height: 1.2;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  width: fit-content;
}

.stat-trend.up {
  color: var(--el-color-success, #67c23a);
  background: rgba(103, 194, 58, 0.12);
}

.stat-trend.down {
  color: var(--el-color-danger, #f56c6c);
  background: rgba(245, 108, 108, 0.14);
}

.stat-trend .el-icon {
  font-size: 14px;
}

/* 控制面板（时间范围 / 图表类型 / 操作）布局与样式 */
.control-panel {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px 16px;
  align-items: center;
  padding: 12px 16px;
  margin: 8px 0 20px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-light, #ebeef5);
  border-radius: 10px;
}

/* 左侧：时间范围选择器固定最小宽度 */
.time-range :deep(.el-select) {
  width: 220px;
}

/* 中间：单选按钮组，增加间距 */
.chart-type {
  display: flex;
  justify-content: center;
}
.chart-type :deep(.el-radio-button) {
  margin-right: 8px;
}
.chart-type :deep(.el-radio-button:last-child) {
  margin-right: 0;
}

/* 右侧：操作按钮组，靠右排列且保持间距 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.actions .el-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 响应式布局优化 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .control-panel {
    grid-template-columns: 1fr 1fr;
  }
  .chart-type {
    order: 3;
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .stat-card {
    padding: 14px;
  }
  .control-panel {
    grid-template-columns: 1fr;
  }
  .time-range :deep(.el-select) {
    width: 100%;
  }
  .actions {
    justify-content: flex-start;
  }
}
</style>