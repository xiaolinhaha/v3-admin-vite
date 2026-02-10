import { reactive, ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { callbackSeat } from '@@/apis/intelligent-customer-inner'

// --- Interfaces ---

interface OwlInfo {
  domain: string
  loginKey: string
  token: string
  stationId: string // 分机号
  agentNo: string // 坐席号
  citAddr: string // owl地址
  webRtcLoginToken: string // wrtctoken
  orgCode: string // 银行号
  suborgCode: string // 子机构
  prefix: string // 分机号
  ctiAddr: string // owl链接地址
  iceServerAddr: string // iceurl
  sipUrl: string // sip地址
  clientAddr: string // cti地址
}

interface CallInfo {
  jlsCallId: string // 基立讯电话id
  id: string // 客户信息
  callStatus: string
  hangupStatus: number // 是否点击挂断，默认为0，1是否触发挂断
  info: any // 拨打电话信息
  webRtcType: boolean // 是否接通
  isCallIn: boolean // 是否接管
  isListen: boolean // 是否监听
  showIcon: boolean // 是否登录成功
  clearList: boolean
  isHandCall: boolean // 是否手动拨打
  callBackId: string // 回拨的工单id
  logouts: boolean
  hangOutAllStatus: number
  changID: string
  hangUpNoWebRtc: number
  handleRtcMuteAudio: number
  handleRtcUnmuteAudio: number
}

// --- Global State (to mimic Vue.observable behavior from Vue 2) ---
// In a real app, Pinia is recommended, but for a direct refactor preserving structure:
const globalOwlInfo = reactive<OwlInfo>({
  domain: '',
  loginKey: '',
  token: '',
  stationId: '',
  agentNo: '',
  citAddr: '',
  webRtcLoginToken: '',
  orgCode: '',
  suborgCode: '',
  prefix: '',
  ctiAddr: '',
  iceServerAddr: '',
  sipUrl: '',
  clientAddr: '',
})

const globalCallInfo = reactive<CallInfo>({
  jlsCallId: '',
  id: '',
  callStatus: '正在通话中',
  hangupStatus: 0,
  info: null,
  webRtcType: false,
  isCallIn: false,
  isListen: false,
  showIcon: false,
  clearList: false,
  isHandCall: false,
  callBackId: '',
  logouts: false,
  hangOutAllStatus: 0.2,
  changID: '',
  hangUpNoWebRtc: 0.1,
  handleRtcMuteAudio: 0.1,
  handleRtcUnmuteAudio: 0.1,
})

// Local state for socket and heartbeat (lifted to module scope for singleton behavior)
const socket = ref<WebSocket | null>(null)
const heartbeatInterval = ref<any>(null)
const isLogined = ref(false)
const loginStatus = ref(true)
const userWebrtc = ref('N')
const callid = ref('')
const startTime = ref('')
const pickupTime = ref('')
const workMode = ref('AutoIn') // Default workMode
const wsStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

// --- Mutations ---
export const mutations = {
  init(val: any) {
    globalOwlInfo.domain = val.domain
    globalOwlInfo.loginKey = val.loginKey
    globalOwlInfo.token = val.token
    globalOwlInfo.stationId = val.extNo
    globalOwlInfo.agentNo = val.agentNo
    globalOwlInfo.citAddr = val.citAddr
    globalOwlInfo.webRtcLoginToken = val.webRtcLoginToken
    globalOwlInfo.orgCode = val.orgCode
    globalOwlInfo.suborgCode = val.suborgCode
    globalOwlInfo.prefix = val.prefix
    globalOwlInfo.ctiAddr = val.ctiAddr
    globalOwlInfo.iceServerAddr = val.iceServerAddr
    globalOwlInfo.sipUrl = val.sipUrl
    globalOwlInfo.clientAddr = val.clientAddr
  },
  setId(id: string) { globalCallInfo.id = id },
  setJlxCallId(id: string) { globalCallInfo.jlsCallId = id },
  setCallStatus(status: string) { globalCallInfo.callStatus = status },
  setWebRtcType(val: boolean) { globalCallInfo.webRtcType = val },
  setIsCallIn(val: boolean) { globalCallInfo.isCallIn = val },
  setIsListen(val: boolean) { globalCallInfo.isListen = val },
  setHangUp(val: number) { globalCallInfo.hangupStatus = val },
  makecall(val: any) { globalCallInfo.info = val },
  setShowIcon(val: boolean) { globalCallInfo.showIcon = val },
  clearL(val: boolean) { globalCallInfo.clearList = val },
  setHandCall(val: boolean) { globalCallInfo.isHandCall = val },
  setCallBackId(val: string) { globalCallInfo.callBackId = val },
  logout(val: boolean) { globalCallInfo.logouts = val },
  setHangOutAllStatus(val: number) { globalCallInfo.hangOutAllStatus = val },
  setChangID(val: string) { globalCallInfo.changID = val },
  setHangUpNoWebRtc(val: number) { globalCallInfo.hangUpNoWebRtc = val },
  setHandleRtcMuteAudio(val: number) { globalCallInfo.handleRtcMuteAudio = val },
  setHandleRtcUnmuteAudio(val: number) { globalCallInfo.handleRtcUnmuteAudio = val },
}

// --- Hooks ---

export function useOwl(emit?: (event: string, ...args: any[]) => void) {
  // --- Actions / Methods ---

  const sendMsg = (message: string) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(message)
    }
  }

  const _makeCall = (_callNum: string) => {
    console.log('电话号码', _callNum)
    const req = {
      callee: _callNum,
      caller: globalOwlInfo.stationId,
      domain: globalOwlInfo.domain,
      extNo: globalOwlInfo.stationId,
      prefix: globalOwlInfo.prefix,
      agentNo: globalOwlInfo.agentNo,
      encryptFlag: '1',
      uui: '',
      type: '2',
    }
    sendMsg(JSON.stringify(req))
  }

  const _answerCall = () => {
    if (!callid.value) {
      ElMessage.error('暂无呼叫！')
      return
    }
    const req = {
      uuid: callid.value,
      device: globalOwlInfo.stationId,
      agentNo: globalOwlInfo.agentNo,
      extNo: globalOwlInfo.stationId,
      domain: globalOwlInfo.domain,
      type: '6',
    }
    sendMsg(JSON.stringify(req))
  }

  const _setAgentStateS = (
    domain: string,
    stationId: string,
    agentNo: string,
    reasoncode: number,
    agentState: string,
    acdId: string,
    wMode: string
  ) => {
    const setReq = {
      stationId,
      agentId: agentNo,
      extNo: stationId,
      acdId,
      domain,
      agentState,
      reasonCode: reasoncode,
      workMode: wMode,
      type: '17',
    }
    sendMsg(JSON.stringify(setReq))
  }

  const _hangupCall = () => {
    console.log("useNowebRtc --->>>", globalCallInfo.isHandCall, callid.value, globalCallInfo.jlsCallId)
    const req = {
      uuid: callid.value,
      extNo: globalOwlInfo.stationId,
      agentNo: globalOwlInfo.agentNo,
      domain: globalOwlInfo.domain,
      type: '5',
    }
    sendMsg(JSON.stringify(req))
  }

  const _agentLogin = (
    domain: string,
    stationId: string,
    agentNo: string,
    agentPwd: string,
    reasoncode: number,
    agentState: string,
    acdId: string,
    wMode: string
  ) => {
    const setReq = {
      stationId,
      extNo: stationId,
      agentId: agentNo,
      agentPwd,
      acdId,
      domain,
      agentState,
      reasonCode: reasoncode,
      workMode: wMode,
      type: '1',
    }
    sendMsg(JSON.stringify(setReq))
  }

  const _setAgentLoginOut = (
    domain: string,
    stationId: string,
    agentNo: string,
    reasoncode: number,
    agentState: string,
    acdId: string,
    wMode: string
  ) => {
    const setReq = {
      stationId,
      agentId: agentNo,
      extNo: stationId,
      acdId,
      domain,
      agentState,
      reasonCode: reasoncode,
      workMode: wMode,
      type: '16',
    }
    sendMsg(JSON.stringify(setReq))
  }

  const clearHeart = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  const startHeart = () => {
    heartbeatInterval.value = setInterval(() => {
      const setReq = {
        device: globalOwlInfo.stationId,
        domain: globalOwlInfo.domain,
        type: '18',
      }
      sendMsg(JSON.stringify(setReq))
    }, 3000)
  }
  
  const callbackStart = (evt: any, type: string) => {
    let info = {
      channelId: '',
      startTime: '',
      pickupTime: '',
      endTime: '',
      endWith: '',
      bizType: sessionStorage.getItem("biztype"),
      orderId: globalCallInfo.callBackId,
      departId: globalOwlInfo.agentNo
    }
    if(type == 'hangup') {
      info.channelId = evt.callId
      info.endTime = evt.timestamp
      info.endWith = evt.hangUpDirection
      info.startTime = startTime.value
      info.pickupTime = pickupTime.value
    }
    callbackSeat(info)
    mutations.setHandCall(false)
  }

  const initWebSocket = () => {
    if (socket.value) {
      console.log('WebSocket already open, reusing connection...')
      if (socket.value.readyState === WebSocket.OPEN) {
         wsStatus.value = 'connected'
      } else if (socket.value.readyState === WebSocket.CONNECTING) {
         wsStatus.value = 'connecting'
      } else {
         wsStatus.value = 'disconnected'
      }
      
      _agentLogin(
        globalOwlInfo.domain,
        globalOwlInfo.stationId,
        globalOwlInfo.agentNo,
        globalOwlInfo.loginKey,
        0,
        'Login',
        '101',
        workMode.value
      )
      _setAgentStateS(
        globalOwlInfo.domain,
        globalOwlInfo.stationId,
        globalOwlInfo.agentNo,
        0,
        'Ready',
        '101',
        workMode.value
      )
      clearHeart()
      startHeart()
      return
    }

    if (!globalOwlInfo.ctiAddr) {
        console.warn('CTI Address is empty, cannot connect to WebSocket')
        return
    }

    socket.value = new WebSocket(globalOwlInfo.ctiAddr)
    
    socket.value.onopen = () => {
      console.log(
        "连接建立后，自动登录 ----->>",
        globalOwlInfo.domain,
        globalOwlInfo.stationId,
        globalOwlInfo.agentNo,
        globalOwlInfo.loginKey
      )
      _agentLogin(
        globalOwlInfo.domain,
        globalOwlInfo.stationId,
        globalOwlInfo.agentNo,
        globalOwlInfo.loginKey,
        0,
        'Login',
        '101',
        workMode.value
      )
      _setAgentStateS(
        globalOwlInfo.domain,
        globalOwlInfo.stationId,
        globalOwlInfo.agentNo,
        0,
        'Ready',
        '101',
        workMode.value
      )
      startHeart()
    }

    socket.value.onmessage = (event) => {
      const evt = JSON.parse(event.data)
      if (evt.code != null && event.data !== 'ping') {
        if (evt.type === 1) {
          if (evt.code === 200) {
            if (userWebrtc.value === 'N') {
              loginSuccess()
            }
          } else if (evt.code === 201) {
            ElMessage.success('进入小休状态')
          } else if (evt.code === 500) {
            ElMessage.error('登录失败，请检查坐席号、密码、分机状态是否正常-' + evt.errMsg)
          }
        }
      }
      if (evt.evtName != null) {
        if (evt.evtName === 'OriginatedEvt') {
          callid.value = evt.callId
          startTime.value = evt.timestamp
        } else if (evt.evtName === 'DeliveredEvt') {
          callid.value = evt.callId
        } else if (evt.evtName === 'EstablishedEvt') {
          callid.value = evt.callId
          pickupTime.value = evt.timestamp
        } else if (evt.evtName === 'ConnectionClearedEvt') {
           console.log(globalCallInfo.isHandCall, userWebrtc.value, '挂断喽')
           if(userWebrtc.value == 'N') {
             mutations.setWebRtcType(false)
             mutations.makecall(null)
             mutations.setHangUp(0)
             mutations.clearL(true)
             mutations.setIsCallIn(false)
             mutations.setIsListen(false)
           }
           if(globalCallInfo.isHandCall){
               callbackStart(evt, 'hangup')
           }
        }
      }
      if (evt.content && evt.content.evtName === 'AgentLoggedOffEvt') {
        clearHeart()
        if(emit) emit('login', 'logout')
        mutations.setShowIcon(false)
        isLogined.value = false
      }
    }

    socket.value.onclose = () => {
      ElMessage.error('监测到外呼系统已断连')
      clearHeart()
      isLogined.value = false
    }

    socket.value.onerror = (error) => {
      console.log(error, '报错信息')
    }
  }

  const loginSuccess = () => {
    mutations.logout(false)
    mutations.setShowIcon(true)
    ElMessage.success('呼叫系统连接成功')
  }

  const loadScript = (url: string) => {
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = url
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  return {
    socket,
    isLogined,
    loginStatus,
    userWebrtc,
    callid,
    sendMsg,
    _makeCall,
    _answerCall,
    _setAgentStateS,
    _hangupCall,
    _agentLogin,
    _setAgentLoginOut,
    initWebSocket,
    clearHeart,
    startHeart,
    loginSuccess,
    loadScript,
    workMode,
    wsStatus,
    globalOwlInfo,
    globalCallInfo,
    mutations
  }
}
