<script setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Edit, Delete, Setting, Search, Refresh } from "@element-plus/icons-vue"
import { roleApi } from "@/common/apis/system/role"
import SearchTablePage from "@/pages/components/SearchTablePage.vue"
import RoleMenuConfig from "./components/RoleMenuConfig.vue"

defineOptions({
  name: "RoleManagement"
})

// State
const searchTableRef = ref()
const roleFormRef = ref()
const roleMenuConfigRef = ref()

// Search Form Data
const searchForm = reactive({
  roleName: "",
  roleDesc: ""
})

// Grid Configuration
const xGridOpt = reactive({
  border: true,
  showHeaderOverflow: true,
  showOverflow: true,
  keepSource: true,
  id: "role_management_grid",
  height: "auto",
  rowConfig: {
    keyField: "id",
    isHover: true
  },
  columnConfig: {
    resizable: true
  },
  printConfig: {
    columns: [
      { field: "roleName" },
      { field: "roleDesc" },
      { field: "dataScope" }
    ]
  },
  sortConfig: {
    trigger: "cell",
    remote: true
  },
  filterConfig: {
    remote: true
  },
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
    layouts: ["Total", "PrevJump", "PrevPage", "Number", "NextPage", "NextJump", "Sizes", "FullJump"]
  },
  toolbarConfig: {
    refresh: true,
    import: false,
    export: true,
    print: true,
    zoom: true,
    custom: true,
    slots: {
      buttons: "toolbar_buttons"
    }
  },
  proxyConfig: {
    seq: true, // Enable auto sequence
    sort: true,
    filter: true,
    props: {
      result: "content.records",
      total: "content.total"
    },
    ajax: {
      query: async ({ page }) => {
        const queryParams = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...searchForm
        }
        return roleApi.getRoleList(queryParams)
      }
    }
  },
  columns: [
    { type: "seq", width: 60, title: "序号", align: "center" },
    { field: "roleName", title: "角色名称", minWidth: 150 },
    { field: "roleDesc", title: "角色中文名", minWidth: 150 },
    { field: "dataScope", title: "权限类型", minWidth: 150, slots: { default: "dataScope_default" } },
    { title: "操作", width: 200, fixed: "right", slots: { default: "operate" } }
  ]
})

// Dialogs
const roleDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogTitle = ref("")
const currentRoleId = ref("")

const roleForm = reactive({
  id: "",
  roleName: "",
  roleDesc: "",
  dataScope: ""
})

const roleRules = reactive({
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleDesc: [{ required: true, message: "请输入角色中文名", trigger: "blur" }],
  dataScope: [{ required: true, message: "请选择权限类型", trigger: "change" }]
})

// Data Scope Options
const dataScopeOptions = [
  { value: "1", label: "全部数据权限" },
  { value: "2", label: "自定数据权限" },
  { value: "3", label: "本部门数据权限" },
  { value: "4", label: "本部门及以下数据权限" },
  { value: "5", label: "仅本人数据权限" }
]

// Methods
const searchEvent = () => {
  searchTableRef.value?.xGrid?.commitProxy("query")
}

const resetEvent = () => {
  searchForm.roleName = ""
  searchForm.roleDesc = ""
  searchEvent()
}

const handleAdd = () => {
  dialogTitle.value = "新增角色"
  roleForm.id = ""
  roleForm.roleName = ""
  roleForm.roleDesc = ""
  roleForm.dataScope = ""
  roleDialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = "修改角色"
  Object.assign(roleForm, row)
  roleDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm("确定删除该角色吗?", "提示", {
    type: "warning"
  }).then(async () => {
    try {
      const res = await roleApi.deleteRole({ id: row.id })
      if (res.success) {
        ElMessage.success("删除成功")
        searchEvent()
      } else {
        ElMessage.error(res.msg || "删除失败")
      }
    } catch (error) {
      console.error(error)
      ElMessage.error("删除失败")
    }
  })
}

const handlePermission = (row) => {
  currentRoleId.value = row.id
  permissionDialogVisible.value = true
}

const submitRoleForm = () => {
  roleFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const api = roleForm.id ? roleApi.updateRole : roleApi.addRole
        const res = await api(roleForm)
        if (res.success) {
          ElMessage.success(roleForm.id ? "修改成功" : "新增成功")
          roleDialogVisible.value = false
          searchEvent()
        } else {
          ElMessage.error(res.msg || "操作失败")
        }
      } catch (error) {
        console.error(error)
        ElMessage.error("操作失败")
      }
    }
  })
}

const submitPermission = async () => {
  if (roleMenuConfigRef.value) {
    const success = await roleMenuConfigRef.value.savePermission()
    if (success) {
      permissionDialogVisible.value = false
    }
  }
}

// Grid Events
const gridEvents = {}

</script>

<template>
  <div class="role-management-page">
    <SearchTablePage
      ref="searchTableRef"
      :search-form="searchForm"
      :grid-options="xGridOpt"
      :grid-events="gridEvents"
      @reset="resetEvent"
      @search="searchEvent"
    >
      <template #search-content>
        <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <el-form-item label="角色名称" class="w-full">
            <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable @keyup.enter="searchEvent" />
          </el-form-item>
        </el-col>
        <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <el-form-item label="角色中文名" class="w-full">
            <el-input v-model="searchForm.roleDesc" placeholder="请输入角色中文名" clearable @keyup.enter="searchEvent" />
          </el-form-item>
        </el-col>
      </template>

      <template #toolbar_buttons>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </template>

      <template #dataScope_default="{ row }">
        <span v-if="row.dataScope === '1'">全部数据权限</span>
        <span v-else-if="row.dataScope === '2'">自定数据权限</span>
        <span v-else-if="row.dataScope === '3'">本部门数据权限</span>
        <span v-else-if="row.dataScope === '4'">本部门及以下数据权限</span>
        <span v-else-if="row.dataScope === '5'">仅本人数据权限</span>
        <span v-else>{{ row.dataScope }}</span>
      </template>

      <template #operate="{ row }">
        <el-tooltip content="修改" placement="top">
          <el-button link type="primary" :icon="Edit" @click="handleEdit(row)"></el-button>
        </el-tooltip>
        <el-tooltip content="权限设置" placement="top">
          <el-button link type="primary" :icon="Setting" @click="handlePermission(row)"></el-button>
        </el-tooltip>
        <el-tooltip content="删除" placement="top">
          <el-button link type="danger" :icon="Delete" @click="handleDelete(row)"></el-button>
        </el-tooltip>
      </template>
    </SearchTablePage>

    <!-- Add/Edit Role Dialog -->
    <el-dialog v-model="roleDialogVisible" :title="dialogTitle" width="500px" destroy-on-close align-center>
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <div style="max-height: 60vh; overflow-y: auto; overflow-x: hidden; padding-right: 10px;">
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="角色中文名" prop="roleDesc">
            <el-input v-model="roleForm.roleDesc" placeholder="请输入角色中文名" />
          </el-form-item>
          <el-form-item label="权限类型" prop="dataScope">
            <el-select v-model="roleForm.dataScope" placeholder="请选择权限类型" style="width: 100%">
              <el-option
                v-for="item in dataScopeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoleForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Permission Dialog -->
    <el-dialog v-model="permissionDialogVisible" title="权限设置" width="800px" destroy-on-close align-center>
      <div style="height: 60vh; overflow: auto;">
        <RoleMenuConfig
          v-if="permissionDialogVisible"
          ref="roleMenuConfigRef"
          :role-id="currentRoleId"
          style="min-width: 1000px;"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPermission">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
