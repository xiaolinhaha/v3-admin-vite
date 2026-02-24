import { request } from "@/http/axios"

/** Menu Interface */
export interface MenuData {
  id?: string | number
  menuName: string
  parentMenuId?: string | number
  menuLevel?: string | number
  menuIcon?: string
  isVisible?: string | number
  menuPath?: string
  routerName?: string
  menuIndex?: number
  menuPermission?: string
  moduleName?: string
  children?: MenuData[]
  new?: boolean
  [key: string]: any
}

/** Permission Mark Interface */
export interface PermissionMarkData {
  id?: string | number
  markCode: string
  markName: string
  menuId: string | number
}

/** API Definitions */
export const menuApi = {
  /** Get All Menus */
  getAllMenu: (params: any = {}) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/menu/getAllMenu",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Get Permission Marks for a Menu */
  getPermissionMark: (params: { menuId: string | number }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/permissionMark/getPermissionMark",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Add Menu */
  addMenu: (data: MenuData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/menu/addMenu",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Update Menu */
  updateMenu: (data: MenuData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/menu/updateMenu",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Delete Menu */
  deleteMenu: (params: { id: string | number }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/menu/deleteMenu",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Save Permission Marks */
  savePermissionMark: (data: PermissionMarkData[]) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/permissionMark/savePermissionMark",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Delete Permission Mark */
  deletePermissionMark: (params: { id: string | number }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/permissionMark/deletePermissionMark",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Update Drag Menu (Sorting/Hierarchy) */
  updateDragMenu: (data: MenuData[]) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/menu/updateDragMenu",
      method: "post",
      data,
      baseURL: ""
    })
  }
}
