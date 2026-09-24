import request from '@/utils/request'

// 会话列表（分页）
export function listSession(query) {
  return request({
    url: '/session/list',
    method: 'get',
    params: query
  })
}

// 新建会话
export function addSession(data) {
  return request({
    url: '/session/add',
    method: 'post',
    data: data
  })
}

// 删除会话
export function delSession(sessionId) {
  return request({
    url: '/session/delete',
    method: 'delete',
    params: { session_id: sessionId }
  })
}

// 会话记录列表
export function listRecord(sessionId) {
  return request({
    url: '/session/record/list',
    method: 'get',
    params: { session_id: sessionId }
  })
}
