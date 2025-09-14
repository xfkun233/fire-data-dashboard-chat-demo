<template>
  <div class="emergency-response">
    <el-card class="emergency-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Warning /></el-icon>
          <span class="header-title">紧急响应信息</span>
        </div>
      </template>

      <!-- 疏散指示 -->
      <div class="evacuation-section">
        <div class="section-header">
          <el-icon class="section-icon"><Guide /></el-icon>
          <span class="section-title">疏散指示</span>
        </div>
        
        <div class="evacuation-routes">
          <div 
            v-for="route in evacuationRoutes" 
            :key="route.id"
            class="route-item"
            :class="{ 'blocked': route.status === '阻塞', 'recommended': route.recommended }"
          >
            <div class="route-header">
              <div class="route-info">
                <div class="route-name">
                  <el-icon><Position /></el-icon>
                  {{ route.name }}
                </div>
                <el-tag 
                  :type="getRouteStatusType(route.status)"
                  size="small"
                  :class="{ 'blinking': route.recommended }"
                >
                  {{ route.status }}
                </el-tag>
              </div>
              <div v-if="route.recommended" class="recommended-badge">
                <el-tag type="success" size="small">
                  <el-icon><Star /></el-icon>
                  推荐路线
                </el-tag>
              </div>
            </div>
            
            <div class="route-details">
              <div class="route-detail">
                <span class="detail-label">距离:</span>
                <span class="detail-value">{{ route.distance }}</span>
              </div>
              <div class="route-detail">
                <span class="detail-label">预计时间:</span>
                <span class="detail-value">{{ route.estimatedTime }}</span>
              </div>
              <div class="route-detail">
                <span class="detail-label">出口:</span>
                <span class="detail-value">{{ route.exit }}</span>
              </div>
            </div>
            
            <div class="route-path">
              <div class="path-steps">
                <div 
                  v-for="(step, index) in route.steps" 
                  :key="index"
                  class="path-step"
                >
                  <el-icon class="step-icon"><Right /></el-icon>
                  <span>{{ step }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 灭火系统状态 -->
      <div class="fire-suppression-section">
        <div class="section-header">
          <el-icon class="section-icon"><Opportunity /></el-icon>
          <span class="section-title">灭火系统状态</span>
        </div>
        
        <div class="suppression-systems">
          <div 
            v-for="system in suppressionSystems" 
            :key="system.id"
            class="system-item"
            :class="{ 'active': system.status === '已启动', 'fault': system.status === '故障' }"
          >
            <div class="system-header">
              <div class="system-info">
                <div class="system-name">
                  <el-icon><Tools /></el-icon>
                  {{ system.name }}
                </div>
                <div class="system-location">{{ system.location }}</div>
              </div>
              <div class="system-status">
                <el-tag 
                  :type="getSystemStatusType(system.status)"
                  size="large"
                  :class="{ 'blinking': system.status === '已启动' }"
                >
                  <el-icon>
                    <component :is="getSystemStatusIcon(system.status)" />
                  </el-icon>
                  {{ system.status }}
                </el-tag>
              </div>
            </div>
            
            <div class="system-details">
              <div class="system-detail">
                <span class="detail-label">类型:</span>
                <span class="detail-value">{{ system.type }}</span>
              </div>
              <div class="system-detail">
                <span class="detail-label">压力:</span>
                <span class="detail-value">{{ system.pressure }}</span>
              </div>
              <div class="system-detail">
                <span class="detail-label">最后检查:</span>
                <span class="detail-value">{{ system.lastCheck }}</span>
              </div>
            </div>
            
            <div v-if="system.status === '已启动'" class="activation-info">
              <div class="activation-detail">
                <span class="detail-label">启动时间:</span>
                <span class="detail-value">{{ system.activationTime }}</span>
              </div>
              <div class="activation-detail">
                <span class="detail-label">剩余容量:</span>
                <span class="detail-value">{{ system.remainingCapacity }}</span>
              </div>
            </div>
            
            <div class="system-actions">
              <el-button 
                v-if="system.status === '待机'"
                type="danger" 
                size="small"
                @click="activateSystem(system.id)"
              >
                <el-icon><VideoPlay /></el-icon>
                手动启动
              </el-button>
              <el-button 
                v-if="system.status === '已启动'"
                type="warning" 
                size="small"
                @click="stopSystem(system.id)"
              >
                <el-icon><VideoPause /></el-icon>
                停止系统
              </el-button>
              <el-button 
                type="info" 
                size="small"
                @click="testSystem(system.id)"
              >
                <el-icon><Setting /></el-icon>
                系统测试
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 紧急联络信息 -->
      <div class="emergency-contacts-section">
        <div class="section-header">
          <el-icon class="section-icon"><Phone /></el-icon>
          <span class="section-title">紧急联络信息</span>
        </div>
        
        <div class="contacts-grid">
          <div 
            v-for="contact in emergencyContacts" 
            :key="contact.id"
            class="contact-item"
          >
            <div class="contact-header">
              <div class="contact-icon">
                <el-icon>
                  <component :is="contact.icon" />
                </el-icon>
              </div>
              <div class="contact-info">
                <div class="contact-title">{{ contact.title }}</div>
                <div class="contact-department">{{ contact.department }}</div>
              </div>
            </div>
            
            <div class="contact-details">
              <div class="contact-phone">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="callContact(contact.phone)"
                  class="phone-button"
                >
                  <el-icon><Phone /></el-icon>
                  {{ contact.phone }}
                </el-button>
              </div>
              <div v-if="contact.extension" class="contact-extension">
                <span class="extension-label">分机:</span>
                <span class="extension-value">{{ contact.extension }}</span>
              </div>
              <div class="contact-availability">
                <el-tag 
                  :type="contact.available ? 'success' : 'warning'"
                  size="small"
                >
                  <el-icon>
                    <component :is="contact.available ? 'CircleCheck' : 'Clock'" />
                  </el-icon>
                  {{ contact.available ? '在线' : '离线' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 快速拨号 -->
        <div class="quick-dial">
          <div class="quick-dial-header">
            <el-icon><Phone /></el-icon>
            <span>快速拨号</span>
          </div>
          <div class="quick-dial-buttons">
            <el-button 
              type="danger" 
              size="large"
              @click="callEmergency('119')"
              class="emergency-button"
            >
              <el-icon><Phone /></el-icon>
              119 消防
            </el-button>
            <el-button 
              type="warning" 
              size="large"
              @click="callEmergency('110')"
              class="emergency-button"
            >
              <el-icon><Phone /></el-icon>
              110 报警
            </el-button>
            <el-button 
              type="primary" 
              size="large"
              @click="callEmergency('120')"
              class="emergency-button"
            >
              <el-icon><Phone /></el-icon>
              120 急救
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 疏散路线数据
const evacuationRoutes = ref([
  {
    id: 1,
    name: '主要疏散路线A',
    status: '畅通',
    recommended: true,
    distance: '120米',
    estimatedTime: '2分钟',
    exit: '东门出口',
    steps: ['从当前位置向东走', '经过主走廊', '下楼梯到1楼', '从东门出口离开']
  },
  {
    id: 2,
    name: '备用疏散路线B',
    status: '畅通',
    recommended: false,
    distance: '180米',
    estimatedTime: '3分钟',
    exit: '西门出口',
    steps: ['从当前位置向西走', '经过西侧走廊', '使用西侧楼梯', '从西门出口离开']
  },
  {
    id: 3,
    name: '紧急疏散路线C',
    status: '阻塞',
    recommended: false,
    distance: '90米',
    estimatedTime: '不可用',
    exit: '南门出口',
    steps: ['路线当前不可用', '请选择其他路线']
  }
])

// 灭火系统数据
const suppressionSystems = ref([
  {
    id: 1,
    name: '自动喷淋系统',
    location: 'A栋全楼层',
    status: '已启动',
    type: '水喷淋',
    pressure: '0.8 MPa',
    lastCheck: '2024-01-10',
    activationTime: '2024-01-15 14:30:25',
    remainingCapacity: '85%'
  },
  {
    id: 2,
    name: '气体灭火系统',
    location: 'B栋机房',
    status: '待机',
    type: '七氟丙烷',
    pressure: '4.2 MPa',
    lastCheck: '2024-01-12',
    activationTime: '',
    remainingCapacity: '100%'
  },
  {
    id: 3,
    name: '泡沫灭火系统',
    location: 'C栋地下车库',
    status: '故障',
    type: 'AFFF泡沫',
    pressure: '0 MPa',
    lastCheck: '2024-01-08',
    activationTime: '',
    remainingCapacity: '0%'
  }
])

// 紧急联络人数据
const emergencyContacts = ref([
  {
    id: 1,
    title: '消防安全主管',
    department: '安全部',
    phone: '138-0000-1001',
    extension: '8001',
    available: true,
    icon: 'User'
  },
  {
    id: 2,
    title: '建筑物管理员',
    department: '物业管理',
    phone: '138-0000-1002',
    extension: '8002',
    available: true,
    icon: 'House'
  },
  {
    id: 3,
    title: '安保队长',
    department: '安保部',
    phone: '138-0000-1003',
    extension: '8003',
    available: false,
    icon: 'Shield'
  },
  {
    id: 4,
    title: '医疗急救员',
    department: '医务室',
    phone: '138-0000-1004',
    extension: '8004',
    available: true,
    icon: 'FirstAidKit'
  }
])

// 获取路线状态类型
const getRouteStatusType = (status) => {
  switch (status) {
    case '畅通':
      return 'success'
    case '阻塞':
      return 'danger'
    case '拥挤':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取系统状态类型
const getSystemStatusType = (status) => {
  switch (status) {
    case '已启动':
      return 'success'
    case '待机':
      return 'info'
    case '故障':
      return 'danger'
    default:
      return 'warning'
  }
}

// 获取系统状态图标
const getSystemStatusIcon = (status) => {
  switch (status) {
    case '已启动':
      return 'CircleCheck'
    case '待机':
      return 'Clock'
    case '故障':
      return 'CircleClose'
    default:
      return 'Warning'
  }
}

// 启动灭火系统
const activateSystem = async (systemId) => {
  try {
    await ElMessageBox.confirm(
      '确定要手动启动此灭火系统吗？',
      '确认操作',
      {
        confirmButtonText: '确定启动',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const system = suppressionSystems.value.find(s => s.id === systemId)
    if (system) {
      system.status = '已启动'
      system.activationTime = new Date().toLocaleString('zh-CN')
      system.remainingCapacity = '100%'
    }
    
    ElMessage({
      message: '灭火系统已启动',
      type: 'success',
      duration: 3000
    })
  } catch {
    ElMessage({
      message: '操作已取消',
      type: 'info',
      duration: 2000
    })
  }
}

// 停止灭火系统
const stopSystem = async (systemId) => {
  try {
    await ElMessageBox.confirm(
      '确定要停止此灭火系统吗？',
      '确认操作',
      {
        confirmButtonText: '确定停止',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const system = suppressionSystems.value.find(s => s.id === systemId)
    if (system) {
      system.status = '待机'
      system.activationTime = ''
    }
    
    ElMessage({
      message: '灭火系统已停止',
      type: 'warning',
      duration: 3000
    })
  } catch {
    ElMessage({
      message: '操作已取消',
      type: 'info',
      duration: 2000
    })
  }
}

// 测试灭火系统
const testSystem = (systemId) => {
  ElMessage({
    message: '正在执行系统测试...',
    type: 'info',
    duration: 3000
  })
}

// 拨打联系人电话
const callContact = (phone) => {
  ElMessage({
    message: `正在拨打 ${phone}...`,
    type: 'success',
    duration: 3000
  })
}

// 拨打紧急电话
const callEmergency = (number) => {
  ElMessage({
    message: `正在拨打紧急电话 ${number}...`,
    type: 'warning',
    duration: 3000
  })
}
</script>

<style scoped>
.emergency-response {
  width: 100%;
  max-width: 800px;
}

.emergency-card {
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

.evacuation-section,
.fire-suppression-section,
.emergency-contacts-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.section-icon {
  font-size: 18px;
  color: #409eff;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

/* 疏散路线样式 */
.evacuation-routes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.route-item.recommended {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.route-item.blocked {
  border-color: #f56c6c;
  background-color: #fef0f0;
  opacity: 0.7;
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.route-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
}

.route-details {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.route-detail {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.detail-label {
  color: #909399;
}

.detail-value {
  color: #303133;
  font-weight: 500;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.path-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.step-icon {
  color: #409eff;
  font-size: 12px;
}

/* 灭火系统样式 */
.suppression-systems {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.system-item.active {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.system-item.fault {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.system-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.system-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
}

.system-location {
  font-size: 14px;
  color: #909399;
}

.system-details {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.system-detail {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.activation-info {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #67c23a;
}

.activation-detail {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.system-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 紧急联络样式 */
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.contact-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.contact-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 18px;
}

.contact-info {
  flex: 1;
}

.contact-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.contact-department {
  font-size: 14px;
  color: #909399;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phone-button {
  width: 100%;
  font-size: 16px;
  font-weight: 600;
}

.contact-extension {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.extension-label {
  color: #909399;
}

.extension-value {
  color: #303133;
  font-weight: 500;
}

.quick-dial {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #f56c6c;
}

.quick-dial-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #f56c6c;
}

.quick-dial-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.emergency-button {
  flex: 1;
  min-width: 120px;
  font-size: 16px;
  font-weight: 600;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .route-details,
  .system-details,
  .activation-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .contacts-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-dial-buttons {
    flex-direction: column;
  }
  
  .emergency-button {
    width: 100%;
  }
}
</style>