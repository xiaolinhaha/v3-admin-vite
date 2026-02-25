import type { App, Directive } from "vue"
import { checkPermission } from "@@/utils/permission"

/**
 * @name 权限指令
 * @description 和权限判断函数 checkPermission 功能类似
 */
const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding
    if (value) {
      const hasPermission = checkPermission(value)
      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`需要提供权限标识！参考：v-permission="['admin', 'editor']" 或 v-permission="'fileUpload:upload'"`)
    }
  }
}

export function installPermissionDirective(app: App) {
  app.directive("permission", permission)
}
