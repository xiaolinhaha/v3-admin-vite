import type { RouteRecordRaw } from "vue-router"
import { pinia } from "@/pinia"
import { constantRoutes, dynamicRoutes } from "@/router"
import { routerConfig } from "@/router/config"
import { flatMultiLevelRoutes } from "@/router/helper"
import { h, resolveComponent } from "vue"

const Layouts = () => import("@/layouts/index.vue")
// 匹配所有 views 下的 .vue 文件
const modules = import.meta.glob("@/pages/**/*.vue")

function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.roles
  return routeRoles ? roles.some(role => routeRoles.includes(role)) : true
}

function filterDynamicRoutes(routes: RouteRecordRaw[], roles: string[]) {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tempRoute = { ...route }
    if (hasPermission(roles, tempRoute)) {
      if (tempRoute.children) {
        tempRoute.children = filterDynamicRoutes(tempRoute.children, roles)
      }
      res.push(tempRoute)
    }
  })
  return res
}

// 提取所有页面路由（叶子节点）
function extractPageRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []
  routes.forEach(route => {
    // 如果是页面（有组件且没有子路由，或者子路由被忽略），或者是特殊的页面
    // 这里的判断标准是：有 component 且 component 不是 Layouts（或者是函数组件但不是 Layout）
    // 为了简单起见，我们假设所有有 component 的非 Layout 节点都是页面
    
    // 如果有 children，递归提取
    if (route.children && route.children.length > 0) {
      res.push(...extractPageRoutes(route.children))
    }
    
    // 如果是页面，添加到结果中
    // 注意：如果是目录（Component 为 undefined 或 Layout），则不添加
    // 我们在 transformMenuToRoutes 里把目录的 component 设为了 Layouts 或 RouterView
    // 这里我们需要识别出真正的页面
    // 真正的页面 component 是 import(...)
    
    // 简单判断：如果 path 是绝对路径，且没有 children（或者是叶子节点），则认为是页面
    if (route.path.startsWith('/') && (!route.children || route.children.length === 0)) {
        res.push(route)
    }
  })
  return res
}

// 转换菜单数据为路由
function transformMenuToRoutes(menus: any[], isRoot = true): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []
  menus.forEach(menu => {
    // 1. 优先尝试从 dynamicRoutes 中查找匹配的静态配置
    // 我们假设 dynamicRoutes 已经包含了所有可能的路由结构
    // 查找策略：
    // - 匹配 path
    // - 匹配 name
    
    let matchedRoute: RouteRecordRaw | undefined
    
    // 递归查找 helper
    const findRoute = (routes: RouteRecordRaw[], path: string, name?: string): RouteRecordRaw | undefined => {
        for (const r of routes) {
            // 简单匹配：绝对路径匹配，或者 name 匹配
            // 注意：dynamicRoutes 中的 path 可能是相对路径，这里简化处理，假设 dynamicRoutes 结构已知
            // 实际上，dynamicRoutes 定义的是 /sys/userList 这种结构
            // 而 menu.menuPath 也是 /sys/userList
            
            // 如果 r.path 是绝对路径，直接比较
            if (r.path === path) return r
            // 如果 name 匹配
            if (name && r.name === name) return r
            
            // 如果是相对路径，需要结合父级路径判断（这里比较复杂，暂时只支持顶层或已知结构的匹配）
            // 或者我们可以扁平化 dynamicRoutes 进行查找
            
            if (r.children) {
                const found = findRoute(r.children, path, name)
                if (found) return found
            }
        }
        return undefined
    }

    // 尝试在 dynamicRoutes 中查找
    // 注意：dynamicRoutes 定义的是 /sys -> children: userList
    // menuPath 是 /sys/userList
    // 我们需要一种更智能的匹配方式，或者简单点：
    // 如果 menuPath 对应到了 dynamicRoutes 中的某个叶子节点，就复用那个节点的 component 和 meta
    
    // 扁平化查找 dynamicRoutes 中的所有节点
    const findAllRoutes = (routes: RouteRecordRaw[], prefix = ''): { route: RouteRecordRaw, fullPath: string }[] => {
        let result: { route: RouteRecordRaw, fullPath: string }[] = []
        routes.forEach(r => {
            const currentPath = r.path.startsWith('/') ? r.path : `${prefix}/${r.path}`.replace(/\/+/g, '/')
            result.push({ route: r, fullPath: currentPath })
            if (r.children) {
                result = result.concat(findAllRoutes(r.children, currentPath))
            }
        })
        return result
    }
    
    const allDynamicRoutes = findAllRoutes(dynamicRoutes)
    const found = allDynamicRoutes.find(item => item.fullPath === menu.menuPath || item.route.name === menu.routerName)
    
    matchedRoute = found?.route

    // 如果 routerName 为空，使用 menuPath 生成一个
    const name = menu.routerName || menu.menuPath.replace(/\//g, '_')

    const route: any = {
      path: menu.menuPath,
      name: name, // 确保 routerName 唯一且存在
      meta: {
        title: menu.menuName,
        svgIcon: menu.menuIcon, // 假设 menuIcon 是 svg 图标名
        hidden: menu.isVisible === '0',
        permissionMarks: menu.permissionMarks // 保存权限标识
      }
      // 注意：不要初始化 children: []，否则 SidebarItem 会误判为目录
    }
    
    // 如果找到了静态配置，合并配置（主要是 component）
    if (matchedRoute) {
        console.log(`Matched static route for ${menu.menuPath}:`, matchedRoute)
        if (matchedRoute.component) {
            route.component = matchedRoute.component
        }
        // 可以选择合并 meta，或者以接口返回为准
        // route.meta = { ...matchedRoute.meta, ...route.meta }
    }

    // 处理组件映射 (如果静态路由没找到 component，再尝试自动匹配)
    if (!route.component) {
        if (menu.children && menu.children.length > 0) {
          // 只有当 children 确实有内容时，才添加 children 属性
          
          if (isRoot) {
            route.component = Layouts
          } else {
            route.component = { render: () => h(resolveComponent('router-view')) }
          }
          // 递归处理子路由
          route.children = transformMenuToRoutes(menu.children, false)
          
          // 如果没有重定向，默认重定向到第一个子路由
          if (!route.redirect && route.children.length > 0) {
            route.redirect = route.children[0].path
          }
        } else {
          // 叶子节点，匹配组件
          // 尝试匹配路径
          let componentPath = ""
          // 去除开头的 /
          const path = menu.menuPath.startsWith('/') ? menu.menuPath.slice(1) : menu.menuPath
          
          // 策略1: 直接匹配 src/pages/${path}/index.vue
          const tryPath1 = `/src/pages/${path}/index.vue`
          // 策略2: 匹配 src/pages/${path}.vue
          const tryPath2 = `/src/pages/${path}.vue`
          // 策略3: 匹配 src/pages/${routerName}/index.vue
          const tryPath3 = `/src/pages/${menu.routerName}/index.vue`

          console.log(`Matching component for ${menu.menuPath}:`, tryPath1, tryPath2, tryPath3)

          if (modules[tryPath1]) {
            route.component = modules[tryPath1]
          } else if (modules[tryPath2]) {
            route.component = modules[tryPath2]
          } else if (modules[tryPath3]) {
            route.component = modules[tryPath3]
          } else {
            console.warn(`Component not found for menu: ${menu.menuName} (${menu.menuPath})`)
            route.component = () => import("@/pages/error/404.vue")
          }
          
          // 如果是根节点的叶子（即一级菜单直接是页面），需要包裹 Layout
          if (isRoot) {
             const rootRoute: RouteRecordRaw = {
                 path: '/',
                 component: Layouts,
                 meta: { hidden: menu.isVisible === '0' },
                 children: [route]
             }
             res.push(rootRoute)
             return // 跳过 push route，因为已经 push 了 rootRoute
          }
        }
    } else {
        // 如果使用了静态路由的 component，但仍然有 children，需要递归处理
        if (menu.children && menu.children.length > 0) {
             route.children = transformMenuToRoutes(menu.children, false)
             if (!route.redirect && route.children.length > 0) {
                route.redirect = route.children[0].path
             }
        }
    }
    
    res.push(route)
  })
  return res
}


export const usePermissionStore = defineStore("permission", () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由）
  const setRoutes = (roles: string[]) => {
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes, roles)
    set(accessedRoutes)
  }

  // 根据菜单数据生成路由
  const generateRoutes = (menus: any[]) => {
    const menuRoutes = transformMenuToRoutes(menus)
    const flatPageRoutes = extractPageRoutes(menuRoutes)
    
    routes.value = constantRoutes.concat(menuRoutes)
    // 对于菜单模式，addRoutes 保存的是扁平化的页面路由，用于添加到 Layout 下
    addRoutes.value = flatPageRoutes
  }

  // 所有路由 = 所有常驻路由 + 所有动态路由
  const setAllRoutes = () => {
    set(dynamicRoutes)
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, addRoutes, setRoutes, setAllRoutes, generateRoutes }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
