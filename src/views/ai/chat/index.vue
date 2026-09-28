<template>
  <div class="chat-container">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" style="width: 100%" @click="handleNewSession">新建对话</el-button>
      </div>
      <div class="session-list">
        <div
          v-for="s in sessionList"
          :key="s.sessionId"
          class="session-item"
          :class="{ active: s.sessionId === currentSessionId }"
          @click="handleSelectSession(s)"
        >
          <span class="session-title">{{ s.title || '新对话' }}</span>
          <span class="session-edit" @click.stop="handleRenameSession(s)">✎</span>
          <span class="session-del" @click.stop="handleDeleteSession(s)">×</span>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区 -->
    <div class="chat-main">
      <div class="chat-toolbar">
        <el-select
          v-model="selectedKbIds"
          multiple
          collapse-tags
          placeholder="检索范围（不选则全部公共库）"
          style="width: 340px"
          @change="onKbChange"
        >
          <el-option v-for="kb in kbOptions" :key="kb.kbId" :label="kb.kbName" :value="kb.kbId" />
        </el-select>
        <el-button v-if="streaming" type="danger" @click="handleStop">停止</el-button>
      </div>

      <div ref="msgRef" class="chat-messages">
        <div v-if="!messages.length" class="chat-empty">开始提问吧，例如：这个知识库讲了什么？</div>
        <div v-for="(m, i) in messages" :key="i" class="msg-row" :class="m.role">
          <div class="msg-col">
            <div class="msg-bubble">{{ m.content }}</div>
            <div v-if="m.sources && m.sources.length" class="msg-sources">
              <div class="sources-toggle" @click="toggleSources(i)">📄 来源（{{ m.sources.length }}）</div>
              <div v-if="m.showSources" class="sources-list">
                <div v-for="(s, si) in m.sources" :key="si" class="source-item">
                  <div class="source-title">{{ s.filename }}<span v-if="s.score !== undefined"> · 相关度 {{ s.score }}</span></div>
                  <div class="source-content">{{ s.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          placeholder="输入问题，Ctrl + Enter 发送"
          @keydown.ctrl.enter="sendMessage"
        />
        <el-button type="primary" :loading="streaming" @click="sendMessage">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { listSession, addSession, delSession, listRecord, updateSession } from '@/api/ai/session'
import { stopChat } from '@/api/ai/chat'
import { listKbByScope } from '@/api/ai/kb'
import { getToken } from '@/utils/auth'

const sessionList = ref([])
const currentSessionId = ref('')
const messages = ref([])
const inputText = ref('')
const streaming = ref(false)
const kbOptions = ref([])
const selectedKbIds = ref([])
const publicKbIds = ref([])
const sessionKbMap = ref({})
const msgRef = ref()

function getKbOptions() {
  Promise.all([listKbByScope('personal'), listKbByScope('public')]).then(([p, pub]) => {
    kbOptions.value = [...(p.data || []), ...(pub.data || [])]
    // 记录所有公共知识库 id（下拉框不预选，发送时未选库则默认用全部公共库）
    publicKbIds.value = (pub.data || []).map(kb => kb.kbId)
  }).catch(() => {})
}

function loadSessions() {
  listSession({ page_num: 1, page_size: 100 }).then(res => {
    sessionList.value = res.rows || []
    if (!sessionList.value.length) {
      handleNewSession()
    } else if (!currentSessionId.value) {
      handleSelectSession(sessionList.value[0])
    }
  }).catch(() => {})
}

function handleNewSession() {
  addSession({ title: '' }).then(res => {
    const data = res.data || {}
    loadSessions()
    currentSessionId.value = data.sessionId
    messages.value = []
    // 新建会话时清空知识库选择（不选 = 默认全部公共库），不继承上一个会话
    selectedKbIds.value = []
  })
}

function handleSelectSession(s) {
  currentSessionId.value = s.sessionId
  // 恢复该会话的知识库选择（没记录则留空，发送时默认全部公共库）
  selectedKbIds.value = sessionKbMap.value[s.sessionId]
    ? [...sessionKbMap.value[s.sessionId]]
    : []
  listRecord(s.sessionId).then(res => {
    messages.value = (res.data || []).map(r => ({ role: r.role, content: r.content }))
    scrollToBottom()
  }).catch(() => {})
}

// 用户手动改变知识库选择时，记录到当前会话
function onKbChange(val) {
  if (currentSessionId.value) {
    sessionKbMap.value[currentSessionId.value] = [...val]
  }
}

function handleDeleteSession(s) {
  ElMessageBox.confirm('确认删除该会话吗？', '提示', { type: 'warning' }).then(() => {
    return delSession(s.sessionId)
  }).then(() => {
    ElMessage.success('删除成功')
    if (s.sessionId === currentSessionId.value) {
      currentSessionId.value = ''
      messages.value = []
    }
    loadSessions()
  }).catch(() => {})
}

function handleRenameSession(s) {
  ElMessageBox.prompt('请输入新的对话名称', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: s.title || '新对话',
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空'
  }).then(({ value }) => {
    return updateSession({ sessionId: s.sessionId, title: value })
  }).then(() => {
    ElMessage.success('重命名成功')
    loadSessions()
  }).catch(() => {})
}

let abortController = null

async function sendMessage() {
  const content = inputText.value.trim()
  if (!content || streaming.value) return
  if (!currentSessionId.value) {
    ElMessage.warning('请先新建会话')
    return
  }

  messages.value.push({ role: 'user', content })
  inputText.value = ''
  messages.value.push({ role: 'assistant', content: '' })
  const aiIdx = messages.value.length - 1
  streaming.value = true
  abortController = new AbortController()
  scrollToBottom()

  // 始终走 RAG 检索；未选知识库时默认检索全部公共库
  const kbId = selectedKbIds.value.length > 0 ? selectedKbIds.value : publicKbIds.value
  const url = import.meta.env.VITE_APP_BASE_API + '/chat/rag-stream'
  const body = {
    sessionId: currentSessionId.value,
    content,
    kbId
  }

  let full = ''
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify(body),
      signal: abortController.signal
    })
    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop()
      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data:')) continue
          const json = line.slice(5).trim()
          if (!json) continue
          try {
            const data = JSON.parse(json)
            if (data.sources) {
              messages.value[aiIdx].sources = data.sources
            } else if (data.token) {
              full += data.token
              messages.value[aiIdx].content = full
              scrollToBottom()
            } else if (data.done) {
              // 流结束
            }
          } catch (e) { /* 忽略解析错误 */ }
        }
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError' && !messages.value[aiIdx].content) {
      messages.value[aiIdx].content = '（请求失败，请重试）'
    }
  } finally {
    streaming.value = false
    scrollToBottom()
  }
}

function handleStop() {
  if (!currentSessionId.value) return
  stopChat(currentSessionId.value).then(() => {
    ElMessage.info('已发送停止信号')
  })
  // 立即中止前端请求 + 重置发送状态（防止后端卡住时按钮一直「正在发送中」）
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  streaming.value = false
}

function toggleSources(i) {
  messages.value[i].showSources = !messages.value[i].showSources
}

function scrollToBottom() {
  nextTick(() => {
    if (msgRef.value) {
      msgRef.value.scrollTop = msgRef.value.scrollHeight
    }
  })
}

getKbOptions()
loadSessions()
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 130px);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}
.chat-sidebar {
  width: 240px;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.session-list {
  flex: 1;
  overflow-y: auto;
}
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.session-item:hover {
  background: var(--el-fill-color-light);
}
.session-item.active {
  background: var(--el-color-primary-light-9);
}
.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.session-del {
  color: #999;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
}
.session-del:hover {
  color: var(--el-color-danger);
}
.session-edit {
  color: #999;
  font-size: 14px;
  line-height: 1;
  padding: 0 4px;
}
.session-edit:hover {
  color: var(--el-color-primary);
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.chat-toolbar {
  padding: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 10px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-fill-color-lighter);
}
.chat-empty {
  text-align: center;
  color: #999;
  margin-top: 60px;
}
.msg-row {
  display: flex;
  margin-bottom: 16px;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.assistant {
  justify-content: flex-start;
}
.msg-col {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.msg-bubble {
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg-row.user .msg-bubble {
  background: var(--el-color-primary);
  color: #fff;
}
.msg-row.assistant .msg-bubble {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
}
.msg-sources {
  font-size: 12px;
}
.sources-toggle {
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
}
.sources-list {
  margin-top: 4px;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.source-item {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
}
.source-title {
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}
.source-content {
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
}
.chat-input {
  padding: 10px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.chat-input .el-textarea {
  flex: 1;
}
</style>
