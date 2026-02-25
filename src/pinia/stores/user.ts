import { userApi } from "@@/apis/system/user"
import { setToken as _setToken, getToken, removeToken } from "@@/utils/local-storage"
import { pinia } from "@/pinia"
import { resetRouter } from "@/router"
import { routerConfig } from "@/router/config"
import { useSettingsStore } from "./settings"
import { useTagsViewStore } from "./tags-view"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")
  const roles = ref<string[]>([])
  const username = ref<string>("")
  const menuList = ref<any[]>([])
  
  const tagsViewStore = useTagsViewStore()
  const settingsStore = useSettingsStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }

  // 获取用户详情
  const getInfo = async () => {
    // 兼容逻辑：如果 sessionStorage 中有用户信息，直接使用
    const userInfoStr = sessionStorage.getItem("userInfo")
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        username.value = userInfo.username || sessionStorage.getItem("userName") || "admin"
        // 确保 roles 存在，否则给默认值
        roles.value = routerConfig.defaultRoles
      } catch (e) {
        console.error("解析用户信息失败", e)
      }
    } else {
        username.value = sessionStorage.getItem("userName") || "admin"
        roles.value = routerConfig.defaultRoles
    }

    try {
        // 调用接口获取菜单
        // TODO: userName 应该从登录信息中获取，这里暂时使用 sessionStorage 或默认值
        const currentUserName = sessionStorage.getItem("userName")
        const res: any = await userApi.getUserInfo({ userName: currentUserName })
        console.log("menuList", res)
        if (res && res.content) {
            menuList.value = res.content
        }
    } catch (error) {
        console.error("获取用户菜单失败", error)
    }
  }

  // 模拟角色变化
  const changeRoles = (role: string) => {
    const newToken = `token-${role}`
    token.value = newToken
    _setToken(newToken)
    // 用刷新页面代替重新登录
    location.reload()
  }

  // 登出
  const logout = () => {
    removeToken()
    token.value = ""
    roles.value = []
    resetRouter()
    resetTagsView()
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
  }

  // 重置 Visited Views 和 Cached Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, username, menuList, setToken, getInfo, changeRoles, logout, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
