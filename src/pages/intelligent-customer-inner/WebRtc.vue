<template>
  <div style="display: flex;">
    <audio v-show="true" src="" autoplay controls webkit-playsinline playsinline x5-playsinline ref="localRender"></audio>
    <audio v-show="true" src="" autoplay controls webkit-playsinline playsinline x5-playsinline ref="remoteRender" crossorigin="anonymous"></audio>
    <div class="volume-bar-wrapper">
      <div class="volume-bar" :style="{ width: '16px' , height: localVolumeLevel + '%',backgroundColor: 'rgb(56, 117, 246)',borderRadius: '4px'}" ></div>
    </div>
    <div class="volume-bar-wrapper">
      <div class="volume-bar" :style="{ width: '16px' , height: remoteVolumeLevel + '%',backgroundColor: 'rgb(56, 117, 246)',borderRadius: '4px'}" ></div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useOwl } from './composables/useOwl'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['hangup', 'changeSuccess', 'changeLogOut', 'rtcHangUp', 'login'])

const { globalOwlInfo, globalCallInfo, mutations } = useOwl()

const localRender = ref(null)
const remoteRender = ref(null)

const localVolumeLevel = ref(2)
const remoteVolumeLevel = ref(2)

let localAudioContext = null
let localAnalyser = null
let localDataArray = null
let sourceLocal = null

let remoteAudioContext = null
let remoteAnalyser = null
let remoteDataArray = null
let sourceRemote = null

let requestAnimationFrameId = null
let client = null

// Expose methods to parent
defineExpose({
  initWebRtc,
  emitHangup,
  emitMuteAudio,
  emitUnmuteAudio,
  emitUnregister
})

function initWebRtc() {
  const SipCall = window.SipCall
  if (!SipCall) {
    ElMessage.error('软电话组件未加载')
    return
  }

  let callerNumber = globalOwlInfo.stationId + '@rongdata.com'
  let callerPassword = globalOwlInfo.loginKey
  let callerParams = globalOwlInfo.stationId + '@rongdata.com'
  let metaData = globalOwlInfo.webRtcLoginToken
  let iceServers = [
    {
      urls: [globalOwlInfo.iceServerAddr], //测试
      credential: 'zealcomm',
      username: 'zealcomm'
    }
  ]

  let sipInfo = new SipCall.SipInfo(globalOwlInfo.sipUrl, callerNumber, callerPassword, callerParams)

  if (localRender.value) {
    localRender.value.onloadeddata = () => {
      console.log('localRender进入')
      if (localRender.value) localRender.value.volume = 0
    }
  }

  if (remoteRender.value) {
    remoteRender.value.onloadeddata = () => {
      console.log('remoteRender进入')
      if (remoteRender.value) remoteRender.value.play()
    }
  }

  // Use '/ves' to trigger Vite proxy to https://dev-ng.leagpoint.com/ves
  // Hardcode metaData from user provided cURL
  metaData = '301878c2-0c7e-40ab-a344-629c1083b553'
  client = new SipCall.Client('/ves', sipInfo, metaData, localRender.value, remoteRender.value, iceServers)
  // Hardcode forwardingMarker from user provided cURL
  client.id = 'f6b502f3-f396-47d8-b587-c509de8ee494'

  // Events
  client.addEventListener('call-start', (event) => {
    console.log('webrtc:call-start:', event.info)
    // showVolume(); //开始分析音量
  })

  client.addEventListener('call-error', (event) => {
    console.log('webrtc:call-error:', event.info)
    stopShowVolume() //停止分析音量
  })

  client.addEventListener('call-end', (event) => {
    console.log('webrtc:call-end:', event.info)
    ElMessage.success('挂断成功')
  })

  client.addEventListener('incoming-call', (event) => {
    console.log('webrtc:incoming-call:', event.info)
    client
      .answer(event.info.callId)
      .then(() => {
        console.log('answer success')
      })
      .catch((err) => {
        console.log('answer fail:', err)
      })
  })

  client.addEventListener('incoming-call-cancelled', (event) => {
    console.log('webrtc:incoming-call-cancelled:', event.info)
  })

  client.addEventListener('call-reject', (event) => {
    console.log('webrtc:call-reject:', event.info)
  })

  client.addEventListener('registered-ok', (event) => {
    emit('changeSuccess')
    console.log('webrtc:registered-ok:', event.info)
  })

  client.addEventListener('registered-failed', (event) => {
    ElMessage.error('软登录失败，请重试登录')
    console.log('webrtc:registered-failed:', event.info)
  })

  client.addEventListener('dtmf', (event) => {
    console.log('webrtc:dtmf:', event.info)
  })

  client.addEventListener('server-disconnected', (event) => {
    console.log('webrtc:server-disconnected:', event)
  })

  console.log(window.location, 'window.location')
  client
    .register('wss://dev-ng.leagpoint.com')
    .then(() => {
      console.log('register success', window.location)
    })
    .catch((err) => {
      console.log('register failed:', err)
      ElMessage.error('软登录失败，请重试登录')
      emit('changeLogOut')
      emit('statusChange', 'disconnected')
    })
}

function emitHangup() {
    console.log('webRtc: received hang-up event, calling client.hangup()')
    if (client) client.hangup()
    stopShowVolume()
    hangUpCustom()
}

function emitMuteAudio() {
    console.log("handleUnmuteAudio 3", client)
    if (client) client.muteAudio()
}

function emitUnmuteAudio() {
    console.log("handleUnmuteAudio 4", client, localRender.value)
    if (client) client.unmuteAudio()
}

function emitUnregister() {
    if (client) client.unregister()
}


async function showVolume() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!localAudioContext || localAudioContext.state === 'closed') {
    localAudioContext = new AudioContextClass()
  }
  if (localAudioContext && localAudioContext.state === 'suspended') {
    await localAudioContext.resume()
  }
  if (localRender.value && localRender.value.srcObject) {
      sourceLocal = localAudioContext.createMediaStreamSource(localRender.value.srcObject)
      localAnalyser = localAudioContext.createAnalyser()
      localAnalyser.fftSize = 256
      localDataArray = new Uint8Array(localAnalyser.frequencyBinCount)

      sourceLocal.connect(localAnalyser)
      localAnalyser.connect(localAudioContext.destination)
  }


  if (!remoteAudioContext || remoteAudioContext.state === 'closed') {
    remoteAudioContext = new AudioContextClass()
  }
  if (remoteAudioContext && remoteAudioContext.state === 'suspended') {
    await remoteAudioContext.resume()
  }
  
  if (remoteRender.value && remoteRender.value.srcObject) {
      sourceRemote = remoteAudioContext.createMediaStreamSource(remoteRender.value.srcObject)
      remoteAnalyser = remoteAudioContext.createAnalyser()
      remoteAnalyser.fftSize = 256
      remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount)

      sourceRemote.connect(remoteAnalyser)
      remoteAnalyser.connect(remoteAudioContext.destination)
  }

  updateVolume()
}

function stopShowVolume() {
  if (requestAnimationFrameId) {
    cancelAnimationFrame(requestAnimationFrameId)
    requestAnimationFrameId = null
    localVolumeLevel.value = 0
    remoteVolumeLevel.value = 0
  }
  // 停止分析输入音频
  if (localAnalyser) {
    localAnalyser.disconnect()
    localAnalyser = null
  }
  if (sourceLocal) {
    sourceLocal.disconnect()
    sourceLocal = null
  }
  if (localAudioContext && localAudioContext.state !== 'closed') {
    localAudioContext
      .close()
      .then(() => {
        localAudioContext = null
      })
      .catch((err) => {
        console.error('关闭localAudioContext失败：', err)
      })
  }
  //停止分析输出音频
  if (remoteAnalyser) {
    remoteAnalyser.disconnect()
    remoteAnalyser = null
  }
  if (sourceRemote) {
    sourceRemote.disconnect()
    sourceRemote = null
  }
  if (remoteAudioContext && remoteAudioContext.state !== 'closed') {
    remoteAudioContext
      .close()
      .then(() => {
        remoteAudioContext = null
      })
      .catch((err) => {
        console.error('关闭remoteAudioContext失败：', err)
      })
  }
}

function updateVolume() {
  let sum = 0
  if (localAnalyser && localDataArray) {
    localAnalyser.getByteFrequencyData(localDataArray)
    sum = 0
    for (let i = 0; i < localDataArray.length; i++) {
      sum += localDataArray[i]
    }
    let average = sum / localDataArray.length
    localVolumeLevel.value = Math.min(Math.ceil((average / 50) * 100), 100)
  }
  if (remoteAnalyser && remoteDataArray) {
    remoteAnalyser.getByteFrequencyData(remoteDataArray)
    sum = 0
    for (let i = 0; i < remoteDataArray.length; i++) {
      sum += remoteDataArray[i]
    }
    let average = sum / remoteDataArray.length
    remoteVolumeLevel.value = Math.min(Math.ceil((average / 50) * 100), 100)
  }
  requestAnimationFrameId = requestAnimationFrame(() => updateVolume())
}

function hangUpCustom() {
  emit('hangup')
  mutations.setWebRtcType(false)
  mutations.makecall(null)
  mutations.setHangUp(0)
  mutations.clearL(true)
  mutations.setIsCallIn(false)
  mutations.setIsListen(false)
  stopShowVolume()
}

onUnmounted(() => {
    stopShowVolume()
})
</script>

<style scoped>
.volume-bar-wrapper {
  border-radius: 4px;
  display: flex;
  width: 16px;
  margin-top: 8px;
  margin-right: 8px;
  height: 48px;
  background-color: #eeeeee;
  align-items: flex-end;
}

.volume-bar {
  border-radius: 4px;
  width: 16px;
  height: 1px;
  background-color: rgb(56, 117, 246);
}
</style>
