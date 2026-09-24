import router from '@/router'
import cache from '@/plugins/cache'
import { ElMessageBox, } from 'element-plus'
import { login, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isHttp, isEmpty } from "@/utils/validate"
import useLockStore from '@/store/modules/lock'
import defAva from '@/assets/images/profile.jpg'

const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: getToken(),
      id: '',
      name: '',
      nickName: '',
      avatar: '',
      roles: [],
      permissions: []
    }),
    actions: {
      // 登录
      login(userInfo) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise((resolve, reject) => {
          login(username, password, code, uuid).then(res => {
            setToken(res.data.token)
            this.token = res.data.token
            useLockStore().unlockScreen()
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then(res => {
            const data = res.data || {}
            let avatar = data.avatar || ""
            if (!isHttp(avatar)) {
              avatar = (isEmpty(avatar)) ? defAva : import.meta.env.VITE_APP_BASE_API + avatar
            }
            if (data.roles && data.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = data.roles
              this.permissions = data.permissions || []
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.id = data.userId
            this.name = data.userName
            this.nickName = data.nickName
            this.avatar = avatar
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 退出系统
      logOut() {
        this.token = ''
        this.roles = []
        this.permissions = []
        removeToken()
        return Promise.resolve()
      }
    }
  })

export default useUserStore
