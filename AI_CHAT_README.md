# AI 智能助手功能说明

## 功能特性

- 🤖 **DeepSeek-V3.1 大模型**: 基于先进的AI大模型提供智能对话
- 💬 **多轮对话**: 支持上下文记忆的连续对话
- ⚡ **流式响应**: 实时显示AI回复，类似打字机效果
- 🎨 **代码高亮**: 自动识别并高亮显示代码块
- 📝 **Markdown支持**: 完整支持Markdown格式渲染
- 💾 **本地缓存**: 自动保存对话历史到本地存储
- 📱 **响应式设计**: 适配各种屏幕尺寸

## 技术栈

- **前端框架**: Vue 3 + Vite
  - 使用组合式 API 与单文件组件（SFC）组织业务，享受更佳的可维护性与类型推导。
  - 通过 Vite 在启动时注入环境变量（import.meta.env），从 .env.local 读取 VITE_DEEPSEEK_API_URL、VITE_DEEPSEEK_API_KEY、VITE_DEEPSEEK_MODEL 作为默认值；修改 .env.local 需重启开发服务器方可生效。
- **UI组件库**: Arco Design + Element Plus
  - Arco Design 用于对话页与设置弹窗等（如 ChatView、SettingsModal），提供现代化交互与表单校验能力。
  - Element Plus 应用于监控/仪表盘类页面与大量现成组件与图标（如卡片、表格、统计、图标等）。
- **状态管理**: Pinia + pinia-plugin-persistedstate
  - 使用 Pinia 管理会话列表、当前对话、以及 AI 相关设置；通过 pinia-plugin-persistedstate 持久化到 localStorage。
  - 设置优先级：手动输入（保存于 localStorage） > .env 注入的默认值 > 框架内置回退值；“重置为默认”会读取 .env 默认并覆盖表单与内存中的设置。
- **代码高亮**: highlight.js
  - 在 ChatView 中通过 markdown-it 的 highlight 回调集成 highlight.js，并使用 GitHub 主题样式，实现多语言代码块高亮。
- **Markdown解析**: markdown-it
  - 渲染 AI 回复文本，支持标题、列表、表格、代码块等常见 Markdown 语法；同时保留原始文本用于复制与二次处理。
- **AI接入与流式思考**: DeepSeek
  - 在 src/services/deepseek.js 封装 API：支持普通与流式两种调用；根据设置构建 payload，并兼容不同服务商对“thinking”参数的约定。
  - 配置来源与更新：优先使用设置面板中的手动值；未设置时使用 import.meta.env 注入的默认值；调用前会动态读取最新配置并更新服务实例。
  - 流式解析：对响应流进行分块解析，区分“可见内容”和“思考内容（thinking）”；思考内容在前端以可折叠块呈现，生成中实时流动，生成完成后默认折叠，支持手动展开/收起。

## 快速开始

### 1. 配置API密钥


 在 `.env.local` 中填入您的DeepSeek API密钥：
   ```
   VITE_DEEPSEEK_API_KEY=你的密钥
   VITE_DEEPSEEK_API_URL=你的API地址
   VITE_DEEPSEEK_MODEL=你的模型名称
   ```

### 2. 获取DeepSeek API密钥

1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在API管理页面创建新的API密钥
4. 复制密钥到配置文件中

### 3. 启动应用

```bash
npm run dev
```

### 4. 访问AI助手

1. 打开浏览器访问
2. 点击首页的"AI 智能助手"卡片
3. 开始与AI对话

## 功能说明

### 对话管理

- **新建对话**: 点击侧边栏的"新建对话"按钮
- **切换对话**: 点击侧边栏的对话项目
- **删除对话**: 点击对话项目的菜单按钮选择删除
- **清空对话**: 点击聊天区域顶部的"清空对话"按钮

### 消息发送

- **发送消息**: 在输入框中输入内容，点击发送按钮或按 `Ctrl + Enter`
- **多行输入**: 输入框支持自动调整高度
- **实时响应**: AI回复会以流式方式实时显示

### 代码支持

支持多种编程语言的语法高亮：

```javascript
// JavaScript示例
const greeting = 'Hello, AI!';
console.log(greeting);
```

```python
# Python示例
def greet(name):
    return f"Hello, {name}!"
```

### 本地存储

- 对话历史自动保存到浏览器本地存储
- 刷新页面后对话记录不会丢失
- 支持跨会话的数据持久化

## 注意事项

1. **API密钥安全**: 请妥善保管您的API密钥，不要泄露给他人
2. **网络连接**: 需要稳定的网络连接以确保流式响应正常工作
3. **浏览器兼容**: 建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
4. **模拟模式**: 如果未配置API密钥，系统会自动使用模拟响应模式

## 故障排除

### 常见问题

1. **AI不响应**
   - 检查API密钥是否正确配置
   - 确认网络连接正常
   - 查看浏览器控制台是否有错误信息

2. **流式响应异常**
   - 检查浏览器是否支持Fetch API和ReadableStream
   - 确认防火墙或代理设置没有阻止连接

3. **代码高亮不显示**
   - 确认highlight.js样式文件已正确加载
   - 检查代码块是否使用正确的Markdown语法

4. **对话历史丢失**
   - 检查浏览器是否允许本地存储
   - 确认没有清除浏览器数据

## 开发说明

### 项目结构

```
src/
├── views/
│   └── ChatView.vue          # AI对话主页面
├── stores/
│   └── chat.js               # 对话状态管理
├── services/
│   └── deepseek.js           # DeepSeek API服务
└── router/
    └── index.js              # 路由配置
```

### 自定义配置

可以在 `src/services/deepseek.js` 中修改AI模型参数：

- `temperature`: 控制回复的随机性（0-1）
- `max_tokens`: 最大回复长度
- `top_p`: 核采样参数

## 更新日志

- **v1.0.0**: 初始版本，支持基础对话功能
- 集成DeepSeek-V3.1 API
- 实现流式响应
- 添加代码高亮和Markdown支持
- 完成本地存储功能