<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToDashboard = () => {
  router.push('/dashboard')
}

const goToChat = () => {
  router.push('/chat')
}
</script>

<template>
  <main>
    <div class="home-container">
      <div class="dashboard-entry">
        <div class="entry-card">
          <div class="entry-icon">
            <el-icon size="48"><Warning /></el-icon>
          </div>
          <h2 class="entry-title">火灾预警数据看板</h2>
          <p class="entry-description">
            实时监控火灾预警状态、温湿度数据、传感器信息、视频监控等，
            为火灾预防和应急响应提供全面的数字化解决方案。
          </p>
          <div class="entry-features">
            <div class="feature-item">
              <el-icon><Monitor /></el-icon>
              <span>实时监控</span>
            </div>
            <div class="feature-item">
              <el-icon><Bell /></el-icon>
              <span>智能报警</span>
            </div>
            <div class="feature-item">
              <el-icon><TrendCharts /></el-icon>
              <span>数据分析</span>
            </div>
            <div class="feature-item">
              <el-icon><VideoCamera /></el-icon>
              <span>视频监控</span>
            </div>
          </div>
          <el-button 
            type="primary" 
            size="large" 
            @click="goToDashboard"
            class="dashboard-button"
          >
            <el-icon><Right /></el-icon>
            进入看板
          </el-button>
        </div>
      </div>
      
      <!-- AI对话入口 -->
      <div class="chat-entry">
        <div class="entry-card chat-card">
          <div class="entry-icon">
            <el-icon size="48"><ChatDotRound /></el-icon>
          </div>
          <h2 class="entry-title">AI 智能助手</h2>
          <p class="entry-description">
            基于 DeepSeek-V3.1 大模型的智能对话助手，支持多轮对话、代码高亮、
            流式响应等功能，为您提供专业的技术咨询和问题解答。
          </p>
          <div class="entry-features">
            <div class="feature-item">
              <el-icon><ChatLineRound /></el-icon>
              <span>多轮对话</span>
            </div>
            <div class="feature-item">
              <el-icon><DocumentCopy /></el-icon>
              <span>代码高亮</span>
            </div>
            <div class="feature-item">
              <el-icon><Lightning /></el-icon>
              <span>流式响应</span>
            </div>
            <div class="feature-item">
              <el-icon><FolderOpened /></el-icon>
              <span>本地缓存</span>
            </div>
          </div>
          <el-button 
            type="success" 
            size="large" 
            @click="goToChat"
            class="chat-button"
          >
            <el-icon><Right /></el-icon>
            开始对话
          </el-button>
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
.home-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-entry,
.chat-entry {
  display: flex;
  justify-content: center;
}

.entry-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.chat-card {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.entry-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.entry-icon {
  margin-bottom: 20px;
  color: #ffd700;
}

.entry-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.entry-description {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.9;
}

.entry-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.feature-item .el-icon {
  font-size: 18px;
  color: #ffd700;
}

.dashboard-button {
  font-size: 18px;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
}

.dashboard-button:hover,
.chat-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.chat-button {
  font-size: 18px;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
}



@media (max-width: 768px) {
  .home-container {
    padding: 20px 16px;
    gap: 30px;
    grid-template-columns: 1fr;
  }
  
  .entry-card {
    padding: 30px 20px;
  }
  
  .entry-title {
    font-size: 24px;
  }
  
  .entry-description {
    font-size: 14px;
  }
  
  .entry-features {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .dashboard-button {
    font-size: 16px;
    padding: 10px 24px;
  }
}

@media (max-width: 480px) {
  .entry-card {
    padding: 24px 16px;
  }
  
  .entry-title {
    font-size: 20px;
  }
  
  .feature-item {
    font-size: 13px;
  }
}
</style>
