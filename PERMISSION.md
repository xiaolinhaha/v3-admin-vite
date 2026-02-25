# 权限系统说明文档

## 1. 概述

本项目采用 **基于角色的访问控制 (RBAC)** 和 **基于资源的访问控制** 相结合的权限管理策略。
权限系统主要分为两个维度：
1.  **页面权限**：控制用户能看到哪些菜单和页面。
2.  **按钮权限**：控制用户在页面内能看到哪些操作按钮（如新增、删除、编辑等）。

---

## 2. 页面权限 (Page Permission)

### 2.1 实现原理

页面权限由 **后端动态返回的菜单树** 决定。
1.  用户登录后，前端调用 `/iopApiAdmin/nebula/sys/user/info` 接口获取当前用户的菜单数据 (`menuList`)。
2.  前端根据菜单数据，动态生成 Vue Router 路由配置。
3.  只有生成的路由才会被注册到路由器中，用户只能访问已注册的路由。

### 2.2 路由生成逻辑

-   **菜单数据源**：`src/pinia/stores/user.ts` 中的 `getInfo` action 获取菜单。
-   **路由转换**：`src/pinia/stores/permission.ts` 中的 `generateRoutes` action 负责将菜单数据转换为路由。
-   **组件映射**：
    -   系统优先在 `src/router/index.ts` 的 `dynamicRoutes` 中查找匹配的静态路由配置（通过 `path` 或 `name`）。
    -   如果找到，复用静态配置中的 `component`（这样可以享受 Vite 的代码分割和预加载）。
    -   如果未找到，尝试根据 `menuPath` 自动匹配 `src/pages` 下的组件文件（支持 `/src/pages/${path}/index.vue` 等格式）。

### 2.3 开发新页面流程

1.  在 `src/pages` 下创建页面组件，例如 `src/pages/system/user/index.vue`。
2.  在 `src/router/index.ts` 的 `dynamicRoutes` 中配置该页面的静态路由信息（推荐）：
    ```typescript
    {
      path: "/sys",
      component: Layouts,
      children: [
        {
          path: "userList", // 对应后端返回的 menuPath: /sys/userList
          component: () => import("@/pages/system/user/index.vue"),
          name: "UserList",
          meta: { title: "用户管理" }
        }
      ]
    }
    ```
3.  在后端系统配置相应的菜单，确保 `menuPath` 与前端配置一致（如 `/sys/userList`）。

---

## 3. 按钮权限 (Button Permission)

### 3.1 实现原理

按钮权限基于 **当前路由元信息 (Meta)** 中的 `permissionMarks` 字段。
1.  后端返回的菜单数据中，每个菜单节点包含一个 `permissionMarks` 数组，列出了该用户在该页面下拥有的所有权限标识（如 `user:add`, `user:delete`）。
2.  前端在生成路由时，会将这个数组存储到路由的 `meta.permissionMarks` 中。
3.  通过自定义指令 `v-permission` 或全局函数 `checkPermission`，检查当前路由是否包含特定的权限标识。

### 3.2 使用方法

#### 方式一：指令方式 (推荐)

在按钮或元素上直接使用 `v-permission` 指令：

```vue
<template>
  <!-- 只有拥有 'user:add' 权限的用户才能看到此按钮 -->
  <el-button 
    type="primary" 
    v-permission="'user:add'" 
    @click="handleAdd"
  >
    新增用户
  </el-button>

  <!-- 只有拥有 'user:delete' 权限的用户才能看到此按钮 -->
  <el-button 
    type="danger" 
    v-permission="'user:delete'" 
    @click="handleDelete"
  >
    删除用户
  </el-button>
</template>
```

#### 方式二：函数方式

在 `<script setup>` 中使用 `checkPermission` 函数进行逻辑判断：

```vue
<script setup>
import { checkPermission } from "@/common/utils/permission"

const handleEdit = () => {
  if (!checkPermission('user:update')) {
    ElMessage.error('您没有编辑权限')
    return
  }
  // 执行编辑逻辑
}
</script>
```

### 3.3 权限标识规范

权限标识通常采用 `资源:操作` 的格式，例如：
-   `user:query` - 用户查询
-   `user:add` - 用户新增
-   `user:update` - 用户修改
-   `user:delete` - 用户删除
-   `fileUpload:upload` - 文件上传

这些标识需要在后端权限管理系统中配置，并分配给相应的角色。

---

## 4. 关键代码位置

| 功能 | 文件路径 | 说明 |
| :--- | :--- | :--- |
| **指令定义** | `src/plugins/permission-directive.ts` | `v-permission` 指令实现 |
| **权限工具** | `src/common/utils/permission.ts` | `checkPermission` 函数实现 |
| **路由生成** | `src/pinia/stores/permission.ts` | 动态路由生成与组件匹配逻辑 |
| **路由守卫** | `src/router/guard.ts` | 登录拦截与路由加载触发 |
| **静态路由** | `src/router/index.ts` | `dynamicRoutes` 定义 |

