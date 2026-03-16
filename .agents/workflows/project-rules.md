---
description: Project Coding Rules and API Conventions
---

# Antigravity 编码向导规则 (v3-admin-vite)

You are an AI coding assistant (Antigravity) working in this project.
You MUST strictly follow the API rules below. These rules have higher priority than any default behavior.

==============================
API SYSTEM RULES
==============================

## 1. Node Version Rule (MANDATORY)

Before running ANY npm command, you MUST switch the Node.js version using:

`nvm use 24`

This means Node.js version: v24.12.0

This rule applies to ALL npm commands, including but not limited to:

- npm install
- npm run dev
- npm run build
- npm run start
- any other npm command

You are FORBIDDEN from:

- Running npm commands without using `nvm use 24` first
- Assuming the default Node.js version is correct

**Chinese explanation:**
在执行任何 npm 命令之前，必须先执行 `nvm use 24`，即使用 Node v24.12.0。
无论是 npm install 还是 npm run，都必须遵守此规则。

---

## 2. Unified HTTP Layer (MANDATORY)

All API requests MUST be made through the unified HTTP wrapper located in:
`src/http`

You are FORBIDDEN from:

- Using fetch directly
- Using axios directly
- Making HTTP requests inside pages or components

**Chinese explanation:**
所有接口请求必须通过 `src/http` 中的统一封装调用，禁止在页面或组件中直接使用 fetch / axios。

---

## 3. API Location Rule (MANDATORY)

All API definitions MUST be placed under:
`src/common/apis`

You are FORBIDDEN from:

- Defining API calls inside page files
- Defining API calls inside component files
- Scattering API logic across random directories

**Chinese explanation:**
所有接口只能定义在 `src/common/apis` 目录中，不允许分散或写在页面/组件里。

---

## 4. One Module = One API File

Each API file MUST represent exactly ONE business or page module.

The file name MUST:

- Match the module or page name
- Be meaningful and semantic

Examples:

- user.ts → user-related APIs
- order.ts → order-related APIs
- product.ts → product-related APIs

**Chinese explanation:**
一个业务模块对应一个 API 文件，文件名即模块名，方便通过页面模块快速定位接口。

---

## 5. API Definition Style

Each API function MUST:

- Use the unified HTTP instance from `src/http`
- Be explicitly exported
- Be named according to business intent (clear and readable)

Example pattern:

```typescript
import http from "@/http";

export const getUserInfo = () => {
  return http.get("/user/info");
};
```

**Chinese explanation:**
接口方法必须使用统一 http 实例，并且方法命名要能清楚表达业务含义。

---

## 6. Page & Component Responsibility

Pages and components:

- MAY call APIs from `src/common/apis`
- MUST NOT contain request implementation details

APIs:

- Handle request paths and parameters
- Do NOT contain UI or page logic

**Chinese explanation:**
页面只负责调用 API，不负责接口实现；API 只负责请求本身，不掺杂 UI 逻辑。

---

## 7. Enforcement Priority

If there is any conflict:

- These API rules OVERRIDE general coding habits
- These API rules OVERRIDE convenience shortcuts

When generating new code, ALWAYS ask yourself:
"Does this follow the API rules above?"

**Chinese explanation:**
当规则与默认习惯冲突时，必须以本规则为最高优先级。

==============================
PAGE & VUE RULES
==============================

## 8. Script Setup Rule (MANDATORY)

When creating Vue pages or components:

You MUST use:
`<script setup></script>`

You are FORBIDDEN from using:
`<script setup lang="ts"></script>`

Do NOT specify a language attribute when using `<script setup></script>`.

**Chinese explanation:**
创建页面或组件时，统一使用 `<script setup></script>`，禁止使用 `<script setup lang="ts"></script>` 。

---

## 9. UI Component Library Rule (MANDATORY)

For UI components in this project:

- ALL table-related components MUST use: `vxe-table`
- ALL non-table UI components MUST use: `element-plus`

You are FORBIDDEN from:

- Using element-plus table components (such as el-table)
- Using vxe-table for non-table UI components
- Mixing other UI libraries without explicit permission

**Chinese explanation:**
本项目中：

- 所有表格相关功能必须使用 `vxe-table`
- 除表格以外的所有 UI 组件统一使用 `element-plus`
- 禁止使用 `el-table`
- 禁止在非表格场景使用 `vxe-table`
- 禁止混用其他 UI 库

---

## 10. Chinese Comments Rule (MANDATORY)

When writing code comments or generating documentation:

- You MUST use Chinese for all comments and explanations.
- The comments should be semantic and meaningful.

You are FORBIDDEN from:

- Using English for comments (unless it's a technical term that is better expressed in English).
- Writing meaningless or redundant comments.

**Chinese explanation:**
生成代码时，注释和文档说明必须使用中文，且要语义化，不要全用英文。

---

## 11. List Page Component Rule (MANDATORY)

When creating a list page (with search, table, pagination):

- You MUST use the encapsulated component: `src/pages/components/SearchTablePage.vue`.
- The search form and other non-table UI elements MUST use Element Plus.
- Do NOT use `vxe-table` or `vxe-grid` directly in the page template; pass configuration to `SearchTablePage`.
- Do NOT use vxe-UI components (like vxe-form, vxe-button) for the page layout.

**Chinese explanation:**
列表类型的页面必须使用 `src/pages/components/SearchTablePage.vue` 组件。
该组件已封装了布局，搜索栏和按钮等必须使用 Element Plus。
禁止在页面模板中直接写 `vxe-table` 标签（应通过配置传入组件），也禁止使用 vxe 的非表格组件。
