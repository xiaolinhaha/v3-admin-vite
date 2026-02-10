import { request } from "@/http/axios"

// 获取业务类型
export function fetchBizTypes() {
  return request<any>({
    url: '/iopApiAdmin/ieport/platformConfig/searchSmartWorkplace',
    method: 'get',
    baseURL: ""
  })
}

// 获取最大并发量
export function getStopTaskMaxNum(params: { bizType: string; seatId?: string }) {
  return request<any>({
    url: '/iopApiAdmin/record/seats/init',
    method: 'get',
    params,
    baseURL: ""
  })
}

// 获取标签/语音克隆列表
export function getVoiceList() {
  return request<any>({
    url: '/iopApiAdmin/ieport/clone/queryCloneVoice',
    method: 'post',
    baseURL: ""
  })
}

// 获取汇总数据
export function fetchSummary(params: { bizType: string; seatId?: string }) {
  return request<any>({
    url: '/iopApiAdmin/ieport/liveData/seats/metrics',
    method: 'get',
    params,
    baseURL: ""
  })
}

// 关闭SSE
export function closeSse(bizType: string, seatId: string, headers: { Authentication: string; appId: string }) {
  return request<any>({
    url: `/iopApiAdmin/record/sse/close/${bizType}/${seatId}`,
    method: 'get',
    headers,
    baseURL: ""
  })
}

// 修改并发量
export function updateUserLineNum(params: { lineNum: number; bizType: string; seatId?: string }, headers?: any) {
  return request<any>({
    url: '/iopApiAdmin/nebula/sys/agent/updateUserLineNum',
    method: 'get',
    params,
    headers,
    baseURL: ""
  })
}

// 监听
export function listenSeat(data: any, headers: { Authentication: string; appId: string }) {
  return request<any>({
    url: '/iopApiAdmin/record/seats/listen',
    method: 'post',
    data,
    headers,
    baseURL: ""
  })
}

// 接管
export function referSeat(data: any, headers: { Authentication: string; Authorization: string; appId: string }) {
  return request<any>({
    url: '/iopApiAdmin/record/seats/refer',
    method: 'post',
    data,
    headers,
    baseURL: ""
  })
}

// 回调/挂断记录
export function callbackSeat(data: any) {
  return request<any>({
    url: '/iopApiAdmin/record/seats/callback',
    method: 'post',
    data,
    baseURL: ""
  })
}

// 获取当前用户Agent信息
export function getCurrentUserAgent(bizType: string) {
  return request<any>({
    url: `/iopApiAdmin/nebula/sys/agent/getCurrentUserAgent?bizType=${bizType}`,
    method: 'post',
    timeout: 50000,
    baseURL: ""
  })
}

// 退出登录
export function outLogin(jwt: string) {
  return request<any>({
    url: `/iopApiAdmin/nebula/openApi/outLogin?jwt=${jwt}`,
    method: 'post',
    baseURL: ""
  })
}

// 获取SSE Token
export function getSseToken(seatId: string, headers: { Authentication: string; appId: string; token: string; reconnectInterval: string; Authorization?: string }) {
  return request<any>({
    url: `/iopApiAdmin/record/sse/getToken/${seatId}`,
    method: 'get',
    headers: {
      ...headers,
      reconnectInterval: 'false'
    },
    baseURL: ""
  })
}

// 获取标签列表
export function getLabels(data: any, headers?: any) {
  return request<any>({
    url: '/iopApiAdmin/ieport/label/getLabels',
    method: 'post',
    data,
    headers,
    baseURL: ""
  })
}

// 更新标签
export function updateLabel(data: any, headers: { Authentication: string; appId: string }) {
  return request<any>({
    url: '/iopApiAdmin/record/seats/updateLabel',
    method: 'post',
    data,
    headers,
    baseURL: ""
  })
}
