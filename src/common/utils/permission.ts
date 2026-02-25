import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"
import { router } from "@/router"

/** 全局权限判断函数，和权限指令 v-permission 功能类似 */
export function checkPermission(value: string[] | string): boolean {
  if (isArray(value) && value.length > 0) {
    const { roles } = useUserStore()
    return roles.some(role => value.includes(role))
  } else if (typeof value === 'string') {
    // 检查 permissionMark
    const currentRoute = router.currentRoute.value
    const permissionMarks = currentRoute.meta?.permissionMarks as any[]
    if (permissionMarks && permissionMarks.length > 0) {
      return permissionMarks.some(mark => mark.markCode === value)
    }
    return false
  } else {
    console.error("参数必须是一个数组且长度大于 0，或者是一个字符串权限标识")
    return false
  }
}
