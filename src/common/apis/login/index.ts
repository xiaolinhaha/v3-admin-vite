import { request } from "@/http/axios"

/** 获取验证码 */
export function getVerifyCodeApi() {
  return request<any>({
    url: "/iopApiAdmin/nebula/sys/getVerifyCode",
    method: "get",
    baseURL: "", // 覆盖全局 baseURL，确保匹配到 /iopApiAdmin 代理
    headers: {
      visitSrc: "web"
    }
  })
}

/** 登录 */
export function loginApi(data: any) {
  return request<any>({
    url: "/iopApiAdmin/nebula/sys/login",
    method: "post",
    data,
    baseURL: "" // 覆盖全局 baseURL
  })
}

/** 微信登录 */
export function logwxApi(data: any) {
  return request<any>({
    url: "/iopApiAdmin/nebula/sys/logwx",
    method: "post",
    data,
    baseURL: "" // 覆盖全局 baseURL
  })
}

/** 获取短信验证码 */
export function getMessageCodeApi(data: any) {
  return request<any>({
    url: "/iopApiAdmin/nebula/sys/getMessageCode",
    method: "post",
    data,
    baseURL: "" // 覆盖全局 baseURL
  })
}
