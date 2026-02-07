<script setup>
import { reactive, ref, onMounted, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Delete, More, Document, Timer, User, Edit, Lock, Unlock, Key } from "@element-plus/icons-vue"
import { userApi } from "@/api/system/user"
import SearchTablePage from "@/pages/components/SearchTablePage.vue"
import sm2 from "sm-crypto"

defineOptions({
  name: "UserManagement"
})

const searchTableRef = ref()
const xGrid = computed(() => searchTableRef.value?.xGrid)
const formRef = ref()
const deptOptions = ref([])
const roleOptions = ref([])

// Search Form Data
const searchForm = reactive({
  userName: "",
  userNickname: "",
  deptId: ""
})

// Encryption key (should match backend)
const key = "0430a96a1859f606292aa4836cc7d04e2e4d75013d23b87ce7de262e9d1885f2d0187dbb5b56d857a45a300a56d368578eca4ddbb81a740235ec9c1a80c9dc5e65"

// --- Department Data Handling ---
const loadDepts = async () => {
  try {
    const res = await userApi.listOrg()
    console.log("depts: ", res)
    if (res?.status === 0) {
      deptOptions.value = transformToCascaderData(res.content)
    }
  } catch (error) {
    console.error(error)
  }
}

const transformToCascaderData = data => {
  if (!data) return []
  return data.map(item => ({
    value: item.orgCode,
    label: item.orgName,
    children: item.children && item.children.length > 0 ? transformToCascaderData(item.children) : undefined
  }))
}

// --- Role Data Handling ---
const loadRoles = async () => {
  try {
    const res = await userApi.getRoleAll()
    if (res?.status === 0) {
      roleOptions.value = res.content?.map(item => ({ label: item.roleDesc, value: item.roleName }))
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadDepts()
  loadRoles()
})

// --- Search Actions ---
const searchEvent = () => {
  xGrid.value?.commitProxy("query")
}

const resetEvent = () => {
  searchForm.userName = ""
  searchForm.userNickname = ""
  searchForm.deptId = ""
  searchEvent()
}

// --- Grid Configuration ---
const xGridOpt = reactive({
  border: true,
  showHeaderOverflow: true,
  showOverflow: true,
  keepSource: true,
  id: "user_management_grid",
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
      { field: "userName" },
      { field: "userNickname" },
      { field: "deptName" },
      { field: "status" }
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
    pageSize: 10,
    pageSizes: [5, 10, 15, 20, 50, 100, 200, 500, 1000],
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
        // Handle Dept Cascader value (it might be an array)
        if (Array.isArray(queryParams.deptId)) {
          queryParams.deptId = queryParams.deptId[queryParams.deptId.length - 1]
        }
        
        return userApi.userList(queryParams)
      },
      delete: async () => {
        return Promise.reject("Batch delete not implemented yet")
      }
    }
  },
  columns: [
    { type: "checkbox", width: 50 },
    { field: "id", width: 60, title: "ID" },
    { field: "userNickname", title: "昵称", minWidth: 120 },
    { field: "roleStrList", title: "角色名称", minWidth: 150 },
    { field: "userName", title: "登录名", minWidth: 120 },
    { field: "userPhone", title: "手机号", width: 120 },
    { field: "deptName", title: "部门", width: 120 },
    { field: "isAccess", title: "是否允许访问", width: 120, slots: { default: "isAccess_default" } },
    { field: "accessStartTime", title: "开始时间", minWidth: 160 },
    { field: "accessEndTime", title: "结束时间", minWidth: 160 },
    { field: "accessReason", title: "访问原因", minWidth: 120 },
    { field: "userEmail", title: "电子邮箱", minWidth: 150 },
    { field: "status", title: "状态", width: 100, slots: { default: "status_default" } },
    { title: "操作", width: 250, fixed: "right", slots: { default: "operate" } }
  ]
})

// --- Event Handlers ---

const insertEvent = () => {
  showEditModal.value = true
  modalType.value = "add"
  formData.value = {
    userName: "",
    userNickname: "",
    password: "",
    deptId: [],
    status: "1"
  }
}

const batchDeleteEvent = () => {
  const records = xGrid.value?.getCheckboxRecords()
  if (records && records.length > 0) {
    ElMessageBox.confirm(`确定要删除选中的 ${records.length} 条记录吗？`, "提示").then(async () => {
          for (const record of records) {
            await userApi.removeUserById({ userId: record.id })
          }
          ElMessage.success("删除成功")
          xGrid.value?.commitProxy("query")
    })
  } else {
    ElMessage.warning("请选择要删除的记录")
  }
}

const removeEvent = async row => {
  try {
    await ElMessageBox.confirm("确定要删除该用户吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await userApi.removeUserById({ userId: row.id })
    ElMessage.success("删除成功")
    xGrid.value?.commitProxy("query")
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

const editEvent = row => {
  showEditModal.value = true
  modalType.value = "edit"
  // Clone row data
  formData.value = { ...row, password: "" } // Don't show password
  // Handle deptId for cascader if needed (assuming backend returns path or we just set leaf)
  // If backend only returns deptId, we might need to find the path or just set it as value
  // For simplicity, we assume single value works with emitPath=false
}

const resetPwdEvent = async row => {
  try {
    await ElMessageBox.confirm("确定要重置该用户的密码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await userApi.resetPwd({ userId: row.id })
    ElMessage.success("重置成功")
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("重置失败")
    }
  }
}

const assignRoleEvent = row => {
  currentUserId.value = row.id
  // Fetch user roles
  // userApi.getRoleByUser({ userId: row.id }) // If API exists
  // For now, assume row.roleIds or we fetch it
  selectedRoleIds.value = row.roleIds || [] // Adjust based on actual data structure
  showRoleModal.value = true
}

const gridEvents = {
  // Removing toolbarButtonClick since we use custom buttons
}

// --- Login Log Modal ---
const showLoginLogModal = ref(false)
const loginLogList = ref([])
const loginLogTotal = ref(0)
const loginLogPage = reactive({
  pageNum: 1,
  pageSize: 20
})
const currentLoginUserId = ref("")

const showLoginLogEvent = (row) => {
  currentLoginUserId.value = row.id
  loginLogPage.pageNum = 1
  fetchLoginLog()
  showLoginLogModal.value = true
}

const fetchLoginLog = async () => {
  try {
    const res = await userApi.queryLoginRecord({
      pageNum: loginLogPage.pageNum,
      pageSize: loginLogPage.pageSize,
      userId: currentLoginUserId.value
    })
    if (res && res.code === 0) {
      loginLogList.value = res.content.records
      loginLogTotal.value = res.content.total
    }
  } catch (error) {
    console.error(error)
  }
}

const handleLoginLogPageChange = (val) => {
  loginLogPage.pageNum = val
  fetchLoginLog()
}

const handleLoginLogSizeChange = (val) => {
  loginLogPage.pageSize = val
  fetchLoginLog()
}

// --- Access Setting Modal ---
const showAccessModal = ref(false)
const accessForm = reactive({
  userId: "",
  startTime: "",
  endTime: "",
  accessReason: ""
})
const accessLoading = ref(false)

const showAccessEvent = (row) => {
  accessForm.userId = row.id
  // Parse existing time if available (format: YYYY-MM-DD HH:mm:ss)
  accessForm.startTime = row.accessStartTime ? row.accessStartTime.split(" ")[1] : ""
  accessForm.endTime = row.accessEndTime ? row.accessEndTime.split(" ")[1] : ""
  accessForm.accessReason = row.accessReason || ""
  showAccessModal.value = true
}

const submitAccessEvent = async () => {
  if (!accessForm.startTime || !accessForm.endTime) {
    ElMessage.warning("请选择开始和结束时间")
    return
  }
  
  accessLoading.value = true
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const datePrefix = `${year}-${month}-${day} `

    await userApi.allowAccess({
      userId: accessForm.userId,
      accessStartTime: datePrefix + accessForm.startTime,
      accessEndTime: datePrefix + accessForm.endTime,
      accessReason: accessForm.accessReason
    })
    ElMessage.success("设置成功")
    showAccessModal.value = false
    xGrid.value?.commitProxy("query")
  } catch (error) {
    ElMessage.error("操作失败")
  } finally {
    accessLoading.value = false
  }
}

// --- More Actions (Lock/Unlock) ---
const handleCommand = (command) => {
  const { type, row } = command
  if (type === 'reset') {
    resetPwdEvent(row)
    return
  }
  const actionText = type === "lock" ? "锁定" : "解锁"
  
  ElMessageBox.confirm(`确定要${actionText}该用户吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      if (type === "lock") {
        await userApi.lockUser({ userId: row.id })
      } else {
        await userApi.unlockUser({ userId: row.id })
      }
      ElMessage.success(`${actionText}成功`)
      xGrid.value?.commitProxy("query")
    } catch (error) {
      ElMessage.error(`${actionText}失败`)
    }
  })
}

// --- Modals ---
const showEditModal = ref(false)
const modalType = ref("add")
const formData = ref({})
const formRules = {
  userName: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  userNickname: [{ required: true, message: "请输入用户昵称", trigger: "blur" }],
  deptId: [{ required: true, message: "请选择部门", trigger: "change" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
}

const submitEvent = async () => {
  // Validate form...
  try {
    const data = { ...formData.value }
    // Encrypt password if present
    if (data.password) {
      data.password = sm2.sm2.doEncrypt(data.password, key, 0)
    }
    // Handle deptId array
    if (Array.isArray(data.deptId)) {
      data.deptId = data.deptId[data.deptId.length - 1]
    }

    if (modalType.value === "add") {
      await userApi.addUser(data)
    } else {
      await userApi.updateUser(data)
    }
    ElMessage.success(modalType.value === "add" ? "新增成功" : "修改成功")
    showEditModal.value = false
    xGrid.value?.commitProxy("query")
  } catch (error) {
    ElMessage.error("操作失败")
  }
}

// Role Modal
const showRoleModal = ref(false)
const currentUserId = ref("")
const selectedRoleIds = ref([])

const submitRoleEvent = async () => {
  try {
    await userApi.setUserRole({
      userId: currentUserId.value,
      roleIds: selectedRoleIds.value.join(",")
    })
    ElMessage.success("角色设置成功")
    showRoleModal.value = false
    xGrid.value?.commitProxy("query")
  } catch (error) {
    ElMessage.error("操作失败")
  }
}

</script>

<template>
  <SearchTablePage
    ref="searchTableRef"
    :search-form="searchForm"
    :grid-options="xGridOpt"
    :grid-events="gridEvents"
    @reset="resetEvent"
    @search="searchEvent"
  >
    <template #search-content="{ isExpand }">
      <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <el-form-item label="用户名" class="w-full">
          <el-input v-model="searchForm.userName" placeholder="请输入用户名" clearable @keyup.enter="searchEvent" />
        </el-form-item>
      </el-col>
      <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-show="isExpand">
        <el-form-item label="用户昵称" class="w-full">
          <el-input v-model="searchForm.userNickname" placeholder="请输入用户昵称" clearable @keyup.enter="searchEvent" />
        </el-form-item>
      </el-col>
      <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-show="isExpand">
        <el-form-item label="所属部门" class="w-full">
          <el-cascader
            v-model="searchForm.deptId"
            :options="deptOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            filterable
            placeholder="请选择部门"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </template>

    <template #toolbar_buttons>
      <el-button type="primary" :icon="Plus" @click="insertEvent">新增</el-button>
      <el-button type="danger" :icon="Delete" @click="batchDeleteEvent">删除</el-button>
    </template>

    <template #status_default="{ row }">
      <el-tag v-if="row.userStatus === 'normal'" type="success">正常</el-tag>
      <el-tag v-else-if="row.userStatus === 'freeze'" type="warning">冻结</el-tag>
      <el-tag v-else-if="row.userStatus === 'del'" type="danger">删除</el-tag>
    </template>

    <template #isAccess_default="{ row }">
      <span>{{ row.isAccess == 0 ? '允许' : '不允许' }}</span>
    </template>

    <template #operate="{ row }">
      <el-tooltip content="登录日志" placement="top">
        <el-button link type="primary" :icon="Document" @click="showLoginLogEvent(row)"></el-button>
      </el-tooltip>
      <el-tooltip content="设置访问" placement="top">
        <el-button link type="primary" :icon="Timer" @click="showAccessEvent(row)"></el-button>
      </el-tooltip>
      <el-tooltip content="分配角色" placement="top">
        <el-button link type="info" :icon="User" @click="assignRoleEvent(row)"></el-button>
      </el-tooltip>
      <el-tooltip content="修改用户" placement="top">
        <el-button link type="primary" :icon="Edit" @click="editEvent(row)"></el-button>
      </el-tooltip>
      <el-tooltip content="删除用户" placement="top">
        <el-button link type="danger" :icon="Delete" @click="removeEvent(row)"></el-button>
      </el-tooltip>
      <el-dropdown @command="handleCommand" trigger="click">
        <span class="el-dropdown-link">
          <el-tooltip content="更多操作" placement="top">
            <el-button link type="primary" :icon="More" style="margin-left: 12px"></el-button>
          </el-tooltip>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="{ type: 'reset', row }">
              <el-icon><Key /></el-icon>重置密码
            </el-dropdown-item>
            <el-dropdown-item :command="{ type: 'lock', row }">
              <el-icon><Lock /></el-icon>锁定
            </el-dropdown-item>
            <el-dropdown-item :command="{ type: 'unlock', row }">
              <el-icon><Unlock /></el-icon>解锁
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </SearchTablePage>

  <!-- Login Log Modal -->
  <vxe-modal v-model="showLoginLogModal" title="登录日志" width="800" destroy-on-close :z-index="3000">
    <template #default>
      <div style="padding: 20px">
        <vxe-table :data="loginLogList" height="400" border stripe>
          <vxe-column field="userNickName" title="昵称" width="100" />
          <vxe-column field="userName" title="登录名" width="100" />
          <vxe-column field="orgCode" title="所属机构" />
          <vxe-column field="userPhone" title="手机号" />
          <vxe-column field="allowChannel" title="访问渠道" />
          <vxe-column field="allowIp" title="访问IP" width="150" />
          <vxe-column field="accessReason" title="访问原因" />
          <vxe-column field="accessStartTime" title="授权开始时间" width="160" />
          <vxe-column field="accessEndTime" title="授权结束时间" width="160" />
          <vxe-column field="loginTime" title="实际登录时间" width="160" />
        </vxe-table>
        <vxe-pager
          v-model:current-page="loginLogPage.pageNum"
          v-model:page-size="loginLogPage.pageSize"
          :total="loginLogTotal"
          :page-sizes="[10, 20, 50, 100]"
          @page-change="({ currentPage, pageSize }) => { loginLogPage.pageNum = currentPage; loginLogPage.pageSize = pageSize; fetchLoginLog() }"
        />
      </div>
    </template>
  </vxe-modal>

  <!-- Access Setting Modal -->
  <vxe-modal v-model="showAccessModal" title="设置访问" width="500" destroy-on-close :z-index="3000">
    <template #default>
      <el-form :model="accessForm" label-width="100px" style="padding: 20px">
        <el-form-item label="访问开始时间">
          <el-time-picker v-model="accessForm.startTime" value-format="HH:mm:ss" placeholder="选择时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="访问结束时间">
          <el-time-picker v-model="accessForm.endTime" value-format="HH:mm:ss" placeholder="选择时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="访问原因">
          <el-input type="textarea" v-model="accessForm.accessReason" :rows="2" placeholder="请输入访问原因" />
        </el-form-item>
        <div style="text-align: right; margin-top: 20px">
          <el-button @click="showAccessModal = false">取消</el-button>
          <el-button type="primary" :loading="accessLoading" @click="submitAccessEvent">确定</el-button>
        </div>
      </el-form>
    </template>
  </vxe-modal>

  <!-- Edit Modal -->
  <vxe-modal
    v-model="showEditModal"
    :title="modalType === 'add' ? '新增用户' : '编辑用户'"
    width="600"
    min-width="400"
    height="auto"
    :loading="false"
    resize
    destroy-on-close
    :z-index="3000"
  >
    <template #default>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="formData.userName" :disabled="modalType === 'edit'" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="用户昵称" prop="userNickname">
          <el-input v-model="formData.userNickname" placeholder="请输入用户昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="modalType === 'add'">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptId">
          <el-cascader
            v-model="formData.deptId"
            :options="deptOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            filterable
            placeholder="请选择部门"
            style="width: 100%"
            popper-class="fix-modal-z-index"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="formData.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <div style="text-align: right">
          <el-button @click="showEditModal = false">取消</el-button>
          <el-button type="primary" @click="submitEvent">确定</el-button>
        </div>
      </el-form>
    </template>
  </vxe-modal>

  <!-- Role Assignment Modal -->
  <vxe-modal v-model="showRoleModal" title="分配角色" width="500" destroy-on-close :z-index="3000">
    <template #default>
      <div>
         <el-select 
           v-model="selectedRoleIds" 
           multiple 
           placeholder="请选择角色" 
           style="width: 100%"
           popper-class="fix-modal-z-index"
         >
           <el-option
             v-for="item in roleOptions"
             :key="item.value"
             :label="item.label"
             :value="item.value"
           />
         </el-select>
         <div style="text-align: right; margin-top: 20px">
           <el-button @click="showRoleModal = false">取消</el-button>
           <el-button type="primary" @click="submitRoleEvent">确定</el-button>
         </div>
      </div>
    </template>
  </vxe-modal>
</template>

<style>
.fix-modal-z-index {
  z-index: 99999 !important;
}
</style>
