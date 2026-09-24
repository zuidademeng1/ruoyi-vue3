import request from '@/utils/request'

// 按范围查询知识库列表（非分页，用于下拉选择）
export function listKbByScope(scope) {
  return request({
    url: '/knowledgeBase/scope',
    method: 'get',
    params: { scope }
  })
}

// 查询个人知识库列表（分页）
export function listPersonalKb(query) {
  return request({
    url: '/knowledgeBase/personal',
    method: 'get',
    params: query
  })
}

// 查询公共知识库列表（分页）
export function listPublicKb(query) {
  return request({
    url: '/knowledgeBase/public',
    method: 'get',
    params: query
  })
}

// 新增知识库
export function addKb(data) {
  return request({
    url: '/knowledgeBase/add',
    method: 'post',
    data: data
  })
}

// 删除知识库
export function delKb(kbId) {
  return request({
    url: '/knowledgeBase/' + kbId,
    method: 'delete'
  })
}

// 批量删除知识库
export function batchDelKb(kbIds) {
  return request({
    url: '/knowledgeBase/batch-delete',
    method: 'post',
    data: { kb_ids: kbIds }
  })
}
