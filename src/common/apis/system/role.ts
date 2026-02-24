import { request } from "@/http/axios"

/** Role Interface */
export interface RoleData {
  id?: string | number
  roleName: string
  roleDesc: string
  dataScope: string
  [key: string]: any
}

/** Role Query Interface */
export interface RoleQuery {
  roleName?: string
  roleDesc?: string
  pageNum?: number
  pageSize?: number
  [key: string]: any
}

/** Role Permission Interface */
export interface RolePermissionData {
  roleId: string | number
  roleMenu: Record<string, any[]>
}

/** API Definitions */
export const roleApi = {
  /** Get Role List (Page) */
  getRoleList: (data: RoleQuery) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/role/getRoleList",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Get All Roles */
  getRoleAll: () => {
    return request({
      url: "/iopApiAdmin/nebula/sys/role/getRoleAll",
      method: "post",
      baseURL: ""
    })
  },

  /** Add Role */
  addRole: (data: RoleData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/role/addRole",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Update Role */
  updateRole: (data: RoleData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/role/updateRole",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Delete Role */
  deleteRole: (params: { id: string | number }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/role/deleteRole",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Get Role Permissions */
  getRolePermission: (params: { roleId: string | number }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/roleMenu/getRolePermission",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Save Role Permissions */
  saveRoleMenu: (data: RolePermissionData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/roleMenu/saveRoleMenu",
      method: "post",
      data,
      baseURL: ""
    })
  }
}
