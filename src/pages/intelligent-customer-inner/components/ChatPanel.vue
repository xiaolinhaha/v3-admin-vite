<template>
  <div class="chat-panel" :class="[
    isDanger ? 'chat-panel--danger' : (isYellow ? 'chat-panel--yellow' : 'chat-panel--info'),
    isActive ? 'active-pulse' : ''
  ]">
    <!-- 钉住图标 -->
    <div class="pin-action" :class="{ 'pinned': isPinned }" @click.stop="$emit('toggle-pin')">
      <el-icon class="pin-svg" :class="{ 'pinned': isPinned }"><PushPin /></el-icon>
    </div>
    <div class="panel-container-header">
      <!-- 用户信息头部 -->
      <div class="panel-header" :class="isDanger ? 'panel-header--danger' : (isYellow ? 'panel-header--yellow' : 'panel-header--info')">
        <div class="user-info" @click="changeDanger">
          <div class="name-col">
            <div class="avatar" :class="isDanger ? 'avatar--danger' : (isYellow ? 'avatar--yellow' : 'avatar--info')">
              <i class="el-icon-user-solid"></i>
            </div>
            <div class="user-details">
              <div class="name-row">
                <span class="name" :class="isDanger ? 'font--color--info' : (isYellow ? 'font--color--yellow' : 'font--color--danger')">{{ nameDisplay }}</span>
                <span class="salutation" :class="isDanger ? 'font--color--info--title' : (isYellow ? 'font--color--yellow--title' : 'font--color--danger--title')">（{{ sexData }}）</span>
              </div>
            </div>
          </div>
        </div>
        <div class="panel-header-labels">
          <div>
            <span class="timer-pill">{{ durationDisplay }}</span>
            <span class="status-pill">交互:{{ interactCountDisplay }}</span>
          </div>

          <div class="labels">
            <div class="status-info" v-if="custInfo.hitRule">
              <span :class="isDanger ? 'label-tag' : (isYellow ? 'label-tag warning' : 'label-tag danger')" v-if="(!isDanger || isYellow)">{{ custInfo.hitRule }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 案件信息 -->
      <div class="case-info" ref="caseInfo">
        <div class="info-left">
          <div class="info-item">
            <span class="label" title="案件编号">案件编号：</span>
            <span class="value" :title="String(caseIdDisplay)">{{ caseIdDisplay }}</span>
            <i class="el-icon-document-copy copy-icon" @click.stop="handleCopy(caseIdDisplay)"></i>
          </div>
          <div class="info-item">
            <span class="label" title="话术模板">话术模板：</span>
            <span class="value" :title="String(scriptNameDisplay)">{{ scriptNameDisplay }}</span>
          </div>
          <div class="info-item">
            <span class="label" title="声音名称">声音名称：</span>
            <span class="value" :title="String(voiceNameDisplay)">{{ voiceNameDisplay }}</span>
          </div>
        </div>
        <div class="info-left">
          <div class="info-item">
            <span class="label" title="卡号">外呼：</span>
            <span class="value" :title="String(custInfo.callIndex || 0)">{{ custInfo.callIndex || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="label" title="逾期天数">逾期天数：</span>
            <span class="value" :title="String(billAmount)">{{ billAmount }}</span>
          </div>
          <div class="info-item">
            <span class="label" title="最低还款额">最低还款额：</span>
            <span class="value" :title="String(minAmountDisplay)">{{ minAmountDisplay }}</span>
          </div>
        </div>
      </div>
      <!-- 查看更多 / 收起按钮 -->
      <div class="more-toggle" @click.stop.prevent="toggleMoreDetails">
        <span>{{ showMoreDetails ? '收起' : '查看更多' }}</span>
        <i :class="showMoreDetails ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
      </div>
      <!-- 详情手风琴：向下展开在当前区域，不固定高度 -->
      <transition
        name="accordion"
        @before-enter="beforeEnter"
        @enter="enter"
        @after-enter="afterEnter"
        @before-leave="beforeLeave"
        @leave="leave"
        @after-leave="afterLeave"
      >
        <div v-show="showMoreDetails" class="more-details">
          <div class="grid grid-2">
            <div v-for="(custItem, idx) in custInfoList" :key="'f-' + idx" class="grid-item">
              <span class="label">{{ custItem.label }}：</span>
              <span class="value" :title="String(conversation.custInfo[custItem.value] || '')">
                {{ conversation.custInfo[custItem.value] }}
              </span>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="chatMessages">
      <div
        v-for="message in displayMessages"
        :key="message.id"
        :class="['message', message.sender === 'user' ? 'message--user' : 'message--agent']"
      >
        <!-- 头像 -->
        <div class="message-avatar">
          <i :class="message.sender === 'user' ? 'el-icon-user' : 'el-icon-service'"></i>
        </div>

        <div class="message-bubble">
          <div class="message-content">
            {{ message.renderedContent || message.content }}
            <span v-if="message.typing" class="typing-cursor">|</span>
          </div>
        </div>
      </div>
      <!-- 正在输入提示 -->
      <div v-if="isTypingIndicator" class="typing-indicator-wrapper">
        <div class="message-avatar agent-avatar">
          <i class="el-icon-service"></i>
        </div>
        <div class="typing-bubble">
          <div class="typing-indicator">
            <span class="dots"><i></i><i></i><i></i></span>
          </div>
        </div>
      </div>
      <div v-if="isClearStatus" class="end-with-content">
        <div class="end-with-line" />
        <div class="end-with-text">{{ showHangUpLabel }}</div>
        <div class="end-with-line" />
      </div>
    </div>
    <!-- 悬浮详情层已移入聊天区域内部 -->
    <!-- 底部操作区 -->
    <div class="panel-footer">
      <!-- 呼叫按钮：默认不显示，签入后显示；初始为白底蓝标，点击变蓝底白标 -->
      <div class="footer-content">
        <div class="action-buttons ios-segmented-control" v-if="showIcon && !isClearStatus">
          <div class="ios-btn-wrapper left-btn">
            <span class="full-width" v-if="showDel && activeCallType == 'call'">
              <button class="ios-btn destructive" @click="callOut">
                <span class="btn-text">挂断</span>
              </button>
            </span>
            <span v-if="activeCallType !== 'call'" class="full-width">
              <button class="ios-btn" :class="{ 'active': activeCallType == 'call' }" @click="() => toggleCall('call')">
                <span class="btn-text">接管</span>
              </button>
            </span>
          </div>
          <div class="ios-btn-wrapper right-btn">
            <span v-if="showDel && activeCallType == 'hangup'" class="full-width">
              <button class="ios-btn destructive" @click="callOut">
                <span class="btn-text">取消监听</span>
              </button>
            </span>
            <span v-if="activeCallType !== 'hangup' && !(showDel && activeCallType == 'call' && btnMuteAudioStatus)" class="full-width">
              <button class="ios-btn" :class="{ 'active': activeCallType == 'hangup' }" @click="() => toggleCall('hangup')">
                <span class="btn-text">监听</span>
              </button>
            </span>
            <span class="full-width" v-if="showDel && activeCallType == 'call' && (muteAudioStatus) && btnMuteAudioStatus">
              <button class="ios-btn destructive-mute" @click="handleMuteAudio">
                <span class="btn-text">静音</span>
              </button>
            </span>
            <span class="full-width" v-if="showDel && activeCallType == 'call' && (!muteAudioStatus) && btnMuteAudioStatus">
              <button class="ios-btn destructive-mute" @click="handleUnmuteAudio">
                <span class="btn-text">取消静音</span>
              </button>
            </span>
          </div>
        </div>
        <div class="status-info-bottom">
          <div class="status-info-item-header">
            <!-- <span class="status-title">智能结果：</span>
            <span class="status-text">{{isClearStatus ? '通话已结束' : '通话进行中'}}</span> -->
          </div>

          <span class="save-btn" @click="handleSave">保存</span>
        </div>
        <div class="tag-section">
          <span class="tag-label">人工标签：</span>

          <div class="tags">
            <span v-for="i in labelList" :key="i.value" :class="['tag', isTagSelected(i) ? 'active' : '']" @click="toggleTag(i)">
              {{ i.label }}
            </span>
          </div>
        </div>
        <div class="communication-section">
          <span class="comm-label">沟通备注：</span>
          <div class="textarea-wrapper">
            <!-- 展开/收起按钮 -->
            <div class="expand-btn" @click="toggleExpand" :title="isExpanded ? '收起' : '展开'">
              <el-icon><component :is="isExpanded ? 'ArrowDown' : 'ArrowUp'" /></el-icon>
            </div>
            <textarea
              ref="commTextarea"
              class="comm-textarea"
              v-model="commNote"
              rows="3"
              placeholder="请输入沟通备注"
              maxlength="200"
              :style="textareaHeight ? { height: textareaHeight + 'px' } : {}"
            />
            <span class="char-count">{{ commNote.length }}/200</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { colJson, HCSColJson, HCSSectionOptions, defaultSectionOptions } from '../config'
import { useOwl } from '../composables/useOwl'
import { updateLabel, referSeat, listenSeat } from '../apis'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  info: {
    type: Object,
    required: true
  },
  softSignedIn: { type: Boolean, default: false },
  bizType: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  labelList: { type: Array, default: () => [] },
  btnStatus: { type: String, default: '' }
})

const emit = defineEmits([
  'toggle-pin',
  'like-message',
  'dislike-message',
  'hangup-request',
  'change-status'
])

const { globalOwlInfo, globalCallInfo, mutations } = useOwl()

// --- State ---
const showMoreDetails = ref(false)
const commNote = ref('')
const simMessages = ref([])
const pendingQueue = ref([])
const drainTimer = ref(null)
const drainIntervalMs = ref(800)
const typewriterSpeedMs = ref(20)
const typingDelayMs = ref(500)
const isTypingIndicator = ref(false)
const typeTimers = ref({})
const draining = ref(false)
const currentConversationId = ref(null)
const renderedMsgIds = ref({})
const renderedPartCounts = ref({})
const activeCallType = ref('')
const durationSeconds = ref(0)
const durationTimer = ref(null)
const disabledButtons = ref({ call: false, hangup: false })
const custInfoList = ref([])
const sectionOptions = ref(defaultSectionOptions)
const selectedTagIndexes = ref([])
const showDel = ref(false)
const oprateStatus = ref('call')
const killStatus = ref('')
const catOutDisable = ref(false)
const btnStatusAll = ref('')
const muteAudioStatus = ref(true)
const btnMuteAudioStatus = ref(false)
const textareaHeight = ref(null)
const isExpanded = ref(false)

const caseInfo = ref(null)
const commTextarea = ref(null)
const chatMessages = ref(null)

// --- Computed ---

const isDanger = computed(() => {
  const c = props.conversation || {}
  return c.flag === 'danger'
})

const isClearStatus = computed(() => {
  const c = props.conversation || {}
  return c.isCleared || false
})

const isYellow = computed(() => {
  const c = props.conversation || {}
  return c.flag === 'yellow'
})

const showCallActions = computed(() => !!props.softSignedIn)

const nameDisplay = computed(() => {
  const c = props.conversation || {}
  return c.name || ''
})

const interactCountDisplay = computed(() => {
  const c = props.conversation || {}
  return typeof c.interactCount === 'number' ? c.interactCount : 1
})

const outboundCountDisplay = computed(() => {
  const c = props.conversation || {}
  return typeof c.outboundCount === 'number' ? c.outboundCount : 1
})

const durationDisplay = computed(() => {
  const sec = durationSeconds.value ? Number(durationSeconds.value) : 0
  const s = Math.max(0, sec | 0)
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

const caseIdDisplay = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.caseNumber || ''
})

const scriptNameDisplay = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.caseModel || c.custInfo.templateName
})

const sexData = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.custSex || ''
})

const voiceNameDisplay = computed(() => {
  const c = props.conversation || {}
  return c.voiceCode || ''
})

const currentAmount = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.cardNo || ''
})

const billAmount = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.daysDelinquent || ''
})

const minAmountDisplay = computed(() => {
  const c = props.conversation || {}
  return c.custInfo.minAmount || ''
})

const displayMessages = computed(() => {
  const base = simMessages.value && simMessages.value.length
    ? simMessages.value
    : ((props.conversation && props.conversation.messages) || [])
  return base
})

const custInfo = computed(() => {
  const c = props.conversation || {}
  return c.custInfo || {}
})

const stationId = computed(() => globalOwlInfo.stationId)
const isCallIn = computed(() => globalCallInfo.isCallIn)
const isListen = computed(() => globalCallInfo.isListen)

const isGlobalLocked = computed(() => {
  const active = globalCallInfo.isListen || globalCallInfo.isCallIn
  const lockedId = globalCallInfo.id
  const curId = (props.conversation && props.conversation.id) || ''
  return !!active && !!lockedId && lockedId !== curId
})

const showIcon = computed(() => globalCallInfo.showIcon)

const showEndWithIcon = computed(() => {
  const c = props.conversation || {}
  if (c.custInfo && c.custInfo.endWith) {
    return true
  }
  return false
})

const showHangUpLabel = computed(() => {
  const c = props.conversation || {}
  const customLabelList = ['CUSTOMER_CLOSE', 'REQUEST_INTERVENE_CUSTOMER']
  const agentLabelList = ['REQUEST_INTERVENE_AGENT']
  const hangupLabelList = ['REQUEST_INTERVENE']

  if (c.custInfo && c.custInfo.endWith && customLabelList.includes(c.custInfo.endWith)) {
    return '客户挂机，通话结束'
  }

  if (c.custInfo && c.custInfo.endWith && agentLabelList.includes(c.custInfo.endWith)) {
    return '坐席挂机，通话结束'
  }

  if (c.custInfo && c.custInfo.endWith && hangupLabelList.includes(c.custInfo.endWith)) {
    return '接管后挂机，通话结束'
  }

  return 'AI挂机，通话结束'
})

// --- Methods ---

function extractParts(item) {
  if (!item) return []
  if (Array.isArray(item.parts)) {
    return item.parts.map((p) => ({ type: p.type === 'user' ? 'user' : 'agent', content: p.content }))
  }
  const parts = []
  if (item.script) parts.push({ type: 'agent', content: item.script })
  if (item.userScript) parts.push({ type: 'user', content: item.userScript })
  return parts
}

function normalizePartsToMessages(item, startIndex){
  const parts = extractParts(item)
  const begin = Math.max(0, startIndex | 0)
  const slice = parts.slice(begin)
  const baseId = item && item.id ? String(item.id) : String(Math.random()) // 修复这里：添加冒号和正确的逻辑
  return slice.map((p, idx) => {
    return {
      id: `${baseId}-${begin + idx}-${p.type === 'user' ? 'u' : 'a'}`,
      sender: p.type === 'user' ? 'user' : 'agent',
      content: p.content
    }
  })
}

function toggleMoreDetails() {
  showMoreDetails.value = !showMoreDetails.value
}

function handleSave() {
  const callId = props.conversation.id
  const tags = selectedTagIndexes.value.map(item => item.label).join(',')
  const remark = commNote.value ? commNote.value.replace(/[\r\n]/g, '') : ''
  if (tags || remark) {
    updateLabel({
      id: callId,
      humanLabels: tags,
      humanDesc: remark
    }, {
      Authentication: props.info.sToken,
      appId: props.info.appId
    })
      .then((res) => {
        if (res.data.status == 0) {
          ElMessage.success('保存成功')
        } else {
          ElMessage.error(res.data.msg)
        }
      })
      .catch((e) => {
        ElMessage.error(e.msg)
      })
      .finally(() => {})
  } else {
    ElMessage.error('参数不能为空')
  }
}

// Transition Hooks
function beforeEnter(el) {
  el.style.height = '0'
  el.style.opacity = '0.001'
  el.style.overflow = 'hidden'
}

function enter(el) {
  const h = el.scrollHeight
  el.style.transition = 'height 0.25s ease, opacity 0.25s ease'
  requestAnimationFrame(() => {
    el.style.height = h + 'px'
    el.style.opacity = '1'
  })
}

function afterEnter(el) {
  el.style.height = 'auto'
  el.style.overflow = ''
  el.style.transition = ''
}

function beforeLeave(el) {
  el.style.height = el.scrollHeight + 'px'
  el.style.opacity = '1'
  el.style.overflow = 'hidden'
}

function leave(el) {
  el.style.transition = 'height 0.25s ease, opacity 0.25s ease'
  requestAnimationFrame(() => {
    el.style.height = '0'
    el.style.opacity = '0.001'
  })
}

function afterLeave(el) {
  el.style.height = ''
  el.style.opacity = ''
  el.style.overflow = ''
  el.style.transition = ''
}

function callOut() {
  if (catOutDisable.value) {
    return ElMessage.error('正在接通中，请稍后再尝试！')
  }
  ElMessageBox.confirm(`${oprateStatus.value == 'call' ? '是否确认挂断？' : '是否取消监听？'}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    resetButtonDisabled()
    const curId = (props.conversation && props.conversation.id) || ''
    emit('hangup-request', curId)
    showDel.value = false
    killStatus.value = ''
    emit('change-status', null)
    mutations.setHangUpNoWebRtc(Math.random())
  })
}

function isButtonDisabled(type) {
  return !!disabledButtons.value[type] || isGlobalLocked.value
}

function handleMuteAudio() {
  console.log("handleUnmuteAudio 1")
  mutations.setHandleRtcMuteAudio(Math.random())
  muteAudioStatus.value = false
  ElMessage.success('静音成功！')
}

function handleUnmuteAudio() {
  console.log("handleUnmuteAudio 2")
  mutations.setHandleRtcUnmuteAudio(Math.random())
  muteAudioStatus.value = true
  ElMessage.success('取消静音成功！')
}

function toggleCall(callType) {
  console.log("callType ---->>>>>", callType)
  if (btnStatusAll.value == props.conversation.id) {
    // Current conversation
  } else {
    if (btnStatusAll.value) {
      return ElMessage.error("已有正在操作用户！")
    }
  }

  if (activeCallType.value == 'call' && callType == 'hangup') {
    console.log("不能点击")
    return
  }

  oprateStatus.value = callType
  const custInfoData = props.conversation.custInfo
  const webRtcStatus = localStorage.getItem("useWebrtc") || ''
  console.log("webRtcStatus ====>>>>", webRtcStatus)
  if (webRtcStatus == 'Y') {
    btnMuteAudioStatus.value = true
  }

  if (callType === 'call') {
    ElMessageBox.confirm(`是否确认接管`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      referSeat({
        callId: props.conversation.id,
        extId: stationId.value,
        bizType: props.info.bizType,
        caseNumber: custInfoData.caseNumber,
        fileId: custInfoData.fileId,
        sessionId: custInfoData.sessionId ? custInfoData.sessionId : '',
        seatId: sessionStorage.getItem("userName"),
        fieldOne: custInfoData.fieldOne || '',
        fieldTwo: custInfoData.fieldTwo || '',
        fieldThree: custInfoData.fieldThree || '',
        fieldFour: custInfoData.fieldFour || ''
      }, {
        Authentication: props.info.sToken,
        Authorization: localStorage.getItem("TOKEN") || '',
        appId: props.info.appId
      }).then((res) => {
        if (res.data.status == 0) {
          ElMessage.success('接管成功')
          mutations.setIsCallIn(true)
          mutations.setIsListen(false)
          mutations.setId((props.conversation && props.conversation.id) || '')
          mutations.setJlxCallId((props.conversation && props.conversation.id) || '')
          disabledButtons.value['call'] = true
          activeCallType.value = 'call'
          killStatus.value = 'killCallStatus'
          showDel.value = true
          emit('change-status', (props.conversation && props.conversation.id) || '')
          catOutDisable.value = true
          mutations.setChangID(props.conversation && props.conversation.id)
          setTimeout(() => {
            catOutDisable.value = false
          }, 5000)
        } else {
          ElMessage.error(res.data.msg)
        }
      }).catch((e) => { ElMessage.error(e.msg) })
    })
  } else {
    listenSeat({
      callId: props.conversation.id,
      extId: stationId.value,
      bizType: props.info.bizType,
      caseNumber: custInfoData.caseNumber,
      fileId: custInfoData.fileId,
      sessionId: custInfoData.sessionId ? custInfoData.sessionId : '',
      seatId: sessionStorage.getItem("userName"),
      fieldOne: custInfoData.fieldOne || '',
      fieldTwo: custInfoData.fieldTwo || '',
      fieldThree: custInfoData.fieldThree || '',
      fieldFour: custInfoData.fieldFour || ''
    }, {
      Authentication: props.info.sToken,
      appId: props.info.appId
    }).then((res) => {
      if (res.data.status == 0) {
        ElMessage.success('监听成功')
        mutations.setIsListen(true)
        mutations.setIsCallIn(false)
        mutations.setId((props.conversation && props.conversation.id) || '')
        mutations.setJlxCallId((props.conversation && props.conversation.id) || '')
        disabledButtons.value['hangup'] = true
        activeCallType.value = 'hangup'
        killStatus.value = 'killHangupStatus'
        showDel.value = true
        emit('change-status', (props.conversation && props.conversation.id) || '')
        catOutDisable.value = true
        setTimeout(() => {
          catOutDisable.value = false
        }, 5000)
        mutations.setChangID(props.conversation && props.conversation.id)
      } else {
        ElMessage.error(res.data.msg)
        activeCallType.value = ''
        killStatus.value = ''
      }
    }).catch((e) => {
      activeCallType.value = ''
      killStatus.value = ''
      ElMessage.error(e.msg)
    })
  }
}

function changeDanger() {
  if (props.conversation && props.conversation.name == '王五') {
    // Note: Mutating props directly is an anti-pattern in Vue.
    // However, the original code did this via $set.
    // In Vue 3, objects are proxies, so we can mutate properties if the object is reactive.
    props.conversation.flag = 'normal'
  }
}

function buttonClass(type) {
  return activeCallType.value === type
    ? 'action-button primary'
    : 'action-button secondary-blue'
}

function resetButtonDisabled() {
  disabledButtons.value['call'] = false
  disabledButtons.value['hangup'] = false
  activeCallType.value = ''
}

function likeMessage(messageId) {
  emit('like-message', messageId)
}

function dislikeMessage(messageId) {
  emit('dislike-message', messageId)
}

function scrollToBottom() {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight
  }
}

function normalizeMsgItem(item) {
  return normalizePartsToMessages(item, 0)
}

function normalizeMsgList(msgList) {
  if (!Array.isArray(msgList)) return []
  return msgList.reduce((acc, it) => acc.concat(normalizeMsgItem(it)), [])
}

function enqueueNewItems(items) {
  if (!Array.isArray(items) || !items.length) return
  items.forEach(it => {
    if (!it || !it.id) return
    const prevCount = renderedPartCounts.value[it.id] || 0
    const parts = extractParts(it)
    const nextCount = parts.length
    if (nextCount > prevCount) {
      const normNew = normalizePartsToMessages(it, prevCount)
      pendingQueue.value.push(...normNew)
      renderedPartCounts.value[it.id] = nextCount
    }
  })
  if (pendingQueue.value.length) startDrain()
}

function startDurationFromFirstMessage() {
  stopDuration()

  const raw = ((props.conversation && props.conversation.msgList) || [])
  const first = Array.isArray(raw) && raw.length ? raw[0] : null
  const startAt = parseDateTime(first && first.createBy)
  const startMs = startAt ? startAt.getTime() : Date.now()

  if (props.conversation && props.conversation.isCleared) {
    durationSeconds.value = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
    return
  }
  durationSeconds.value = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  durationTimer.value = setInterval(() => {
    if (props.conversation && props.conversation.isCleared) {
      stopDrain()
      return
    }
    const now = Date.now()
    durationSeconds.value = Math.max(0, Math.floor((now - startMs) / 1000))
  }, 1000)
}

function stopDuration() {
  if (durationTimer.value) {
    clearInterval(durationTimer.value)
    durationTimer.value = null
  }
}

function parseDateTime(str) {
  if (!str || typeof str !== 'string') return null
  const [datePart, timePart] = str.split(' ')
  if (!datePart || !timePart) return null
  const [y, m, d] = datePart.split('-').map(n => Number(n))
  const [hh, mm, ss] = timePart.split(':').map(n => Number(n))
  if ([y, m, d, hh, mm, ss].some(n => Number.isNaN(n))) return null
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0)
}

function startDrain() {
  if (draining.value) return
  draining.value = true
  drainNext()
}

function stopDrain() {
  if (drainTimer.value) {
    clearTimeout(drainTimer.value)
    drainTimer.value = null
  }
  Object.keys(typeTimers.value).forEach(k => {
    const t = typeTimers.value[k]
    if (t) clearInterval(t)
  })
  typeTimers.value = {}
  isTypingIndicator.value = false
  draining.value = false
}

function drainNext() {
  if (!pendingQueue.value.length) {
    draining.value = false
    return
  }
  const next = pendingQueue.value.shift()
  const willType = next && next.sender === 'agent' && !renderedMsgIds.value[next.id]
  isTypingIndicator.value = !!willType
  const delay = willType ? typingDelayMs.value : 0
  drainTimer.value = setTimeout(() => {
    isTypingIndicator.value = false
    const msg = Object.assign({}, next, { renderedContent: willType ? '' : next.content, typing: willType })
    simMessages.value.push(msg)
    nextTick(() => {
      scrollToBottom()
      if (willType) {
        startTypewriter(msg)
      } else {
        renderedMsgIds.value[msg.id] = true
        drainTimer.value = setTimeout(() => drainNext(), drainIntervalMs.value)
      }
    })
  }, delay)
}

function startTypewriter(msg) {
  const total = (msg.content || '').length
  let i = 0
  const id = msg.id
  const timer = setInterval(() => {
    if (i >= total) {
      clearInterval(timer)
      typeTimers.value[id] = null
      msg.typing = false
      msg.renderedContent = msg.content
      renderedMsgIds.value[id] = true
      nextTick(() => {
        scrollToBottom()
        drainTimer.value = setTimeout(() => drainNext(), drainIntervalMs.value)
      })
      return
    }
    msg.renderedContent += msg.content[i]
    i += 1
    nextTick(scrollToBottom)
  }, typewriterSpeedMs.value)
  typeTimers.value[id] = timer
}

function syncInitial() {
  const raw = ((props.conversation && props.conversation.messages) || [])
  const normalized = normalizeMsgList(raw)
  simMessages.value = []
  pendingQueue.value = normalized.slice()
  const counts = {}
  raw.forEach((it) => {
    if (it && it.id) counts[it.id] = extractParts(it).length
  })
  renderedPartCounts.value = counts
  currentConversationId.value = (props.conversation && props.conversation.caseId) || 'default'
  renderedMsgIds.value = {}
  startDrain()
  startDurationFromFirstMessage()
}

async function setFloatingFields(val) {
  const newIsBizType = !(val && val.split('_')[1] && ['CSM', 'HCS'].includes(val.split('_')[1]))
  custInfoList.value = newIsBizType ? HCSColJson : colJson
}

function isTagSelected(i) {
  return selectedTagIndexes.value.indexOf(i) !== -1
}

function toggleTag(i) {
  const pos = selectedTagIndexes.value.indexOf(i)
  if (pos !== -1) {
    selectedTagIndexes.value.splice(pos, 1)
  } else {
    if (selectedTagIndexes.value.length >= 3) {
      ElMessage.warning('最多选择3个标签')
      return
    }
    selectedTagIndexes.value.push(i)
  }
}

function handleCopy(text) {
  if (!text) return
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  ElMessage.success('复制成功')
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    const caseInfoEl = caseInfo.value
    const textareaEl = commTextarea.value
    if (caseInfoEl && textareaEl) {
      const caseRect = caseInfoEl.getBoundingClientRect()
      const textRect = textareaEl.getBoundingClientRect()
      const maxAllowedHeight = textRect.bottom - caseRect.bottom - 400
      if (maxAllowedHeight > 50) {
        textareaHeight.value = maxAllowedHeight
      }
    }
  } else {
    textareaHeight.value = 50
  }
}

// --- Watchers ---

watch(() => props.conversation.messages, (val) => {
  const list = Array.isArray(val) ? val : []
  enqueueNewItems(list)
}, { deep: true })

watch(() => props.conversation, (val) => {
  const newId = (val && val.caseId) || 'default'
  if (newId !== currentConversationId.value) {
    stopDrain()
    stopDuration()
    pendingQueue.value = []
    renderedPartCounts.value = {}
    syncInitial()
  } else {
    const list = Array.isArray(val && val.messages) ? val.messages : []
    enqueueNewItems(list)
  }
})

watch(simMessages, () => {
  nextTick(scrollToBottom)
})

watch(() => props.bizType, (val) => {
  setFloatingFields(val)
})

watch(isCallIn, (newVal) => {
  if (!newVal && !isListen.value) {
    resetButtonDisabled()
  }
})

watch(isListen, (newVal) => {
  if (!newVal && !isCallIn.value) {
    resetButtonDisabled()
  }
})

watch(() => props.btnStatus, (val) => {
  console.log("btnStatus   watch ---->>>>", val)
  btnStatusAll.value = val
})

</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 4px;
  /* box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); */
  height: calc(100vh - 162px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  /* border: 1px solid #ebeef5; */
  /* padding-top: 32px; 顶部留出空间给钉住图标 */
}

/* 动态边框色 */
.chat-panel--danger {
  /* border-top: 4px solid #f56c6c; */
}

.chat-panel--yellow {
  /* border-top: 4px solid #e6a23c; */
}

.chat-panel--info {
  /* border-top: 4px solid #409eff; */
}

/* 激活态脉冲效果 */
.active-pulse {
  /* box-shadow: 0 0 12px rgba(64, 158, 255, 0.4); */
  /* border-color: #409eff; */
  z-index: 2;
}

.panel-container-header {
  padding: 12px 12px 0 12px;
}

/* 钉住图标：右上角 */
.pin-action {
  position: absolute;
  top: 10px;
  right: 12px;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  z-index: 10;
  transition: all 0.2s;
}

.pin-action:hover {
  color: #409eff;
  transform: scale(1.1);
}

.pin-action.pinned {
  color: #f56c6c;
}

.pin-svg {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

/* 头部用户信息 */
.panel-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #ebeef5;
}

.panel-header--danger {
  background: #fff2f2;
  border-color: #ffdedf;
}

.panel-header--yellow {
  background: #fdf6ec;
  border-color: #faecd8;
}

.panel-header--info {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.name-col {
  display: flex;
  align-items: center;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  margin-right: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar--danger {
  background: linear-gradient(135deg, #f78989, #f56c6c);
}

.avatar--yellow {
  background: linear-gradient(135deg, #f3d19e, #e6a23c);
}

.avatar--info {
  background: linear-gradient(135deg, #79bbff, #409eff);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.name-row {
  display: flex;
  align-items: baseline;
}

.name {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.font--color--info {
  color: #409eff;
}

.font--color--yellow {
  color: #e6a23c;
}

.font--color--danger {
  color: #f56c6c;
}

.salutation {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.font--color--info--title {
  color: #a0cfff;
}

.font--color--yellow--title {
  color: #f3d19e;
}

.font--color--danger--title {
  color: #fab6b6;
}

.panel-header-labels {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.timer-pill {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  color: #606266;
  font-weight: 600;
  margin-right: 6px;
}

.status-pill {
  font-size: 12px;
  color: #909399;
}

/* 案件信息：左右两列 */
.case-info {
  display: flex;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 2px;
  font-size: 12px;
  color: #606266;
  justify-content: space-between;
  line-height: 1.8;
}

.info-left,
.info-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.info-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label {
  color: #909399;
  flex-shrink: 0;
}

.value {
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 4px;
}

.copy-icon {
  cursor: pointer;
  color: #409eff;
  margin-left: 4px;
}

.copy-icon:hover {
  color: #66b1ff;
}

/* 查看更多 */
.more-toggle {
  text-align: center;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  padding: 4px 0;
  user-select: none;
  background: #fcfcfc;
  border-top: 1px solid #ebeef5;
}

.more-toggle:hover {
  background: #f0f7ff;
}

/* 手风琴详情 */
.more-details {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 0 10px;
  /* 初始 padding 由 transition 处理，或者在 active class 中加 */
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  /* transition 由 Vue <transition> 控制 */
}

.grid {
  display: grid;
  gap: 8px 16px;
  padding: 8px 0;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-item {
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* 聊天区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #ffffff;
  position: relative;
  /* 隐藏滚动条 */
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* 隐藏滚动条 Chrome, Safari and Opera */
.chat-messages::-webkit-scrollbar {
  display: none;
}

.message {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message--agent {
  flex-direction: row;
}

.message--user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message--agent .message-avatar {
  background: #409eff;
  margin-right: 8px;
}

.message--user .message-avatar {
  background: #67c23a;
  margin-left: 8px;
}

.message-bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message--agent .message-bubble {
  background: #f0f2f5;
  color: #303133;
  border-top-left-radius: 0;
}

.message--user .message-bubble {
  background: #e1f3d8;
  color: #303133;
  border-top-right-radius: 0;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #303133;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}

@keyframes blink {

  from,
  to {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* 正在输入指示器 */
.typing-indicator-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.agent-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 8px;
}

.typing-bubble {
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 8px;
  border-top-left-radius: 0;
  display: flex;
  align-items: center;
}

.typing-indicator .dots {
  display: flex;
  align-items: center;
}

.typing-indicator .dots i {
  width: 6px;
  height: 6px;
  background: #909399;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator .dots i:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator .dots i:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

/* 底部操作区 */
.panel-footer {
  border-top: 1px solid #ebeef5;
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.status-info-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-info-item-header {
  font-size: 13px;
  color: #606266;
}

.save-btn {
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.save-btn:hover {
  text-decoration: underline;
}

/* 人工标签 */
.tag-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.tag-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  flex-shrink: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #dcdfe6;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  border-color: #c6e2ff;
  color: #409eff;
}

.tag.active {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* 沟通备注 */
.communication-section {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.comm-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  flex-shrink: 0;
}

.textarea-wrapper {
  position: relative;
  flex: 1;
}

.expand-btn {
  position: absolute;
  right: 8px;
  top: -24px;
  /* 位于备注上方 */
  cursor: pointer;
  color: #909399;
  padding: 4px;
  font-size: 14px;
  z-index: 5;
}

.expand-btn:hover {
  color: #409eff;
}

.comm-textarea {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  color: #303133;
  resize: none;
  /* 禁用手动调整，由 JS 控制 */
  outline: none;
  transition: border-color 0.2s, height 0.3s ease;
  height: 50px;
  /* 默认高度 */
}

.comm-textarea:focus {
  border-color: #409eff;
}

.char-count {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 10px;
  color: #c0c4cc;
}

/* 按钮组 */
.footer-content {
  display: flex;
  flex-direction: column;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.action-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  margin-left: 8px;
}

.action-button.primary {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.action-button.primary:hover {
  background: #66b1ff;
}

.action-button.secondary-blue {
  background: #ecf5ff;
  color: #409eff;
  border-color: #d9ecff;
}

.action-button.secondary-blue:hover {
  background: #d9ecff;
}

.action-button.danger {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}

.action-button.danger:hover {
  background: #f78989;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* iOS Segmented Control 风格按钮 */
.ios-segmented-control {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12px;
  /* background-color: #7676801f; */
  /* border-radius: 8px; */
  /* padding: 2px; */
}

.ios-btn-wrapper {
  /* flex: 1; */
  display: flex;
  justify-content: center;
  position: relative;
  width: 140px;
  gap: 8px;
}

.left-btn {
  justify-content: flex-start;
}

.right-btn {
  justify-content: flex-end;
  width: 210px;
}

.full-width {
  width: 100%;
}

.ios-btn {
  width: 100%;
  border: none;
  background: transparent;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #000;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  background-color: #409eff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.ios-btn:hover {
  /* background-color: rgba(0, 0, 0, 0.04); */
  opacity: 0.8;
}

.ios-btn.active {
  background-color: #fff;
  color: #409eff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border: 1px solid #409eff;
}

.ios-btn.destructive {
  color: #fff;
  background-color: #ff3b30;
}

.ios-btn.destructive:hover {
  background-color: #ff3b30;
  opacity: 0.8;
}

.ios-btn.destructive-mute {
  color: #fff;
  background-color: #e6a23c;
}

.ios-btn.destructive-mute:hover {
  background-color: #e6a23c;
  opacity: 0.8;
}

.btn-text {
  position: relative;
  z-index: 2;
}

/* 标签样式调整 */
.labels {
  display: flex;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
}

.label-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 4px;
  border: 1px solid;
}

.label-tag.danger {
  color: #f56c6c;
  background: #fef0f0;
  border-color: #fde2e2;
}

.label-tag.warning {
  color: #e6a23c;
  background: #fdf6ec;
  border-color: #faecd8;
}

.end-with-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.end-with-line {
  height: 1px;
  width: 100px;
  background-color: #e2e2e2;
}

.end-with-text {
  font-size: 12px;
  color: #999;
  margin: 0 10px;
}
</style>
