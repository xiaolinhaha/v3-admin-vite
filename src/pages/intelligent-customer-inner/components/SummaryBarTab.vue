<template>
  <div class="summary-bar">
    <div class="summary-grid">
      <div v-for="item in items" :key="item.key" class="summary-item">
        <img v-if="item.iconUrl" :src="item.iconUrl" class="summary-icon-img" alt="icon" />
        <icon-svg v-if="item.iconName" :icon-class="item.iconName" class="summary-icon-img" />
        <div class="summary-text">
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ format(item.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({
      total: 0,
      done: 0,
      filtered: 0,
      unreachable: 0,
      pendingCall: 0,
      call: 0
    })
  },
  conversations: {
    type: Array,
    default: () => []
  }
})

const items = computed(() => {
  const s = props.summary || {}
  const pendingNum =
    (s.pendingCall || 0) - props.conversations.length > 0
      ? (s.pendingCall || 0) - props.conversations.length
      : 0
  return [
    { key: 'total', label: '总任务', value: s.total || 0, iconName: 'email-1' },
    { key: 'done', label: '已结束任务', value: s.done || 0, iconName: 'email-7' },
    { key: 'filtered', label: '已过滤', value: s.filtered || 0, iconName: 'email-4' },
    { key: 'call', label: '已外呼', value: s.call || 0, iconName: 'email-2' },
    { key: 'noneed', label: '进行中', value: props.conversations.length || 0, iconName: 'email-3' },
    { key: 'unreachable', label: '未接通', value: s.unreachable || 0, iconName: 'email-5' },
    { key: 'pendingCall', label: '待拨打', value: pendingNum || 0, iconName: 'email-6' }
  ]
})

function format(v: any) {
  try {
    return new Intl.NumberFormat().format(v)
  } catch (e) {
    return String(v)
  }
}
</script>

<style scoped>
.summary-bar {
  /* background: #c5dffa5f; */
  /* border-bottom: 1px solid #eee; */
  height: 64px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 6px;
}
.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 4px;
  padding: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.summary-icon {
  font-size: 24px;
  margin-right: 8px;
  color: #7a7a7a;
}
.summary-icon-img {
  width: 48px;
  height: 48px;
  margin-right: 8px;
  display: inline-block;
}
.summary-label {
  color: #666;
  font-size: 13px;
}
.summary-value {
  font-weight: 600;
  font-size: 28px;
  height: 30px;
}
@media (max-width: 900px) {
  .summary-bar {
    padding: 8px 8px;
  }
  .summary-icon-img {
    width: 30px;
    height: 30px;
    margin-right: 8px;
    display: inline-block;
  }
  .summary-item {
    padding: 10px;
  }
  .summary-value {
    font-size: 28px;
  }
}
</style>
