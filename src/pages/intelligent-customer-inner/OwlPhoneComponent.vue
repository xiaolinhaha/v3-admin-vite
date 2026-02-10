<template>
  <div>
    <div v-if="!isLogined && loginStatus" style="height:48px; margin-right: 32px; font-size: 18px; display: flex; align-items: center;">
      <el-tooltip effect="dark" content="登录" placement="top">
        <el-icon class="iconService iconStyle" @click="initLogin"><Phone /></el-icon>
      </el-tooltip>
    </div>
    <div v-if="isLogined" style="height:48px; margin-right: 32px; display: flex; align-items: center;"> 
          <webrtc ref="wrtRef" @hangup="rtcHangup" @changeSuccess="loginSuccess" @changeLogOut="logOutChange" v-show="false" v-if="userWebrtc == 'Y'"/>

          <el-tooltip effect="dark" content="登出" placement="top">
              <el-icon class="iconClose" @click="logOut"><SwitchButton /></el-icon>
          </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useOwl } from './composables/useOwl'
import Webrtc from './WebRtc.vue'
import { getCurrentUserAgent } from '@/common/apis/intelligent-customer-inner'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['rtcHangUp', 'login'])

const {
  globalOwlInfo,
  globalCallInfo,
  mutations,
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
  loadScript,
  workMode,
  wsStatus,
} = useOwl(emit)

const wrtRef = ref(null)
const rtcStatus = ref('disconnected')

const connectionStatus = computed(() => {
  if (!isLogined.value) return 'disconnected'

  const ws = wsStatus.value
  const rtc = rtcStatus.value
  const useRtc = userWebrtc.value === 'Y'

  if (useRtc) {
    if (ws === 'connected' && rtc === 'connected') return 'connected'
    if (ws === 'connecting' || rtc === 'connecting') return 'connecting'
    return 'disconnected'
  } else {
    return ws
  }
})

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '连接正常'
    case 'connecting': return '连接中...'
    case 'disconnected': return '连接断开，点击重连'
    default: return '未知状态'
  }
})

const onRtcStatusChange = (status) => {
  rtcStatus.value = status
}

const handleReconnect = async () => {
  if (connectionStatus.value === 'connecting') return

  // 1. Log out first
  try {
     // Force logout logic
    _setAgentLoginOut(domain.value, stationId.value, agentNo.value, agentPwd.value, 0, 'Logout', '101', workMode.value)
    if (userWebrtc.value == 'Y') {
      if (wrtRef.value) wrtRef.value.emitUnregister()
    }
    clearHeart()
    isLogined.value = false
    
    // 2. Re-login
    setTimeout(() => {
      initLogin()
    }, 1000)
  } catch (e) {
    console.error('Reconnect failed during logout phase', e)
    ElMessage.error('重连失败，请手动刷新页面')
  }
}

// --- Computed Properties (Mapping from Hooks) ---
const domain = computed(() => globalOwlInfo.domain)
const stationId = computed(() => globalOwlInfo.stationId)
const agentNo = computed(() => globalOwlInfo.agentNo)
const agentPwd = computed(() => globalOwlInfo.loginKey)
const webRtcLoginToken = computed(() => globalOwlInfo.webRtcLoginToken)
const orgCode = computed(() => globalOwlInfo.orgCode)
const suborgCode = computed(() => globalOwlInfo.suborgCode)
const prefix = computed(() => globalOwlInfo.prefix)
const ctiAddr = computed(() => globalOwlInfo.ctiAddr)

const hangupStatus = computed(() => globalCallInfo.hangupStatus)
const info = computed(() => globalCallInfo.info)
const webRtcType = computed(() => globalCallInfo.webRtcType)
const isListen = computed(() => globalCallInfo.isListen)
const isCallIn = computed(() => globalCallInfo.isCallIn)
const jlsCallId = computed(() => globalCallInfo.jlsCallId)
const callType = computed(() => globalCallInfo.isHandCall)
const callBackId = computed(() => globalCallInfo.callBackId)
const logouts = computed(() => globalCallInfo.logouts)
const hangUpNoWebRtc = computed(() => globalCallInfo.hangUpNoWebRtc)
const handleRtcMuteAudio = computed(() => globalCallInfo.handleRtcMuteAudio)
const handleRtcUnmuteAudio = computed(() => globalCallInfo.handleRtcUnmuteAudio)

// --- Local State ---
// None needed locally if we rely on global state

// --- Watchers ---

watch(hangupStatus, (newVal, oldVal) => {
  console.log('hangupStatus', newVal, oldVal, 'userWebrtc:', userWebrtc.value)
  if (newVal == 1 && userWebrtc.value == 'Y') {
    console.log('owlPhone: emitting hang-up to webRtc')
    if (wrtRef.value) wrtRef.value.emitHangup()
  }
  if (newVal == 1 && userWebrtc.value == 'N') {
    console.log('owlPhone: calling hangupCall()')
    _hangupCall()
  }
})

watch(info, (newVal) => {
  if (newVal) {
    console.log(newVal, '打电话')
    _makeCall(newVal.mobileNo)
  }
})

watch(logouts, (newVal) => {
  if (newVal) {
    setAgentLoginOut()
  }
})

watch(hangUpNoWebRtc, () => {
  if (userWebrtc.value == 'Y') {
    console.log('hangUpNoWebRtc this.userWebrtc', userWebrtc.value)
    if (wrtRef.value) wrtRef.value.emitHangup()
  }

  if (userWebrtc.value == 'N') {
    console.log('owlPhone: calling hangupCall()')
    _hangupCall()
  }
})

watch(handleRtcMuteAudio, () => {
  console.log("handleUnmuteAudio 2", userWebrtc.value)
  if (userWebrtc.value == 'Y') {
    if (wrtRef.value) wrtRef.value.emitMuteAudio()
  }
})

watch(handleRtcUnmuteAudio, () => {
  if (userWebrtc.value == 'Y') {
    if (wrtRef.value) wrtRef.value.emitUnmuteAudio()
  }
})

// --- Lifecycle ---

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// --- Methods ---

const handleBeforeUnload = () => {
  if (isLogined.value) {
    setAgentLoginOut()
  }
}

const logOut = () => {
  ElMessageBox.confirm('是否确认登出', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    setAgentLoginOut()
  })
}

const setAgentLoginOut = () => {
  _setAgentLoginOut(domain.value, stationId.value, agentNo.value, agentPwd.value, 0, 'Logout', '101', workMode.value)
  if (userWebrtc.value == 'Y') {
    if (wrtRef.value) wrtRef.value.emitUnregister()
  }
}

const initPhone = () => {
  isLogined.value = true
  loginStatus.value = true
  if (userWebrtc.value == 'Y') {
    nextTick(() => {
      if (wrtRef.value) wrtRef.value.initWebRtc()
    })
  }
  initWebSocket()
}

const initLogin = () => {
  loginStatus.value = false
  const bizType = sessionStorage.getItem("biztype") || ''
  getCurrentUserAgent(bizType).then(async (res) => {
    console.log(res.content, '软电话信息')
    if (!res.content) {
      ElMessage.error('未配置分机信息！')
      return
    }

    const useTemplateType = res.data?.content?.useTemplateType
    let basePath = 'webrtc'
    if (useTemplateType === 'N') {
      basePath = 'jlxwebrtc'
    } else if (useTemplateType === 'Y') {
      basePath = 'webrtc'
    }

    const baseUrl = import.meta.env.BASE_URL || '/'
    const finalPath = baseUrl + basePath

    try {
      const originalEvent = window.Event
      await loadScript(`${finalPath}/irtc.js`)
      await loadScript(`${finalPath}/sipcall.js`)
      if (window.Event !== originalEvent) {
        console.warn('Restoring window.Event overwritten by sipcall.js')
        window.Event = originalEvent
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('加载软电话组件失败')
      return
    }

    localStorage.setItem("userWebrtc", res.content.userWebrtc)
    userWebrtc.value = res.content.useWebrtc
    mutations.init(res.content)
    console.log("userWebrtc.value --->>", userWebrtc.value)
    if (userWebrtc.value == 'Y') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop())
          initPhone()
        }).catch(err => {
          ElMessage.error('请开启麦克风权限')
          loginStatus.value = true
        })
      } else {
        ElMessage.error('当前浏览器不支持获取麦克风权限')
        loginStatus.value = true
      }
    } else {
      initPhone()
    }
  }).catch((error) => {
    console.error('Login failed:', error)
    ElMessage.error('登录失败，请稍后重试')
    loginStatus.value = true
  })
}

const rtcHangup = () => {
  console.log(jlsCallId.value, '挂断了')
  emit('rtcHangUp', jlsCallId.value)
  emit('login', 'calloutSuccess')
}

const loginSuccess = () => {
  mutations.logout(false)
  mutations.setShowIcon(true)
  ElMessage.success('呼叫系统连接成功')
}

const logOutChange = () => {
  clearHeart()
  isLogined.value = false
}

</script>

<style scoped>
.iconService {
  font-size: 25px;
  color: #3370ff;
  cursor: pointer;
  transition: all 0.3s;
}
.iconClose {
  font-size: 18px;
  color: #f56c6c;
  cursor: pointer;
  transition: all 0.3s;
}
</style>
