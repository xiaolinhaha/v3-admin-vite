import { request } from "@/http/axios"

/** User Interface */
export interface UserData {
  id?: string
  userName: string
  userNickname: string
  deptId: string
  orgCode?: string
  mobile?: string
  email?: string
  status?: string
  createTime?: string
  roleIds?: string[]
}

/** User Query Parameters */
export interface UserQuery {
  userName?: string
  userNickname?: string
  deptId?: string
  orgCode?: string
  pageNum: number
  pageSize: number
}

/** API Definitions */
export const userApi = {
  /** Query User List */
  userList: (data: UserQuery) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/userList",
      method: "post",
      data,
      baseURL: ""
    })
  },
  
  /** Add User */
  addUser: (data: UserData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/addUser",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Update User */
  updateUser: (data: UserData) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/updateUser",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Delete User */
  removeUserById: (params: { userId: string }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/removeUserById",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Reset Password */
  resetPwd: (params: { userId: string }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/resetPwd",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Lock User */
  lockUser: (params: { userId: string }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/lockUser",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Unlock User */
  unlockUser: (params: { userId: string }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/unlockUser",
      method: "get",
      params,
      baseURL: ""
    })
  },

  /** Query Login Records */
  queryLoginRecord: (data: any) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/queryLoginRecord",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Get Role List */
  getRoleList: (data: any) => {
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

  /** Set User Role */
  setUserRole: (data: { userId: string, roleIds: string }) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/userRole/setUserRole",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** Allow Access */
  allowAccess: (data: any) => {
    return request({
      url: "/iopApiAdmin/nebula/sys/user/allowAccess",
      method: "post",
      data,
      baseURL: ""
    })
  },

  /** List Organizations (Departments) */
  listOrg: () => {
    return request({
      url: "/iopApiAdmin/nebula/sys/orgManager/listOrg",
      method: "get",
      baseURL: ""
    })
  }
}
