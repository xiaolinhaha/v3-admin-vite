import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import { getToken } from "@@/utils/local-storage"
import * as NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"
import { isWhiteList } from "@/router/whitelist"
import type { RouteRecordRaw } from "vue-router"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // 优先检查 URL 是否携带 token（针对新窗口打开的情况）
    const queryToken = to.query.token as string
    const querySeatId = to.query.seatId as string
    
    if (queryToken) {
      console.log('Detected token in URL:', queryToken)
      userStore.setToken(queryToken)
      if (querySeatId) {
        sessionStorage.setItem('userName', querySeatId)
      }
    }

    // 如果没有登录
    if (!getToken()) {
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }
    // 如果已经登录，并准备进入 Login 页面，则重定向到主页
    if (to.path === LOGIN_PATH) return "/"
    // 如果用户已经获得其权限角色
    if (userStore.roles.length !== 0) return true
    // 否则要重新获取权限角色
    try {
      await userStore.getInfo()
      // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
      const roles = userStore.roles
      // 生成可访问的 Routes
      if (userStore.menuList && userStore.menuList.length > 0) {
        console.log("Generating routes from menuList", userStore.menuList)
        permissionStore.generateRoutes(userStore.menuList)
      } else {
        console.log("Generating routes from roles", roles)
        routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
      }
      // 将 "有访问权限的动态路由" 添加到 Router 中
      permissionStore.addRoutes.forEach(route => {
        console.log("Adding route:", route)
        if (userStore.menuList && userStore.menuList.length > 0) {
            // 如果是菜单模式，所有动态路由都作为 Layout 的子路由添加
            // 这样无论 path 是绝对路径还是相对路径，都能被 Layout 捕获（作为子路由渲染）
            router.addRoute('Layout', route as RouteRecordRaw)
        } else {
            router.addRoute(route as RouteRecordRaw)
        }
      })
      // 设置 replace: true, 因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch (error) {
      // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
      userStore.resetToken()
      ElMessage.error((error as Error).message || "路由守卫发生错误")
      return LOGIN_PATH
    }
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
