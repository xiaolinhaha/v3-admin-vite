<template>
   <div class="chat-board">
      <div class="board-header">
         <div class="name-nav">
            <el-tooltip placement="bottom">
               <template #content>
                  <div class="contentData" v-html="tooltipData"></div>
               </template>
               <div class="left-name-nav">
                  <div class="el-icon-s-custom-icon">
                  <el-icon><Link /></el-icon>
                  </div>
                  <span class="nav-label">外呼队列</span>
               </div>
            </el-tooltip>
            <div
               class="chips-container"
               :class="{
                  'show-mask-left': showScrollLeft,
                  'show-mask-right': showScrollRight,
               }"
            >
               <div
                  class="scroll-arrow left"
                  v-show="showScrollLeft"
                  @click="scrollChips('left')"
               >
                  <el-icon><ArrowLeft /></el-icon>
               </div>
               <div class="chips-list" ref="chipsList" @scroll="onChipsScroll">
                  <transition-group name="chip-fade" tag="div" class="chips">
                     <div
                        v-for="c in eventTypeNoConversations"
                        :key="c.id"
                        class="chip"
                        :class="[
                           c.flag === 'yellow'
                              ? 'chip--warning'
                              : c.flag === 'danger'
                              ? 'chip--info'
                              : 'chip--danger',
                           activeTab === c.id ? 'active' : '',
                        ]"
                        @click="() => handleTabClick(c.id)"
                     >
                        {{ c.name }}
                        <i v-if="pinnedList.includes(c.id)" class="pinned-badge"></i>
                     </div>
                  </transition-group>
                  <!-- 当存在 eventType 的会话时，展示其名称（循环） -->
                  <div v-if="hasEventType" class="chips" :style="'margin-left: 8px'">
                     <transition-group name="chip-fade" tag="div" class="chips">
                        <div
                           v-for="c in eventTypeConversations"
                           :key="c.id"
                           class="chip chip--default"
                        >
                           {{ c.name }}
                           <i v-if="pinnedList.includes(c.id)" class="pinned-badge"></i>
                        </div>
                     </transition-group>
                  </div>
               </div>
               <div
                  class="scroll-arrow right"
                  v-show="showScrollRight"
                  @click="scrollChips('right')"
               >
                  <el-icon><ArrowRight /></el-icon>
               </div>
            </div>
         </div>
         <!-- 右侧：软电话签入图标（全局唯一） -->
          <div class="board-actions-stop">
            <el-tooltip content="并发量" placement="top">
               <el-select
                  filterable
                  v-model="localDefaultStopNum"
                  @change="changeStopNumData"
                  size="small"
                  placeholder="请选择并发量"
                  :disabled="stopMaxNum == 0"
                  class="biztype-select"
               >
                  <el-option
                     v-for="(i, index) in (stopMaxNum + 1)"
                     :label="index"
                     :value="index"
                     :key="i"
                  ></el-option>
               </el-select>
            </el-tooltip>
            <!-- <div class="softphone-signin" :class="softSignedIn ? 'signed' : ''" @click="signInSoftphone">
                                   <i class="el-icon-phone"></i>
                           </div> -->
         </div>
         <div class="board-actions">
            <el-tooltip content="业务场景" placement="top">
            <el-select
               clearable
               filterable
               v-model="info.bizType"
               @change="biztypeSession"
               size="mini"
               placeholder="请选择业务场景"
               :disabled="callType !== 'logout'"
               class="biztype-select"
            >
               <el-option
                  v-for="(bVal, bKey) in bizTypes"
                  :label="bVal"
                  :value="bKey"
                  :key="bKey"
               ></el-option>
            </el-select>
            </el-tooltip>
            <OwlPhone />
         </div>
      </div>
      <!-- 有 eventType 时隐藏下方面板区 -->
      <div class="panels-wrapper" ref="panelsWrapper">
         <div class="panels">
            <transition-group name="panel-slide" tag="div" class="panels-inner">
               <div
                  v-for="c in conversations"
                  :key="c.id"
                  v-if="c?.eventType != 'NEW'"
                  class="panel-wrapper"
               >
                  <div
                  class="panel-item"
                  :ref="(el) => setPanelRef(el, c.id)"
                  :class="{ 'active-panel': activeTab === c.id }"
                  :style="getPanelStyle(c)"
                  @click="handlePanelClick(c.id)"
               >
                     <chat-panel
                        :conversation="c"
                        :soft-signed-in="isLogined"
                        :biz-type="info.bizType"
                        :info="info"
                        :btn-status="btnStatus"
                        :is-pinned="pinnedList.includes(c.id)"
                        @hangup-request="() => handleHangupRequest(c && c.id)"
                        @toggle-pin="() => $emit('toggle-pin', { id: c.id })"
                        :label-list="labelList"
                        @change-status="(id) => changeBtnStatus(id)"
                     />
                  </div>
               </div>
            </transition-group>
         </div>
      </div>
   </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUpdated, nextTick, watch } from 'vue';
import ChatPanel from "./ChatPanel.vue";
import OwlPhone from "../OwlPhoneComponent.vue";
import { useOwl } from "../composables/useOwl";
import { ElMessage as message } from "element-plus";
import { updateUserLineNum } from '@/common/apis/intelligent-customer-inner';

const props = defineProps({
   conversations: { type: Array, default: () => [] },
   info: { type: Object, default: () => ({ bizType: "" }) },
   bizTypes: { type: Object, default: () => ({}) },
   callType: { type: String, default: "logout" },
   biztypeSession: { type: Function, default: () => {} },
   pinnedList: { type: Array, default: () => [] },
   labelList: { type: Array, default: () => [] },
   btnStatus: { type: String, default: "" },
   stopMaxNum: { type: Number, default: 100 },
   defaultStopNum: { type: Number, default: 100 },
   tooltipTitle: { type: String, default: "" },
});

const emit = defineEmits(['toggle-pin', 'remove-conversation', 'change-status', 'get-max-num']);

const { isLogined } = useOwl();

const activeTab = ref("");
const showDefaultChips = ref(true);
const showScrollLeft = ref(false);
const showScrollRight = ref(false);

const localDefaultStopNum = ref(props.defaultStopNum);

watch(() => props.defaultStopNum, (val) => {
   localDefaultStopNum.value = val;
});

const chipsList = ref(null);
const panelsWrapper = ref(null);

// Dynamic refs for panels
const panelRefs = ref({});

const setPanelRef = (el, id) => {
   if (el) {
      panelRefs.value[`panel-${id}`] = el;
   }
};

// --- Computed ---
const hasEventType = computed(() => {
   return (
      Array.isArray(props.conversations) &&
      props.conversations.some((c) => c && c.eventType && c.eventType == "NEW")
   );
});

const tootipData = computed(() => {
   const tipText = props.tooltipTitle && props.tooltipTitle != '' ? (props.tooltipTitle.split('\n').map(item => {
      if(item){
         return `<div style="margin-top: 4px;">${item}<div>`
      }
   }).join('')) : ''
   
   return tipText
});

const eventTypeConversations = computed(() => {
   if (!Array.isArray(props.conversations)) return [];
   
   const pinned = [];
   const unpinned = [];
   
   props.conversations.forEach((c) => {
      if (c && c.eventType && c.eventType == "NEW") {
         if (props.pinnedList.includes(c.id)) {
            pinned.push(c);
         } else {
            unpinned.push(c);
         }
      }
   });
   
   return [...pinned, ...unpinned];
});

const eventTypeNoConversations = computed(() => {
   if (!Array.isArray(props.conversations)) return [];
   
   const pinned = [];
   const unpinned = [];
   
   props.conversations.forEach((c) => {
      if (c && c.eventType && c.eventType !== "NEW") {
         if (props.pinnedList.includes(c.id)) {
            pinned.push(c);
         } else {
            unpinned.push(c);
         }
      }
   });
   
   return [...pinned, ...unpinned];
});

// --- Lifecycle ---
onMounted(() => {
   if (props.conversations.length > 0) {
      activeTab.value = props.conversations[0].id;
   }
   setTimeout(() => {
      showDefaultChips.value = false;
   }, 2000);
   nextTick(() => {
      checkScroll();
      window.addEventListener("resize", checkScroll);
   });
});

onBeforeUnmount(() => {
   window.removeEventListener("resize", checkScroll);
});

onUpdated(() => {
   nextTick(() => {
      checkScroll();
   });
});

// --- Methods ---

// const signInSoftphone = () => {
//    // Removed logic as OwlPhone handles it
//    // if (!softSignedIn.value) {
//    //    softSignedIn.value = true;
//    //    message.success("登录签入软电话成功");
//    // }
// };

const handlePanelClick = (id) => {
   activeTab.value = id;
   handleScrollTo(id);
};

const handleTabClick = (id) => {
   activeTab.value = id;
   handleScrollTo(id);
};

const handleScrollTo = (id) => {
   const target = panelRefs.value[`panel-${id}`];
   if (!target) return;
   const container = panelsWrapper.value;
   if (!container) return;
   
   const targetCenter = target.offsetLeft + target.offsetWidth / 2;
   const containerCenter = container.clientWidth / 2;
   let targetScrollLeft = targetCenter - containerCenter;
   const maxScroll = container.scrollWidth - container.clientWidth;
   targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));
   
   smoothScroll(container, targetScrollLeft, 800);
};

const smoothScroll = (element, target, duration) => {
   const start = element.scrollLeft;
   const change = target - start;
   const startTime = performance.now();
   const animateScroll = (currentTime) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease =
         progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      element.scrollLeft = start + change * ease;
      if (timeElapsed < duration) {
         requestAnimationFrame(animateScroll);
      }
   };
   requestAnimationFrame(animateScroll);
};

const handleHangupRequest = () => {
   // emit("remove-conversation", id);
};

const changeBtnStatus = (id) => {
  emit("change-status", id);
};

const onChipsScroll = () => {
   checkScroll();
};

const checkScroll = () => {
   const el = chipsList.value;
   if (!el) return;
   const { scrollLeft, scrollWidth, clientWidth } = el;
   const tolerance = 2;
   showScrollLeft.value = scrollLeft > tolerance;
   showScrollRight.value = scrollWidth - clientWidth - scrollLeft > tolerance;
};

const scrollChips = (direction) => {
   const el = chipsList.value;
   if (!el) return;
   const scrollAmount = 200;
   const currentScroll = el.scrollLeft;
   el.scrollTo({
      left:
         direction === "left"
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount,
      behavior: "smooth",
   });
};

const getPanelStyle = (c) => {
   let rgb = "245, 108, 108";
   if (c && c.flag === "yellow") {
      rgb = "230, 162, 60";
   } else if (c && c.flag === "danger") {
      rgb = "64, 158, 255";
   }
   return {
      "--strobe-color": `rgb(${rgb})`,
      "--strobe-shadow-start": `rgba(${rgb}, 0.2)`,
      "--strobe-shadow-peak": `rgba(${rgb}, 0.6)`,
      border: `1px solid ${
         c.flag === "yellow"
            ? "#e6a23c"
            : c.flag === "danger"
            ? "#409eff"
            : "#f56c6c"
      }`,
   };
};

const changeStopNumData = async (val) => {
   if(props.info.bizType) {
      const res = await updateUserLineNum({
         lineNum: val,
         bizType: props.info.bizType,
         seatId: ''
      }, {
         Authorization: localStorage.getItem('TOKEN') || ''
      })
      if(res && res.status == 0){
         emit('get-max-num')
         message.success("修改并发量成功");
      }
   }
};
</script>
<style scoped>
.chat-board {
   display: flex;
   flex-direction: column;
   overflow: hidden;
   margin-top: 4px;
   /* height: calc(100vh - 112px); */
   /* 定义全局默认变量，防止未选中时无定义（虽然 active 才会用到） */
   --strobe-color: #409eff;
   --strobe-shadow-start: rgba(64, 158, 255, 0.2);
   --strobe-shadow-peak: rgba(64, 158, 255, 0.6);
}
.board-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   height: 46px;
   background: #ffffff;
   border-bottom: 1px solid #ebeef5;
   box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
   border-radius: 4px;
}
.name-nav {
   display: flex;
   align-items: center;
   flex: 1;
   min-width: 0;
}
.nav-label {
   font-weight: 600;
   color: #303133;
   margin-left: 6px;
   font-size: 16px;
   white-space: nowrap;
}
.chips-container {
   position: relative;
   margin-left: 6px;
   margin-right: 6px;
   flex: 1;
   display: flex;
   align-items: center;
   min-width: 0; /* 防止 flex 子项溢出 */
}
/* 左右渐变遮罩 */
/* .show-mask-left::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(to right, #ffffff, transparent);
        z-index: 1;
        pointer-events: none;
}
.show-mask-right::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(to left, #ffffff, transparent);
        z-index: 1;
        pointer-events: none;
} */
.scroll-arrow {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 24px;
   height: 24px;
   border-radius: 50%;
   background: #f4f4f5;
   color: #909399;
   cursor: pointer;
   transition: all 0.2s;
   z-index: 2;
   flex-shrink: 0;
}
.scroll-arrow:hover {
   background: #e6e8eb;
   color: #606266;
   box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.scroll-arrow.left {
   margin-right: 4px;
}
.scroll-arrow.right {
   margin-left: 4px;
}
.chips-list {
   /* margin-left: 24px; */
   display: flex;
   flex-direction: row;
   align-items: center;
   flex: 1;
   overflow-x: auto;
   overflow-y: hidden;
   -webkit-overflow-scrolling: touch;
   height: 40px;
   /* 隐藏滚动条 */
   -ms-overflow-style: none; /* IE and Edge */
   scrollbar-width: none; /* Firefox */
   scroll-behavior: smooth;
   padding-left: 4px;
}
/* 隐藏滚动条 Chrome, Safari and Opera */
.chips-list::-webkit-scrollbar {
   display: none;
}
.chip-fade-enter-active,
.chip-fade-leave-active {
   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.chip-fade-enter,
.chip-fade-leave-to {
   opacity: 0;
   transform: scale(0.9);
}
.chip-fade-move {
   transition: transform 0.3s;
}
.chips {
   display: flex;
   flex-wrap: nowrap;
   gap: 8px;
   flex-shrink: 0;
   align-items: center;
}
.chip {
   padding: 0 12px;
   border-radius: 4px; /* Pill shape */
   font-weight: 500;
   font-size: 12px;
   line-height: 26px;
   cursor: pointer;
   transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
   display: flex;
   align-items: center;
   justify-content: center;
   user-select: none;
   position: relative;
}
.chip:hover {
   transform: translateY(-1px);
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.chip--danger {
   border: 1px solid #ffdedf;
   background: #fff2f2;
   color: #f56c6c;
}
.chip--warning {
   border: 1px solid #faecd8;
   background: #fdf6ec;
   color: #e6a23c;
}
.chip--default {
   border: 1px solid #e4e7ed;
   background: #f4f4f5;
   color: #a0a0a0;
}
.chip--info {
   border: 1px solid #d9ecff;
   background: #ecf5ff;
   color: #409eff;
}
.chip.active {
   font-weight: 600;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
/* 覆盖各类型激活时的具体颜色，确保选中时视觉明显 */
.chip--danger.active {
   background: #f56c6c;
   color: #ffffff;
   border-color: #f56c6c;
   box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}
.chip--warning.active {
   background: #e6a23c;
   color: #ffffff;
   border-color: #e6a23c;
   box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}
.chip--info.active {
   background: #409eff;
   color: #ffffff;
   border-color: #409eff;
   box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
.chip--default.active {
   background: #606266;
   color: #ffffff;
   border-color: #606266;
   box-shadow: 0 4px 12px rgba(96, 98, 102, 0.3);
}
.pinned-badge {
   position: absolute;
   top: -4px;
   right: -4px;
   width: 8px;
   height: 8px;
   border-radius: 50%;
   background: #f56c6c;
   border: 1px solid #fff;
   box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.left-name-nav {
   display: flex;
   flex-direction: row;
   align-items: center;
   justify-content: center;
}
.panels-wrapper {
   overflow-x: auto;
   overflow-y: hidden;
   padding-top: 4px;
   padding-bottom: 6px;
   border-radius: 4px;
}
/* WebKit 自定义滚动条为“进度条”视觉 */
.panels-wrapper::-webkit-scrollbar {
   display: none;
}
.panels-wrapper::-webkit-scrollbar-track {
   display: none;
}
.panels-wrapper::-webkit-scrollbar-thumb {
   display: none;
}
.panels-wrapper::-webkit-scrollbar-thumb:hover {
   display: none;
}
.panels {
   /* 采用自适应高度，避免遮挡顶部模块 */
   height: auto;
}
.panels-inner {
   display: flex;
   gap: 8px;
}
.panel-wrapper {
   flex-shrink: 0;
}
.panel-item {
   width: 450px;
   transition: box-shadow 0.4s ease, border-color 0.4s ease;
   border-radius: 4px;
   cursor: pointer;
   border: 2px solid transparent; /* 预留边框位置，避免抖动 */
   box-sizing: border-box;
}
.panel-item.active-panel {
   /* 去除位置移动，仅保留阴影和层级提升 */
   border: 2px solid var(--strobe-color) !important; /* 选中时边框常亮，颜色动态变化 */
   z-index: 10;
   position: relative;
   animation: panel-strobe 2s infinite; /* 持续的呼吸/频闪效果 */
}
@keyframes panel-strobe {
   0% {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1),
         0 0 0 0 var(--strobe-shadow-start);
   }
   50% {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1),
         0 0 24px 4px var(--strobe-shadow-peak);
   }
   100% {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1),
         0 0 0 0 var(--strobe-shadow-start);
   }
}
/* 面板列表过渡动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
   transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-enter {
   opacity: 0;
   transform: translateY(30px);
}
.panel-slide-leave-to {
   opacity: 0;
   transform: scale(0.9);
}
.panel-slide-move {
   transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.el-icon-s-custom-icon {
   width: 28px;
   height: 28px;
   border-radius: 8px;
   /* background: linear-gradient(135deg, #399c6c 0%, #19e4a0 100%); */
   background-color: #ffa908;
   display: flex;
   align-items: center;
   justify-content: center;
   color: #fff;
   font-size: 18px;
   box-shadow: 0 4px 12px rgba(3, 131, 88, 0.2);
   margin-left: 6px;
}
.board-actions {
   display: flex;
   align-items: center;
   width: 200px;
}
.board-actions-stop {
   display: flex;
   align-items: center;
   width: 100px;
}
.biztype-select {
   margin-right: 8px;
}
.softphone-signin {
   width: 30px;
   height: 30px;
   border-radius: 50%;
   background: #fff;
   color: #595959;
   border: 1px solid #d9d9d9;
   display: flex;
   align-items: center;
   justify-content: center;
   font-size: 18px;
   cursor: pointer;
}
.softphone-signin.signed {
   background: #5a9cf8;
   color: #fff;
   /* box-shadow: 0 2px 8px rgba(46, 118, 240, 0.35); */
}
.contentData {
   width: 100%;
   display: flex;
   flex-direction: column;

}
</style>

