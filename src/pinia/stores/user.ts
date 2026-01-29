import { getCurrentUserApi } from "@@/apis/users"
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

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }

  // 获取用户详情
  const getInfo = async () => {
    // 兼容逻辑：如果 sessionStorage 中有用户信息，直接使用，不再调用接口
    const userInfoStr = sessionStorage.getItem("userInfo")
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        username.value = userInfo.username || sessionStorage.getItem("userName") || "admin"
        // 确保 roles 存在，否则给默认值
        roles.value = routerConfig.defaultRoles
        return
      } catch (e) {
        console.error("解析用户信息失败", e)
      }
    }
    // 原有逻辑保留作为兜底，但在当前迁移场景下可能不会走到这里，或者应该注释掉
    // const { data } = await getCurrentUserApi()
    // username.value = data.username
    // roles.value = data.roles?.length > 0 ? data.roles : routerConfig.defaultRoles

    // 强制给一个默认角色，避免无限循环
    username.value = sessionStorage.getItem("userName") || "admin"
    roles.value = routerConfig.defaultRoles
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

  return { token, roles, username, setToken, getInfo, changeRoles, logout, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
