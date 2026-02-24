<script setup>
import { ref, watch, nextTick } from "vue"
import { ElMessage } from "element-plus"
import { menuApi } from "@/common/apis/system/menu"
import { roleApi } from "@/common/apis/system/role"

const props = defineProps({
  roleId: {
    type: [String, Number],
    default: ""
  }
})

const loading = ref(false)
const menuList = ref([])
const rolePerMap = ref({}) // menuId -> [markId, markId]
const selectedMenuIds = ref([]) // [menuId, menuId]

const loadData = async () => {
  loading.value = true
  try {
    // 1. Get All Menus
    const menuRes = await menuApi.getAllMenu({})
    menuList.value = menuRes.content || []

    // 2. Get Role Permissions
    if (props.roleId) {
      const permRes = await roleApi.getRolePermission({ roleId: props.roleId })
      rolePerMap.value = permRes.content || {}
      // Convert keys to strings for consistency
      selectedMenuIds.value = Object.keys(rolePerMap.value).map(String)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error("加载数据失败")
  } finally {
    loading.value = false
  }
}

// Watch roleId change to load permissions
watch(() => props.roleId, (newVal) => {
  if (newVal) {
    loadData()
  } else {
    menuList.value = []
    rolePerMap.value = {}
    selectedMenuIds.value = []
  }
}, { immediate: true })

// Handle Menu Selection (Menu Authorization)
const handleMenuCheck = (row, checked) => {
  const menuId = String(row.id)
  if (checked) {
    // Add menu
    if (!selectedMenuIds.value.includes(menuId)) {
      selectedMenuIds.value.push(menuId)
    }
    // Initialize permission array if not exists
    if (!rolePerMap.value[menuId]) {
      rolePerMap.value[menuId] = []
    }
    
    // Logic: If leaf node, ensure parent is selected? 
    // The original logic had complex parent/child cascading.
    // For simplicity, we can implement basic cascading or stick to manual selection.
    // Let's try to replicate basic parent selection.
    if (row.parentMenuId && row.parentMenuId !== 0) {
       const parentId = String(row.parentMenuId)
       if (!selectedMenuIds.value.includes(parentId)) {
         selectedMenuIds.value.push(parentId)
         if (!rolePerMap.value[parentId]) {
           rolePerMap.value[parentId] = []
         }
       }
    }
    
    // Select all children?
    // if (row.children && row.children.length > 0) {
    //   row.children.forEach(child => handleMenuCheck(child, true))
    // }

  } else {
    // Remove menu
    const index = selectedMenuIds.value.indexOf(menuId)
    if (index > -1) {
      selectedMenuIds.value.splice(index, 1)
    }
    delete rolePerMap.value[menuId]
    
    // Deselect children?
    if (row.children && row.children.length > 0) {
      row.children.forEach(child => handleMenuCheck(child, false))
    }
  }
}

// Expose save method
const savePermission = async () => {
  if (!props.roleId) return
  
  // Filter out any entries in rolePerMap that are not in selectedMenuIds
  // (Though our logic keeps them in sync, it's good to be safe)
  const finalRoleMenu = {}
  selectedMenuIds.value.forEach(menuId => {
    finalRoleMenu[menuId] = rolePerMap.value[menuId] || []
  })

  const param = {
    roleId: props.roleId,
    roleMenu: finalRoleMenu
  }
  
  try {
    const res = await roleApi.saveRoleMenu(param)
    if (res.success) {
      ElMessage.success("权限保存成功")
      return true
    } else {
      ElMessage.error(res.msg || "保存失败")
      return false
    }
  } catch (error) {
    console.error(error)
    ElMessage.error("保存失败")
    return false
  }
}

defineExpose({
  savePermission,
  loadData
})
</script>

<template>
  <div class="role-menu-config">
    <vxe-table
      border
      :loading="loading"
      :data="menuList"
      :tree-config="{ transform: false, rowField: 'id', parentField: 'parentMenuId', expandAll: true }"
    >
      <vxe-column field="menuName" title="菜单名称" width="250" tree-node></vxe-column>
      
      <vxe-column title="菜单授权" width="100" align="center">
        <template #default="{ row }">
          <vxe-checkbox 
            :model-value="selectedMenuIds.includes(String(row.id))" 
            @change="({ checked }) => handleMenuCheck(row, checked)"
          >
            授权
          </vxe-checkbox>
        </template>
      </vxe-column>
      
      <vxe-column title="按钮权限" min-width="300" align="left">
        <template #default="{ row }">
          <div v-if="selectedMenuIds.includes(String(row.id)) && row.permissionMarks && row.permissionMarks.length > 0">
             <vxe-checkbox-group v-model="rolePerMap[String(row.id)]">
               <vxe-checkbox 
                 v-for="mark in row.permissionMarks" 
                 :key="mark.id" 
                 :label="mark.id" 
                 :content="mark.markName"
               ></vxe-checkbox>
             </vxe-checkbox-group>
          </div>
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<style scoped>
.role-menu-config {
  width: 100%;
}
</style>
