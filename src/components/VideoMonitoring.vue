<template>
  <div class="video-monitoring">
    <el-card class="video-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><VideoCamera /></el-icon>
          <span class="header-title">实时视频监控</span>
        </div>
      </template>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="camera-selector">
          <el-select v-model="selectedCamera" @change="switchCamera" placeholder="选择摄像头">
            <el-option 
              v-for="camera in cameras" 
              :key="camera.id"
              :label="camera.name"
              :value="camera.id"
              :disabled="camera.status === '离线'"
            >
              <div class="camera-option">
                <span>{{ camera.name }}</span>
                <el-tag 
                  :type="camera.status === '在线' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ camera.status }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </div>
        
        <div class="view-mode">
          <el-radio-group v-model="viewMode" @change="changeViewMode">
            <el-radio-button label="single">单画面</el-radio-button>
            <el-radio-button label="quad">四分屏</el-radio-button>
            <el-radio-button label="grid">九宫格</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="actions">
          <el-button type="primary" @click="takeScreenshot">
            <el-icon><Camera /></el-icon>
            截图
          </el-button>
          <el-button type="info" @click="startRecording" :disabled="isRecording">
            <el-icon><VideoPlay /></el-icon>
            {{ isRecording ? '录制中...' : '开始录制' }}
          </el-button>
          <el-button v-if="isRecording" type="warning" @click="stopRecording">
            <el-icon><VideoPause /></el-icon>
            停止录制
          </el-button>
        </div>
      </div>

      <!-- 视频显示区域 -->
      <div class="video-container" :class="`view-${viewMode}`">
        <!-- 单画面模式 -->
        <div v-if="viewMode === 'single'" class="single-view">
          <div class="video-wrapper">
            <div class="video-placeholder">
              <div class="camera-info">
                <div class="camera-name">{{ getCurrentCamera()?.name }}</div>
                <div class="camera-location">{{ getCurrentCamera()?.location }}</div>
                <div class="camera-status">
                  <el-tag 
                    :type="getCurrentCamera()?.status === '在线' ? 'success' : 'danger'"
                    size="small"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    {{ getCurrentCamera()?.status }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 模拟视频画面 -->
              <div class="video-simulation">
                <div class="video-overlay">
                  <div class="timestamp">{{ currentTime }}</div>
                  <div class="recording-indicator" v-if="isRecording">
                    <el-icon class="recording-dot"><CircleFilled /></el-icon>
                    <span>REC</span>
                  </div>
                </div>
                
                <!-- 火灾检测覆盖层 -->
                <div v-if="getCurrentCamera()?.fireDetected" class="fire-overlay">
                  <div class="fire-alert">
                    <el-icon class="fire-icon"><Warning /></el-icon>
                    <span>检测到火焰</span>
                  </div>
                  <div class="fire-box"></div>
                </div>
                
                <!-- 烟雾检测覆盖层 -->
                <div v-if="getCurrentCamera()?.smokeDetected" class="smoke-overlay">
                  <div class="smoke-alert">
                    <el-icon class="smoke-icon"><Smoking /></el-icon>
                    <span>检测到烟雾</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 摄像头控制 -->
            <div class="camera-controls">
              <div class="ptz-controls">
                <div class="ptz-title">云台控制</div>
                <div class="ptz-buttons">
                  <div class="ptz-row">
                    <el-button size="small" @click="ptzControl('up')">
                      <el-icon><ArrowUp /></el-icon>
                    </el-button>
                  </div>
                  <div class="ptz-row">
                    <el-button size="small" @click="ptzControl('left')">
                      <el-icon><ArrowLeft /></el-icon>
                    </el-button>
                    <el-button size="small" @click="ptzControl('home')">
                      <el-icon><Aim /></el-icon>
                    </el-button>
                    <el-button size="small" @click="ptzControl('right')">
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                  <div class="ptz-row">
                    <el-button size="small" @click="ptzControl('down')">
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
              
              <div class="zoom-controls">
                <div class="zoom-title">变焦控制</div>
                <div class="zoom-buttons">
                  <el-button size="small" @click="zoomControl('in')">
                    <el-icon><ZoomIn /></el-icon>
                    放大
                  </el-button>
                  <el-button size="small" @click="zoomControl('out')">
                    <el-icon><ZoomOut /></el-icon>
                    缩小
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 四分屏模式 -->
        <div v-else-if="viewMode === 'quad'" class="quad-view">
          <div 
            v-for="camera in cameras.slice(0, 4)" 
            :key="camera.id"
            class="quad-item"
            @click="selectCamera(camera.id)"
            :class="{ 'selected': selectedCamera === camera.id }"
          >
            <div class="quad-header">
              <span class="quad-name">{{ camera.name }}</span>
              <el-tag 
                :type="camera.status === '在线' ? 'success' : 'danger'"
                size="small"
              >
                {{ camera.status }}
              </el-tag>
            </div>
            <div class="quad-video">
              <div class="video-simulation small">
                <div v-if="camera.fireDetected" class="fire-indicator">
                  <el-icon><Warning /></el-icon>
                </div>
                <div v-if="camera.smokeDetected" class="smoke-indicator">
                  <el-icon><Smoking /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 九宫格模式 -->
        <div v-else-if="viewMode === 'grid'" class="grid-view">
          <div 
            v-for="camera in cameras" 
            :key="camera.id"
            class="grid-item"
            @click="selectCamera(camera.id)"
            :class="{ 'selected': selectedCamera === camera.id }"
          >
            <div class="grid-header">
              <span class="grid-name">{{ camera.name }}</span>
              <el-tag 
                :type="camera.status === '在线' ? 'success' : 'danger'"
                size="small"
              >
                {{ camera.status }}
              </el-tag>
            </div>
            <div class="grid-video">
              <div class="video-simulation mini">
                <div v-if="camera.fireDetected" class="fire-indicator">
                  <el-icon><Warning /></el-icon>
                </div>
                <div v-if="camera.smokeDetected" class="smoke-indicator">
                  <el-icon><Smoking /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 截图历史 -->
      <div class="screenshot-history">
        <div class="history-header">
          <div class="history-title">
            <el-icon><Picture /></el-icon>
            <span>截图历史</span>
          </div>
          <el-button type="text" @click="clearScreenshots">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="screenshots-grid">
          <div 
            v-for="screenshot in screenshots" 
            :key="screenshot.id"
            class="screenshot-item"
            @click="viewScreenshot(screenshot)"
          >
            <div class="screenshot-image">
              <el-icon class="image-placeholder"><Picture /></el-icon>
            </div>
            <div class="screenshot-info">
              <div class="screenshot-camera">{{ screenshot.cameraName }}</div>
              <div class="screenshot-time">{{ screenshot.timestamp }}</div>
            </div>
            <div class="screenshot-actions">
              <el-button type="text" size="small" @click.stop="downloadScreenshot(screenshot)">
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button type="text" size="small" @click.stop="deleteScreenshot(screenshot.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 录制历史 -->
      <div class="recording-history">
        <div class="history-header">
          <div class="history-title">
            <el-icon><VideoPlay /></el-icon>
            <span>录制历史</span>
          </div>
          <el-button type="text" @click="clearRecordings">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="recordings-list">
          <div 
            v-for="recording in recordings" 
            :key="recording.id"
            class="recording-item"
          >
            <div class="recording-icon">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <div class="recording-info">
              <div class="recording-name">{{ recording.name }}</div>
              <div class="recording-details">
                <span>{{ recording.cameraName }}</span>
                <span>{{ recording.duration }}</span>
                <span>{{ recording.size }}</span>
              </div>
              <div class="recording-time">{{ recording.timestamp }}</div>
            </div>
            <div class="recording-actions">
              <el-button type="text" size="small" @click="playRecording(recording)">
                <el-icon><VideoPlay /></el-icon>
                播放
              </el-button>
              <el-button type="text" size="small" @click="downloadRecording(recording)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button type="text" size="small" @click="deleteRecording(recording.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const selectedCamera = ref(1)
const viewMode = ref('single')
const isRecording = ref(false)
const currentTime = ref('')
let timeInterval = null

// 摄像头数据
const cameras = ref([
  {
    id: 1,
    name: '大厅主摄像头',
    location: 'A栋1楼大厅',
    status: '在线',
    fireDetected: false,
    smokeDetected: false
  },
  {
    id: 2,
    name: '301室摄像头',
    location: 'A栋3楼301室',
    status: '在线',
    fireDetected: true, // 检测到火焰
    smokeDetected: true // 检测到烟雾
  },
  {
    id: 3,
    name: '机房摄像头',
    location: 'B栋2楼机房',
    status: '在线',
    fireDetected: false,
    smokeDetected: true // 检测到烟雾
  },
  {
    id: 4,
    name: '地下室摄像头',
    location: 'C栋地下室',
    status: '离线',
    fireDetected: false,
    smokeDetected: false
  },
  {
    id: 5,
    name: '停车场摄像头',
    location: 'C栋地下车库',
    status: '在线',
    fireDetected: false,
    smokeDetected: false
  },
  {
    id: 6,
    name: '楼梯间摄像头',
    location: 'A栋楼梯间',
    status: '在线',
    fireDetected: false,
    smokeDetected: false
  }
])

// 截图历史
const screenshots = ref([
  {
    id: 1,
    cameraName: '301室摄像头',
    timestamp: '2024-01-15 14:30:25',
    filename: 'screenshot_001.jpg'
  },
  {
    id: 2,
    cameraName: '机房摄像头',
    timestamp: '2024-01-15 12:15:10',
    filename: 'screenshot_002.jpg'
  }
])

// 录制历史
const recordings = ref([
  {
    id: 1,
    name: '火灾事件录制',
    cameraName: '301室摄像头',
    duration: '05:23',
    size: '125MB',
    timestamp: '2024-01-15 14:30:00',
    filename: 'recording_001.mp4'
  },
  {
    id: 2,
    name: '烟雾检测录制',
    cameraName: '机房摄像头',
    duration: '03:45',
    size: '89MB',
    timestamp: '2024-01-15 12:15:00',
    filename: 'recording_002.mp4'
  }
])

// 获取当前摄像头
const getCurrentCamera = () => {
  return cameras.value.find(camera => camera.id === selectedCamera.value)
}

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

// 切换摄像头
const switchCamera = (cameraId) => {
  selectedCamera.value = cameraId
  ElMessage({
    message: `已切换到 ${getCurrentCamera()?.name}`,
    type: 'success',
    duration: 2000
  })
}

// 选择摄像头
const selectCamera = (cameraId) => {
  selectedCamera.value = cameraId
}

// 改变视图模式
const changeViewMode = (mode) => {
  viewMode.value = mode
  ElMessage({
    message: `已切换到${mode === 'single' ? '单画面' : mode === 'quad' ? '四分屏' : '九宫格'}模式`,
    type: 'info',
    duration: 2000
  })
}

// 截图
const takeScreenshot = () => {
  const camera = getCurrentCamera()
  if (!camera || camera.status === '离线') {
    ElMessage({
      message: '摄像头离线，无法截图',
      type: 'error',
      duration: 2000
    })
    return
  }
  
  const screenshot = {
    id: Date.now(),
    cameraName: camera.name,
    timestamp: new Date().toLocaleString('zh-CN'),
    filename: `screenshot_${Date.now()}.jpg`
  }
  
  screenshots.value.unshift(screenshot)
  
  ElMessage({
    message: '截图成功',
    type: 'success',
    duration: 2000
  })
}

// 开始录制
const startRecording = () => {
  const camera = getCurrentCamera()
  if (!camera || camera.status === '离线') {
    ElMessage({
      message: '摄像头离线，无法录制',
      type: 'error',
      duration: 2000
    })
    return
  }
  
  isRecording.value = true
  ElMessage({
    message: '开始录制',
    type: 'success',
    duration: 2000
  })
}

// 停止录制
const stopRecording = () => {
  isRecording.value = false
  
  const camera = getCurrentCamera()
  const recording = {
    id: Date.now(),
    name: `录制_${camera.name}`,
    cameraName: camera.name,
    duration: '02:15', // 模拟录制时长
    size: '67MB',
    timestamp: new Date().toLocaleString('zh-CN'),
    filename: `recording_${Date.now()}.mp4`
  }
  
  recordings.value.unshift(recording)
  
  ElMessage({
    message: '录制已停止并保存',
    type: 'success',
    duration: 2000
  })
}

// 云台控制
const ptzControl = (direction) => {
  const directions = {
    up: '向上',
    down: '向下',
    left: '向左',
    right: '向右',
    home: '回到中心位置'
  }
  
  ElMessage({
    message: `云台${directions[direction]}`,
    type: 'info',
    duration: 1000
  })
}

// 变焦控制
const zoomControl = (type) => {
  ElMessage({
    message: type === 'in' ? '放大' : '缩小',
    type: 'info',
    duration: 1000
  })
}

// 查看截图
const viewScreenshot = (screenshot) => {
  ElMessage({
    message: `查看截图: ${screenshot.filename}`,
    type: 'info',
    duration: 2000
  })
}

// 下载截图
const downloadScreenshot = (screenshot) => {
  ElMessage({
    message: `下载截图: ${screenshot.filename}`,
    type: 'success',
    duration: 2000
  })
}

// 删除截图
const deleteScreenshot = async (screenshotId) => {
  try {
    await ElMessageBox.confirm('确定要删除这张截图吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = screenshots.value.findIndex(s => s.id === screenshotId)
    if (index > -1) {
      screenshots.value.splice(index, 1)
      ElMessage({
        message: '截图已删除',
        type: 'success',
        duration: 2000
      })
    }
  } catch {
    // 用户取消删除
  }
}

// 清空截图
const clearScreenshots = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有截图吗？', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    screenshots.value = []
    ElMessage({
      message: '截图已清空',
      type: 'success',
      duration: 2000
    })
  } catch {
    // 用户取消清空
  }
}

// 播放录制
const playRecording = (recording) => {
  ElMessage({
    message: `播放录制: ${recording.filename}`,
    type: 'info',
    duration: 2000
  })
}

// 下载录制
const downloadRecording = (recording) => {
  ElMessage({
    message: `下载录制: ${recording.filename}`,
    type: 'success',
    duration: 2000
  })
}

// 删除录制
const deleteRecording = async (recordingId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个录制文件吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = recordings.value.findIndex(r => r.id === recordingId)
    if (index > -1) {
      recordings.value.splice(index, 1)
      ElMessage({
        message: '录制文件已删除',
        type: 'success',
        duration: 2000
      })
    }
  } catch {
    // 用户取消删除
  }
}

// 清空录制
const clearRecordings = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有录制文件吗？', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    recordings.value = []
    ElMessage({
      message: '录制文件已清空',
      type: 'success',
      duration: 2000
    })
  } catch {
    // 用户取消清空
  }
}

// 组件挂载
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.video-monitoring {
  width: 100%;
}

.video-card {
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

.control-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.camera-selector {
  min-width: 200px;
}

.camera-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.view-mode {
  flex: 1;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.video-container {
  margin-bottom: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

/* 单画面模式 */
.single-view {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.video-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-placeholder {
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.camera-info {
  position: absolute;
  top: 16px;
  left: 16px;
  color: white;
  z-index: 2;
}

.camera-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.camera-location {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.video-simulation {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.video-simulation.small {
  font-size: 16px;
}

.video-simulation.mini {
  font-size: 12px;
}

.video-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 2;
}

.timestamp {
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: white;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 0, 0, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: white;
}

.recording-dot {
  animation: blink 1s infinite;
}

.fire-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.fire-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(245, 108, 108, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  animation: pulse 1s infinite;
}

.fire-icon {
  font-size: 20px;
}

.fire-box {
  position: absolute;
  top: 30%;
  left: 40%;
  width: 20%;
  height: 15%;
  border: 3px solid #f56c6c;
  border-radius: 4px;
  animation: blink 1s infinite;
}

.smoke-overlay {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.smoke-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(230, 162, 60, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  animation: pulse 1s infinite;
}

.smoke-icon {
  font-size: 16px;
}

.fire-indicator,
.smoke-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  animation: pulse 1s infinite;
}

.fire-indicator {
  background-color: #f56c6c;
}

.smoke-indicator {
  background-color: #e6a23c;
}

.camera-controls {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ptz-controls,
.zoom-controls {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.ptz-title,
.zoom-title {
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  color: #303133;
}

.ptz-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ptz-row {
  display: flex;
  gap: 4px;
}

.zoom-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 四分屏模式 */
.quad-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.quad-item {
  position: relative;
  aspect-ratio: 16/9;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.quad-item:hover {
  border-color: #409eff;
}

.quad-item.selected {
  border-color: #67c23a;
}

.quad-header {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.quad-name {
  color: white;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
}

.quad-video {
  width: 100%;
  height: 100%;
}

/* 九宫格模式 */
.grid-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.grid-item {
  position: relative;
  aspect-ratio: 16/9;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.grid-item:hover {
  border-color: #409eff;
}

.grid-item.selected {
  border-color: #67c23a;
}

.grid-header {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.grid-name {
  color: white;
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 2px;
}

.grid-video {
  width: 100%;
  height: 100%;
}

/* 截图和录制历史 */
.screenshot-history,
.recording-history {
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

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.screenshot-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.screenshot-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.screenshot-image {
  height: 120px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.image-placeholder {
  font-size: 32px;
}

.screenshot-info {
  padding: 8px;
}

.screenshot-camera {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.screenshot-time {
  font-size: 12px;
  color: #909399;
}

.screenshot-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px;
  background-color: #f5f7fa;
}

.recordings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recording-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
}

.recording-icon {
  width: 40px;
  height: 40px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.recording-info {
  flex: 1;
}

.recording-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.recording-details {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.recording-time {
  font-size: 12px;
  color: #909399;
}

.recording-actions {
  display: flex;
  gap: 8px;
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .single-view {
    flex-direction: column;
  }
  
  .camera-controls {
    width: 100%;
    flex-direction: row;
  }
  
  .ptz-controls,
  .zoom-controls {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .camera-selector,
  .view-mode,
  .actions {
    width: 100%;
  }
  
  .actions {
    justify-content: center;
  }
  
  .grid-view {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .screenshots-grid {
    grid-template-columns: 1fr;
  }
  
  .recording-details {
    flex-direction: column;
    gap: 4px;
  }
}
</style>