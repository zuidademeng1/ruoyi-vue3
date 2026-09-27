import request from '@/utils/request'

// 查询文档列表（分页）
export function listDoc(query) {
  return request({
    url: '/doc/list',
    method: 'get',
    params: query
  })
}

// 查询公共知识库的文档列表（学生浏览）
export function listPublicDoc(query) {
  return request({
    url: '/doc/public',
    method: 'get',
    params: query
  })
}

// 解析文档（推入后台队列）
export function parseDoc(docId) {
  return request({
    url: '/doc/parse',
    method: 'post',
    data: { docId }
  })
}

// 删除文档
export function delDoc(docId) {
  return request({
    url: '/doc/' + docId,
    method: 'delete'
  })
}
