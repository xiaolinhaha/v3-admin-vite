<script setup>
import { ref, reactive, onMounted } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import { menuApi } from "@/common/apis/system/menu"
import SvgIcon from "~virtual/svg-component"

defineOptions({
  name: "MenuManagement"
})

// State
const menuList = ref([])
const dragMenuList = ref([])
const svgList = ref([])
const showMain = ref(false)
const newMenu = ref(false)
const showBtn = ref({})
const menuTreeRef = ref()
const menuFormRef = ref()
const perMarkFormRef = ref()

const menuModel = ref({
  menuName: "",
  children: []
})

const perMarkModel = reactive({
  perMarkList: []
})

// Rules
const menuFormRules = reactive({
  menuName: [
    { required: true, message: "菜单名称不能为空", trigger: "blur" },
    { max: 10, message: "菜单名称长度不能超过10个字", trigger: "blur" }
  ],
  menuPath: [{ required: true, message: "页面链接不能为空", trigger: "blur" }],
  routerName: [{ required: true, message: "菜单路由名称不能为空", trigger: "blur" }],
  isVisible: [{ required: true, message: "菜单可见性不能为空", trigger: "change" }],
  menuPermission: [{ required: true, message: "页面权限不能为空", trigger: "blur" }]
})

const perMarkFormRules = reactive({
  markName: [{ required: true, message: "权限名称不能为空", trigger: "blur" }],
  markCode: [{ required: true, message: "权限代码不能为空", trigger: "blur" }]
})

// Methods
const getSvgList = () => {
  const modules = import.meta.glob("@/assets/icons/*.svg")
  svgList.value = Object.keys(modules).map((key) => {
    const name = key.split("/").pop()?.replace(".svg", "")
    return name || ""
  }).filter(Boolean)
}

const initData = () => {
  menuApi.getAllMenu({}).then((res) => {
    newMenu.value = false
    const content = res.content || []
    // Wrap in a root node as per original logic
    menuList.value = [
      {
        id: 0,
        menuName: "菜单管理",
        children: content
      }
    ]
  })
}

const initPermissionMark = () => {
  if (!menuModel.value.id) return
  menuApi.getPermissionMark({ menuId: menuModel.value.id }).then((res) => {
    perMarkModel.perMarkList = res.content || []
  })
}

const nodeClick = (data, node) => {
  // Clear validation
  menuFormRef.value?.clearValidate()
  
  menuModel.value = data
  perMarkModel.perMarkList = []

  // Original logic: isNull(parentMenuId) && !new -> showMain = false
  // Root node (id:0) has no parentMenuId usually (or undefined)
  if ((!menuModel.value.parentMenuId && menuModel.value.parentMenuId !== 0) && !data.new && data.id !== 0) {
     showMain.value = false
  } else {
    showMain.value = true
    // Load permissions only for leaf nodes?
    // Original: !isEmpty(id) && children.length === 0
    if (menuModel.value.id && (!menuModel.value.children || menuModel.value.children.length === 0)) {
      initPermissionMark()
    }
  }

  // Handle root node specifically if needed
  if (data.id === 0) {
    showMain.value = false
  }

  showBtn.value = {}
  if (data.id || data.id === 0) {
    showBtn.value[data.id] = true
  }
}

const addNodeItem = (data) => {
  if (data.id || data.id === 0) {
    const menuLevel = data.menuLevel ? Number(data.menuLevel) + 1 : 1
    const addNode = {
      menuName: `***新加的${menuLevel}级菜单,请修改***`,
      parentMenuId: data.id,
      menuLevel: menuLevel,
      menuIcon: "",
      isVisible: "1",
      children: [],
      new: true
    }
    if (!data.children) {
      data.children = []
    }
    data.children.push(addNode)
    newMenu.value = true
  }
}

const addFirstLevelMenu = () => {
  const obj = {
    menuName: "***新加的1级菜单,请修改***",
    parentMenuId: 0,
    menuLevel: 1,
    isVisible: "1",
    menuIcon: "",
    children: [],
    new: true
  }
  newMenu.value = true
  // Push to root's children if root exists
  if (menuList.value.length > 0 && menuList.value[0].children) {
    menuList.value[0].children.push(obj)
  } else {
    menuList.value.push(obj)
  }
}

const saveOrUpdate = () => {
  if (!menuModel.value.parentMenuId && menuModel.value.parentMenuId !== 0) {
    ElNotification.warning({ title: "提示", message: "请先新增菜单后再进行操作" })
    return
  }
  
  menuFormRef.value?.validate((valid) => {
    if (valid) {
      const isNew = !menuModel.value.id
      const apiCall = isNew ? menuApi.addMenu : menuApi.updateMenu
      
      apiCall(menuModel.value).then((res) => {
        if (res.success) {
          ElMessage.success(isNew ? "新增菜单成功" : "修改菜单成功")
          if (isNew) {
             initData()
             showMain.value = false
          } else {
             initData()
          }
        } else {
          ElMessage.error(res.msg || "操作失败")
        }
      })
      
      savePermissionMark()
    }
  })
}

const savePermissionMark = () => {
  if (perMarkModel.perMarkList.length > 0) {
    menuApi.savePermissionMark(perMarkModel.perMarkList).then((res) => {
      if (res.success) {
        ElMessage.success("按钮权限保存成功")
        initPermissionMark()
      } else {
        ElMessage.error(res.msg || "保存权限失败")
      }
    })
  }
}

const deleteMenu = () => {
  if (!menuModel.value.id && !menuModel.value.new) {
    ElNotification.warning({ title: "提示", message: "请选择菜单进行操作" })
    return
  }
  if (menuModel.value.children && menuModel.value.children.length > 0) {
    ElNotification.error({ title: "错误", message: "该菜单下存在子菜单,不支持该操作" })
    return
  }

  ElMessageBox.confirm("确定删除吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    if (menuModel.value.id) {
      menuApi.deleteMenu({ id: menuModel.value.id }).then((res) => {
        if (res.success) {
          ElMessage.success("删除成功")
          initData()
          showMain.value = false
          menuModel.value = { menuName: "" }
        } else {
          ElMessage.error(res.msg || "删除失败")
        }
      })
    } else {
      initData()
      showMain.value = false
      menuModel.value = { menuName: "" }
    }
  })
}

const addBtnPermission = () => {
  if (!menuModel.value.id) return
  perMarkModel.perMarkList.push({
    markCode: "",
    markName: "",
    menuId: menuModel.value.id
  })
}

const delBtnPermission = (item, index) => {
  ElMessageBox.confirm("确定删除该按钮权限吗?", "提示", {
    type: "warning"
  }).then(() => {
    if (item.id) {
      menuApi.deletePermissionMark({ id: item.id }).then((res) => {
        if (res.success) {
          ElMessage.success("删除成功")
          perMarkModel.perMarkList.splice(index, 1)
        } else {
          ElMessage.error(res.msg || "删除失败")
        }
      })
    } else {
      perMarkModel.perMarkList.splice(index, 1)
    }
  })
}

const handleDragEnd = (draggingNode, dragNode, dragType) => {
  if (dragType !== "none") {
    const data = draggingNode.data
    const targetData = dragNode.data
    
    if (dragType === "inner") {
      data.menuLevel = (targetData.menuLevel || 0) + 1
      data.parentMenuId = targetData.id
    } else if (dragType === "before" || dragType === "after") {
      data.menuLevel = targetData.menuLevel
      data.parentMenuId = targetData.parentMenuId
    }
    
    dragMenuList.value.push(data)
  }
}

const doIt = () => {
  if (dragMenuList.value.length === 0) {
    ElNotification.warning({ title: "提示", message: "没有任何改动" })
    return
  }
  menuApi.updateDragMenu(dragMenuList.value).then((res) => {
    if (res.success) {
      ElMessage.success("应用成功")
      dragMenuList.value = []
      initData()
    } else {
      ElMessage.error(res.msg || "应用失败")
    }
  })
}

const selectIcon = (iconName) => {
  menuModel.value.menuIcon = iconName
}

const btnPermission = (data) => {
  if (data.children && data.children.length === 0) {
    return true
  }
  return false
}

const resetForm = () => {
  if (newMenu.value) {
    ElMessageBox.confirm("您还有未保存的菜单,确认要取消吗?", "提示", {
      type: "warning"
    }).then(() => {
      menuModel.value = { menuName: "" }
      initData()
      showMain.value = false
    })
  } else {
    initData()
    showMain.value = false
  }
}

const refreshRouter = () => {
  ElMessage.info("请刷新页面以更新菜单 (Router Refresh Not Implemented)")
}

onMounted(() => {
  initData()
  getSvgList()
})
</script>

<template>
  <div class="menu-management-page">
    <el-container class="container">
      <el-aside width="400px" class="aside-menu">
        <div class="toolbar">
          <el-button size="small" type="primary" @click="doIt">应用拖拽</el-button>
          <el-button size="small" @click="addFirstLevelMenu">
             <el-icon><Plus /></el-icon> 添加一级菜单
          </el-button>
        </div>

        <el-tree
          ref="menuTreeRef"
          :data="menuList"
          class="filter-tree"
          node-key="id"
          :props="{ label: 'menuName', children: 'children' }"
          default-expand-all
          draggable
          :indent="32"
          :expand-on-click-node="false"
          @node-click="nodeClick"
          @node-drag-end="handleDragEnd"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <span v-if="!data.children || data.children.length < 1" class="icon-circle"></span>
              <span class="node-label" :class="{ 'is-active': showBtn[data.id] && (data.id || data.id === 0) }">{{ node.label }}</span>
              <div v-if="showBtn[data.id] && (data.id || data.id === 0)" class="node-actions">
                <el-icon class="action-icon" @click.stop="addNodeItem(data)"><Plus /></el-icon>
              </div>
              <em
                class="left-line"
                :class="[
                  data.menuLevel === 1 ? 'first-level' : '',
                  showBtn[data.id] && (data.id || data.id === 0) ? 'top-more' : '',
                  (!data.children || data.children.length < 1) ? 'circle-top' : ''
                ]"
                :style="{
                  width: (data.menuLevel || 0) * 32 + 'px',
                  left: '-' + ((data.menuLevel || 0) * 32 + 20) + 'px'
                }"
              ></em>
            </div>
          </template>
        </el-tree>
      </el-aside>

      <el-main v-show="showMain">
        <el-card shadow="hover" class="detail-card">
          <template #header>
            <span>菜单信息</span>
          </template>
          
          <el-form
            ref="menuFormRef"
            :model="menuModel"
            :rules="menuFormRules"
            label-width="120px"
            size="default"
            :disabled="menuModel.id === 0"
          >
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="menuModel.menuName" placeholder="菜单名称" clearable />
            </el-form-item>

            <el-form-item label="图标">
              <el-popover placement="bottom" width="400" trigger="click">
                <template #reference>
                  <el-input v-model="menuModel.menuIcon" placeholder="点击选择图标" readonly>
                    <template #prefix>
                       <SvgIcon v-if="menuModel.menuIcon" :name="menuModel.menuIcon" style="width: 1em; height: 1em;" />
                    </template>
                  </el-input>
                </template>
                <div class="icon-list">
                  <div
                    v-for="item in svgList"
                    :key="item"
                    class="icon-item"
                    @click="selectIcon(item)"
                  >
                    <SvgIcon :name="item" class="icon-preview" />
                  </div>
                </div>
              </el-popover>
            </el-form-item>

            <el-form-item label="所属模块名称">
              <el-input v-model="menuModel.moduleName" placeholder="所属模块名称" clearable />
            </el-form-item>

            <el-form-item label="页面链接" prop="menuPath">
              <el-input v-model="menuModel.menuPath" placeholder="页面链接" clearable />
            </el-form-item>

            <el-form-item label="菜单路由名称" prop="routerName">
              <el-input v-model="menuModel.routerName" placeholder="菜单路由名称" clearable />
            </el-form-item>

            <el-form-item label="序号">
              <el-input v-model.number="menuModel.menuIndex" type="number" clearable />
            </el-form-item>

            <el-form-item label="是否可见" prop="isVisible">
              <el-select v-model="menuModel.isVisible" placeholder="请选择">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>

            <el-form-item label="页面权限" v-if="btnPermission(menuModel)" prop="menuPermission">
              <el-input v-model="menuModel.menuPermission" placeholder="页面权限标识" clearable />
            </el-form-item>

            <el-form-item v-if="btnPermission(menuModel)" label="按钮权限">
              <div class="permission-list">
                <div v-for="(item, index) in perMarkModel.perMarkList" :key="index" class="permission-item">
                   <el-input v-model="item.markName" placeholder="权限名称" size="small" style="width: 150px; margin-right: 5px;" />
                   <el-input v-model="item.markCode" placeholder="权限代码" size="small" style="width: 150px; margin-right: 5px;" />
                   <el-button type="danger" size="small" :icon="Delete" circle @click="delBtnPermission(item, index)" />
                </div>
                <el-button type="primary" size="small" plain @click="addBtnPermission" style="margin-top: 5px;">添加按钮权限</el-button>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveOrUpdate">保存</el-button>
              <el-button @click="resetForm">重置</el-button>
              <el-button type="danger" @click="deleteMenu">删除</el-button>
              <el-button type="warning" @click="refreshRouter">刷新路由</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.menu-management-page {
  height: 100%;
  padding: 20px;
  background-color: var(--el-bg-color);

  .container {
    height: 100%;
  }

  .aside-menu {
    border: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    display: flex;
    flex-direction: column;
    margin-right: 20px;
    padding: 10px;

    .toolbar {
      margin-bottom: 10px;
      display: flex;
      gap: 10px;
    }
  }

  .detail-card {
    height: 100%;
    overflow-y: auto;
  }
}

.custom-tree-node {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  .node-label {
    margin-left: 5px;
    &.is-active {
      color: var(--el-color-primary);
      font-weight: bold;
    }
  }

  .icon-circle {
    width: 8px;
    height: 8px;
    border: 2px solid #ccc;
    border-radius: 50%;
    margin-right: 5px;
    background: #fff;
    z-index: 1;
  }

  .node-actions {
    margin-left: auto;
    .action-icon {
      cursor: pointer;
      color: var(--el-color-primary);
      font-weight: bold;
      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .left-line {
    position: absolute;
    border-top: 1px dashed #ccc;
    height: 1px;
    top: 50%;
    
    &.first-level {
      // Custom styles for first level if needed
    }
  }
}

.icon-list {
  display: flex;
  flex-wrap: wrap;
  max-height: 200px;
  overflow-y: auto;
  
  .icon-item {
    padding: 10px;
    cursor: pointer;
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
    .icon-preview {
      font-size: 24px;
    }
  }
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .permission-item {
    display: flex;
    align-items: center;
  }
}
</style>
