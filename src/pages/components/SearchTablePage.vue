<script setup>
import { ref, useSlots } from "vue"
import { ArrowUp, ArrowDown, Search, Refresh } from "@element-plus/icons-vue"

const props = defineProps({
  searchForm: {
    type: Object,
    required: true
  },
  gridOptions: {
    type: Object,
    required: true
  },
  gridEvents: {
    type: Object,
    default: () => ({})
  },
  showExpand: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(["search", "reset"])

const xGrid = ref()
const searchFormRef = ref()
const isExpand = ref(false)
const slots = useSlots()

// Expose xGrid to parent
defineExpose({
  xGrid,
  searchFormRef
})

const handleSearch = () => {
  xGrid.value?.commitProxy("query")
  emit("search")
}

const handleReset = () => {
  emit("reset")
}
</script>

<template>
  <div class="common-search-table app-container">
    <!-- Search Card -->
    <el-card shadow="never" class="search-wrapper">
      <div class="search-container">
        <el-form :model="searchForm" ref="searchFormRef" inline>
          <el-row :gutter="8">
            <!-- Search Items Slot -->
            <slot name="search-content" :isExpand="isExpand"></slot>
            
            <!-- Search Buttons -->
            <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6" class="search-btns">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
        
        <!-- Expand/Collapse Button -->
        <div class="toggle-btn-container" v-if="showExpand">
          <el-button link type="primary" @click="isExpand = !isExpand">
            {{ isExpand ? '收起' : '展开' }}
            <el-icon class="el-icon--right">
              <ArrowUp v-if="isExpand" />
              <ArrowDown v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Table Card -->
    <el-card shadow="never" class="table-wrapper">
      <vxe-grid ref="xGrid" v-bind="gridOptions" v-on="gridEvents">
        <!-- Forward all slots from parent to vxe-grid -->
        <template v-for="(slot, name) in slots" #[name]="params">
          <!-- Exclude slots that are used by SearchTablePage itself -->
          <slot v-if="name !== 'search-content'" :name="name" v-bind="params" />
        </template>
      </vxe-grid>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
}

.search-wrapper {
  margin-bottom: 8px;
}

.search-container {
  position: relative;
  padding-right: 60px;
}

.toggle-btn-container {
  position: absolute;
  right: 0;
  top: 0;
}

.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

:deep(.el-form-item) {
  margin-bottom: 8px;
}

:deep(.el-card__body) {
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

:deep(.vxe-grid) {
  flex: 1;
  height: 100%;
}
</style>
