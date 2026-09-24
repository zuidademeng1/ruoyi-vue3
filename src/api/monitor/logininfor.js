import request from '@/utils/request'

// 查询登录日志列表
export function list(query) {
  return request({
    url: '/system/loginlog/list',
    method: 'get',
    params: query
  })
}

// 删除登录日志
export function delLogininfor(infoId) {
  return request({
    url: '/system/loginlog/delete/' + infoId,
    method: 'delete'
  })
}

// 解锁用户登录状态（后端暂未实现账号锁定/解锁，调用会 404）
export function unlockLogininfor(userName) {
  return request({
    url: '/system/loginlog/unlock/' + userName,
    method: 'get'
  })
}

// 清空登录日志
export function cleanLogininfor() {
  return request({
    url: '/system/loginlog/clear',
    method: 'delete'
  })
}
