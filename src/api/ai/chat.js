import request from '@/utils/request'

// 停止当前会话正在生成的回复
export function stopChat(sessionId) {
  return request({
    url: '/chat/stop',
    method: 'post',
    data: { sessionId }
  })
}
