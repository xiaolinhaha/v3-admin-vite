<template>
  <div class="customer-page" :class="{ 'fullscreen': isFullScreen }">
    <SummaryBar :summary="summary" :conversations="conversations" />
    <ChatBoard
      :conversations="conversations"
      :info="info"
      :biz-types="bizTypes"
      :call-type="callType"
      :biztype-session="biztypeSession"
      :pinned-list="pinnedList"
      :label-list="intelligentOptions"
      :btn-status="btnStatus"
      :stop-max-num="stopMaxNum"
      :default-stop-num="defaultStopNum"
      :tooltip-title="tooltipTitle"
      @remove-conversation="removeConversation"
      @toggle-pin="togglePin"
      @change-status="(id) => changeBtnStatus(id)"
      @get-max-num="getStopTaskMaxNum"
    />
    <!-- 全屏悬浮按钮 -->
    <div class="fullscreen-toggle" @click="toggleFullScreen" :title="isFullScreen ? '退出全屏' : '全屏展示'">
      <!-- <i :class="isFullScreen ? 'el-icon-full-screen' : 'el-icon-full-screen'"></i> -->
      <el-icon class="pin-svg"><component :is="isFullScreen ? 'ZoomOut' : 'FullScreen'" /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import ChatBoard from './components/ChatBoard.vue'
import SummaryBar from './components/SummaryBarTab.vue'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useOwl } from './composables/useOwl'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  fetchBizTypes as apiFetchBizTypes, 
  getStopTaskMaxNum as apiGetStopTaskMaxNum, 
  getVoiceList, 
  fetchSummary as apiFetchSummary, 
  closeSse, 
  getLabels as apiGetLabels,
  getSseToken as apiGetSseToken,
} from '@/common/apis/intelligent-customer-inner'

// --- State ---
const summary = ref({
  total: 0,
  done: 0,
  filtered: 0,
  unreachable: 0,
  pendingCall: 0,
  call: 0,
})
const conversations = ref([])
const allConversations = ref([])
const addTimer = ref(null)
const flipTimers = ref({})
const flipPlan = ref({})
const pollTimer = ref(null)
const pollIntervalMs = ref(30000)
const eventSource = ref(null)
const sseTimer = ref(null)
const num = ref(0)
const route = useRoute()
const routeToken = computed(() => (route.query.token ? String(route.query.token) : ""))
const routeSeatId = computed(() => (route.query.seatId ? String(route.query.seatId) : ""))
const routeBizType = computed(() => (route.query.bizType ? String(route.query.bizType) : ""))
const authToken = computed(() => routeToken.value || localStorage.getItem('TOKEN') || '')

const info = reactive({
  appId: 'iop',
  seatId: routeSeatId.value || sessionStorage.getItem('userName') || 'zhangjialin',
  extNo: '',
  bizType: '',
  sToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJBUFAiLCJ1c2VyX2lkIjoiU1lTVEVNLDY1MzdfWVhIRF8xNywwMzA1X0NTTV9LMSIsImlzcyI6IlNlcnZpY2UiLCJpYXQiOjE3NjkxNDc0NDN9.iTCaIOdXreEZYek8NPoAvpZe1ODhMzj5D3GFZVNkwYQ',
  token: authToken.value,
})
const callType = ref('logout')
const bizTypes = ref({})
const pinnedList = ref([])
const isFullScreen = ref(false)
const intelligentOptions = ref([])
const bizTypeSelect = ref(routeBizType.value || sessionStorage.getItem('biztype') || '')
const btnStatus = ref('')
const voiceListData = ref([])
const stopMaxNum = ref(0)
const defaultStopNum = ref(0)
const tooltipTitle = ref('')

const { globalCallInfo, mutations } = useOwl()

// --- Computed ---
const clearList = computed(() => globalCallInfo.clearList)
const clearStatusHangOut = computed(() => globalCallInfo.hangOutAllStatus)

// --- Lifecycle ---
onMounted(() => {
  if (routeSeatId.value) {
    sessionStorage.setItem('userName', routeSeatId.value)
    info.seatId = routeSeatId.value
  }
  if (routeBizType.value) {
    sessionStorage.setItem('biztype', routeBizType.value)
    info.bizType = routeBizType.value
  }
  if (authToken.value) {
    info.token = authToken.value
  }
  fetchBizTypes()
  startSummaryPolling()
  createSSE()
  getLabels()
  getStopTaskMaxNum()
})

onBeforeUnmount(() => {
  stopSummaryPolling()
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
    closeSseEvn()
  }
  clearTimeout(sseTimer.value)
})

// --- Methods ---

async function fetchBizTypes() {
  try {
    const response = await apiFetchBizTypes()
    console.log(response, '获取业务类型列表')
    if (response && response.status === 0) {
      const content = response.content || []
      const map = {}
      content.forEach((item) => { map[item.code] = item.label })
      bizTypes.value = map
    }
  } catch (error) {
    ElMessage.error(error?.message || String(error))
  }
}

function biztypeSession(val) {
  if (btnStatus.value) {
    // Revert change if busy
    // info.bizType = info.bizType (no-op)
    return ElMessage.warning("请先挂断正在监听或者接管的用户记录！")
  }
  sessionStorage.setItem('biztype', val)
  info.bizType = val
  resetConversationsForBizTypeChange()
  
  if (eventSource.value) {
    try { eventSource.value.close() } catch (e) { }
    eventSource.value = null
    closeSseEvn()
  }
  
  setTimeout(() => {
    bizTypeSelect.value = val
    createSSE()
    getLabels()
    getStopTaskMaxNum()
  }, 500)
}

async function getStopTaskMaxNum() {
  const selectedBizType = info.bizType || sessionStorage.getItem("biztype")
  if (selectedBizType) {
    const res = await apiGetStopTaskMaxNum({ bizType: selectedBizType, seatId: info.seatId })
    if (res && res.status == 0) {
      const maxNum = res.content.maxLineNum ? Number(res.content.maxLineNum) : 0
      stopMaxNum.value = maxNum
      defaultStopNum.value = res.content.lineNum ? Number(res.content.lineNum) : 0
    }
  }
}

async function getLabels() {
  const selectedBizType = info.bizType || sessionStorage.getItem("biztype")
  if (selectedBizType) {
    const paramsLabel = {
      bizType: selectedBizType,
      labelGroup: 'HUMAN_LABEL',
      cur: 1,
      size: 10,
    }
    try {
      const res = await apiGetLabels(paramsLabel, {
        Authorization: localStorage.getItem('TOKEN') || '',
      })
      if (res && res.status == 0) {
        const data = res.content.records[0] || ""
        if (data) {
          const lists = data.labelList.split(',');
          intelligentOptions.value = lists.map((item) => ({
            label: item,
            value: item,
          }));
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
  const res = await getVoiceList()

  if (res && res.status == 0) {
    const newList = res.content.map((newItem) => {
      return {
        voiceName: newItem.voiceName,
        voiceCode: newItem.ttsTemplate,
      }
    })
    voiceListData.value = newList
  }
}

function startSummaryPolling() {
  stopSummaryPolling()
  fetchSummary()
  pollTimer.value = setInterval(() => {
    fetchSummary()
  }, pollIntervalMs.value)
}

function stopSummaryPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

async function fetchSummary() {
  const selectedBizType = sessionStorage.getItem("biztype") || info.bizType
  if (!selectedBizType) {
    return
  }
  try {
    const res = await apiFetchSummary({ bizType: selectedBizType, seatId: info.seatId })
    const data = (res && res && res.content) || {}
    summary.value = {
      total: data.total,
      done: data.done, 
      filtered: data.filtered,
      unreachable: data.notConnected,
      pendingCall: data.wait,
      call: data.call
    }
    tooltipTitle.value = (data && data.msg) ? data.msg : tooltipTitle.value
  } catch (err) {
    // Ignore
  }
}

function createSSE() {
  const selectedBizType = sessionStorage.getItem("biztype") || info.bizType
  apiGetSseToken(info.seatId, {
        Authorization: localStorage.getItem('TOKEN') || '',
        Authentication: `${info.sToken}`,
        token: '1',
        appId: `${info.appId}`,
        reconnectInterval: 'false'
  }).then((res) => {
    const newToken = res.content
    if (selectedBizType) {
        info.bizType = selectedBizType
        
        if (window.EventSource) {
          eventSource.value = new EventSourcePolyfill(
            `/iopApiAdmin/record/sse/connect/?bizType=${selectedBizType}&seatId=${info.seatId}`,
            {
              headers: {
                Authorization: localStorage.getItem('TOKEN') || '',
                Authentication: `${info.sToken}`,
                token: newToken,
                appId: `${info.appId}`,
                reconnectInterval: 'false',
              },
              withCredentials: true,
              heartbeatTimeout: 1000 * 60 * 60,
            }
          )
          eventSource.value.onopen = (e) => {
            clearTimeout(sseTimer.value)
            num.value = 0
            console.log('已连接', e)
          }
          eventSource.value.onmessage = (e) => {
            try {
              console.log('SSE 获取消息', e)
              const infoData = JSON.parse(e)
              applySSEUpdate(infoData)
            } catch (err) {
              console.log('SSE 消息解析失败', err, e && e.data)
            }
          }
          eventSource.value.onerror = (e) => {
            console.log('已关闭', e)
            if (e.type === 'error') {
              eventSource.value.close()
            }
            clearTimeout(sseTimer.value)
            if (num.value < 4) {
              sseTimer.value = setTimeout(() => {
                num.value++
                // createSSE()
              }, 200)
            } else {
              ElMessage.warning('请刷新页面')
              num.value = 0
            }
          }
        } else {
          ElMessage.error('你的浏览器不支持SSE')
        }
    } else {
      ElMessage.warning('请选择业务类型')
    }
    })
}

function resetConversationsForBizTypeChange() {
  stopDynamicGenerate()
  clearFlipTimers()
  flipPlan.value = {}
  conversations.value = []
  allConversations.value = []
  if (sseTimer.value) {
    clearTimeout(sseTimer.value)
    sseTimer.value = null
  }
  num.value = 0
}

function stopDynamicGenerate() {
  if (addTimer.value) {
    clearInterval(addTimer.value)
    addTimer.value = null
  }
  clearFlipTimers()
  flipPlan.value = {}
}

function clearFlipTimers() {
  const map = flipTimers.value
  Object.keys(map || {}).forEach(k => {
    clearTimeout(map[k])
  })
  flipTimers.value = {}
}

function removeConversation(id) {
  if (!id) return
  try {
    const pinnedIndex = pinnedList.value.indexOf(globalCallInfo.id)
    console.log("clearList ---->", pinnedList.value, globalCallInfo, id)
    if (pinnedIndex !== -1) {
      console.log("clearList ---->", pinnedList.value)
    } else {
      conversations.value = Array.isArray(conversations.value)
        ? conversations.value.filter(c => (c && String(c.id) !== String(id)))
        : []
    }
  } catch (e) { }
  btnStatus.value = ""
  mutations.setIsListen(false)
  mutations.setIsCallIn(false)
  mutations.setId('')
}

function changeBtnStatus(id) {
  btnStatus.value = id || ''
}

function applySSEUpdate(infoData) {
  console.log(" applySSEUpdate --->", infoData)
  if (!infoData || !infoData.callId) return
  const { callId, eventType, summary = {}, msgList = [], danger, voiceCode } = infoData

  if (eventType === 'CLEAR') {
    const pinnedIndex = pinnedList.value.indexOf(callId)
    console.log("this.pinnedList pinnedIndex ---->>>>", pinnedIndex, conversations.value)
    if (pinnedIndex !== -1) {
      const existing = conversations.value.find(c => c.id === callId)
      console.log("this.pinnedList existing ---->>>>", existing)
      if (existing) {
        existing.isCleared = true
      }
    } else {
      conversations.value = (conversations.value || []).filter(c => c.id !== callId)
      if (globalCallInfo.jlsCallId == callId) {
        setTimeout(() => {
          try {
            mutations.setHangUpNoWebRtc(Math.random())
          } catch (e) { }
        }, 200)
        btnStatus.value = ""
      }
      return
    }
    if (globalCallInfo.jlsCallId == callId) {
      setTimeout(() => {
        try {
          mutations.setHangUpNoWebRtc(Math.random())
        } catch (e) { }
      }, 200)
      btnStatus.value = ""
    }
  }

  const idx = (conversations.value || []).findIndex(c => c.id === callId)
  const base = idx >= 0 ? conversations.value[idx] : {}

  if (eventType === 'DIALOG') {
    if (idx == -1) {
      return
    }
  }

  const coalesce3 = (a, b, c) => (a !== undefined && a !== null ? a : (b !== undefined && b !== null ? b : c))
  const voiceNameStr = voiceListData.value.find(voiceItem => voiceItem.voiceCode == voiceCode)
  
  const updated = {
    id: callId,
    callId: callId,
    name: coalesce3(summary.custName, base.name, ''),
    phone: coalesce3(summary.mobileNo, base.phone, ''),
    duration: String(coalesce3(summary.duration, base.duration, 0)),
    interactCount: Array.isArray(msgList) ? msgList.length : 0,
    outboundCount: 1,
    msgList: Array.isArray(msgList) ? msgList : [],
    eventType: eventType || 'no',
    voiceCode: voiceNameStr ? voiceNameStr.voiceName : voiceCode,
    score: (base.score !== undefined && base.score !== null) ? base.score : 0,
    flag: danger ? (danger == '0' ? 'normal' : 'yellow') : ((base.flag !== undefined && base.flag !== null) ? base.flag : 'danger'),
    danger: danger,
    custInfo: summary || {},
    summary: summary,
    messages: (function () {
      console.log("msgList --->", msgList)
      var incoming = Array.isArray(msgList) ? msgList : []
      var existing = Array.isArray(base.messages) ? base.messages : []
      
      function toParts(item) {
        if (!item) return { id: undefined, parts: [] }
        var id = item.id
        var parts = []
        if (Array.isArray(item.parts)) {
          for (var p = 0; p < item.parts.length; p++) {
            var part = item.parts[p]
            if (!part || !part.content) continue
            var type = part.type === 'user' ? 'user' : 'agent'
            parts.push({ type: type, content: String(part.content) })
          }
        } else {
          if (item.script) parts.push({ type: 'agent', content: String(item.script) })
          if (item.userScript) parts.push({ type: 'user', content: String(item.userScript) })
        }
        return { id: id, parts: parts }
      }
      
      if (!existing.length) {
        return incoming.map(toParts)
      }
      
      var idIndex = {}
      for (var i = 0; i < existing.length; i++) {
        var it = toParts(existing[i])
        existing[i] = it
        if (it && it.id) idIndex[it.id] = i
      }
      
      var merged = existing.slice()
      for (var j = 0; j < incoming.length; j++) {
        var ni = toParts(incoming[j])
        if (!ni || !ni.id) continue
        var pos = idIndex[ni.id]
        if (pos !== undefined) {
          var prev = merged[pos] || { id: ni.id, parts: [] }
          var prevParts = Array.isArray(prev.parts) ? prev.parts : []
          var nextParts = Array.isArray(ni.parts) ? ni.parts : []
          
          function eq(a, b) {
            return !!a && !!b && a.type === b.type && String(a.content) === String(b.content)
          }
          
          function overlapCount(a, b) {
            var max = Math.min(a.length, b.length)
            for (var m = max; m > 0; m--) {
              var match = true
              for (var t = 0; t < m; t++) {
                var pa = a[a.length - m + t]
                var nb = b[t]
                if (!eq(pa, nb)) { match = false; break }
              }
              if (match) return m
            }
            return 0
          }
          
          var overlap = overlapCount(prevParts, nextParts)
          for (var k = overlap; k < nextParts.length; k++) {
            var part = nextParts[k]
            prevParts.push({ type: part.type, content: String(part.content) })
          }
          merged[pos] = { id: prev.id || ni.id, parts: prevParts }
        } else {
          merged.push({ id: ni.id, parts: Array.isArray(ni.parts) ? ni.parts.slice() : [] })
        }
      }
      return merged
    })(),
  }

  if (idx >= 0) {
    conversations.value[idx] = { ...base, ...updated }
  } else {
    conversations.value.push(updated)
  }
}

function togglePin({ id }) {
  const index = pinnedList.value.indexOf(id)
  if (index !== -1) {
    pinnedList.value.splice(index, 1)
    const target = conversations.value.find(c => c.id == id)
    if (target && target.isCleared) {
      conversations.value = conversations.value.filter(c => c.id !== id)
    }
  } else {
    pinnedList.value.push(id)
  }
}

function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
}

function closeSseEvn() {
  if (bizTypeSelect.value) {
    closeSse(
      bizTypeSelect.value, 
      sessionStorage.getItem("userName") || '', 
      {
        Authentication: info.sToken,
        appId: info.appId
      }
    )
  }
}

// --- Watchers ---

watch(isFullScreen, (val) => {
  const header = document.querySelector('.header-bar-container')
  if (header && header.style) {
    header.style.display = val ? 'none' : ''
  }
})

watch(clearList, (val) => {
  console.log("aaabbbccc --->", val, globalCallInfo)
  if (val) {
    // Logic for clearList
  }
}, { deep: true })

watch(clearStatusHangOut, (val) => {
  console.log("aaabbbccc --->", val, globalCallInfo, conversations.value)
  if (val) {
    let newData = conversations.value.find(c => (c && c.id == globalCallInfo.changID))
    if (newData) {
      applySSEUpdate({
        ...newData,
        eventType: 'CLEAR'
      })
    }
  }
}, { deep: true })

</script>

<style scoped>
.customer-page {
  display: flex;
  flex-direction: column;
  /* 移除固定视口高度，改为自适应内容高度 */
  height: 100%;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #f0f2f5;
  /* 确保背景色一致 */
  position: relative;
  /* 为悬浮按钮提供定位上下文 */
  --chat-panel-offset: 225px;
  /* 默认偏移量 */
}

.customer-page.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  padding: 4px;
  /* 可选：增加一点内边距 */
  margin: 0;
  --chat-panel-offset: 132px;
  /* 全屏时偏移量减小，适应页面高度 */
}

.fullscreen-toggle {
  position: absolute;
  bottom: 10px;
  right: 14px;
  width: 38px;
  height: 38px;
  background: #aaaaaa92;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2001;
  /* 确保在最上层 */
  color: #047ffb;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s;
}

.fullscreen-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  background: #ecf5ff;
}
</style>
