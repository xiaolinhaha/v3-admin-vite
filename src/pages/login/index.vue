<script setup>
import { ElMessage, ElNotification } from "element-plus"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { Key, Loading, Lock, Picture, Umbrella, User } from "@element-plus/icons-vue"
import sm2 from "sm-crypto"
import { onMounted, onUnmounted, reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { getMessageCodeApi, getVerifyCodeApi, loginApi } from "./apis"
import Owl from "./components/Owl.vue"
import { useFocus } from "./composables/useFocus"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const { isFocus, handleBlur, handleFocus } = useFocus()

/** 登录表单元素的引用 */
const loginFormRef = ref()

/** 登录按钮 Loading */
const loading = ref(false)

/** 验证码图片 URL */
const codeUrl = ref("")

/** 状态标志 */
const internetFlag = ref(false)
const sendSMSFlag = ref(false)
const waitTime = ref(60)
const verifyCodeInterval = ref(null)
const key = "0430a96a1859f606292aa4836cc7d04e2e4d75013d23b87ce7de262e9d1885f2d0187dbb5b56d857a45a300a56d368578eca4ddbb81a740235ec9c1a80c9dc5e65"

/** 登录表单数据 */
const loginFormData = reactive({
  username: "zhangjialin",
  password: "Admin@1001",
  code: ""
})

/** 登录表单校验规则 */
const loginFormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 获取验证码 */
function getVerCode() {
  loginFormData.code = ""
  codeUrl.value = ""
  getVerifyCodeApi().then((res) => {
    if (res.success) {
      codeUrl.value = `data:image/jpeg;base64,${res.content}`
    } else {
      // 可能是错误消息，也可能是需要切换模式
    }

    if (res.msg === "internet" || res.content === "") {
      internetFlag.value = true
    }
  }).catch((err) => {
    console.error(err)
  })
}

/** 发送短信 */
function sendSMS() {
  const data = {
    userName: sm2.sm2.doEncrypt(loginFormData.username, key, 0),
    password: sm2.sm2.doEncrypt(loginFormData.password, key, 0),
    messageCode: loginFormData.code
  }

  sendSMSFlag.value = true
  waitTime.value = 60
  verifyCodeInterval.value = setInterval(() => {
    waitTime.value = waitTime.value - 1
    if (waitTime.value <= 0) {
      clearInterval(verifyCodeInterval.value)
      sendSMSFlag.value = false
    }
  }, 1000)

  getMessageCodeApi(data).then((res) => {
    if (res.status === -1) {
      ElNotification({
        title: "error",
        type: "error",
        message: res.msg
      })
      clearInterval(verifyCodeInterval.value)
      sendSMSFlag.value = false
    } else {
      ElNotification({
        title: "success",
        type: "success",
        message: "短信已发送"
      })
    }
  })
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      return
    }
    loading.value = true

    let data = {}
    if (internetFlag.value) {
      data = {
        userName: sm2.sm2.doEncrypt(loginFormData.username, key, 0),
        password: sm2.sm2.doEncrypt(loginFormData.password, key, 0),
        messageCode: loginFormData.code
        // openId: "" // 如果需要支持微信登录后续再加
      }
    } else {
      data = {
        userName: sm2.sm2.doEncrypt(loginFormData.username, key, 0),
        password: sm2.sm2.doEncrypt(loginFormData.password, key, 0),
        verifyCode: loginFormData.code
      }
    }

    loginApi(data).then((res) => {
      if (res.success) {
        const token = res.content.token
        const userName = res.content.userName
        const userInfo = JSON.stringify(res.content.userInfo)

        userStore.setToken(token)
        localStorage.setItem("TOKEN", token)
        sessionStorage.setItem("userName", userName)
        sessionStorage.setItem("userInfo", userInfo)

        const reset = res.content.userInfo.reset
        if (reset != "1") {
          router.push(route.query.redirect ? decodeURIComponent(String(route.query.redirect)) : "/")
        } else {
          router.push({ name: "uppwd" }) // 需要确保路由存在
        }
      } else {
        ElMessage.error(res.content ? res.content : res.msg)
        getVerCode()
      }
    }).catch((error) => {
      ElNotification({
        title: "error",
        type: "error",
        message: error.message || "登录失败"
      })
      getVerCode()
    }).finally(() => {
      loading.value = false
    })
  })
}

onMounted(() => {
  getVerCode()
})

onUnmounted(() => {
  if (verifyCodeInterval.value) {
    clearInterval(verifyCodeInterval.value)
  }
})
</script>

<template>
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />
    <Owl :close-eyes="isFocus" />
    <div class="login-card">
      <div class="title">
        <img src="@@/assets/images/layouts/iopLogo2.png">
      </div>
      <div class="content">
        <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="用户名"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
              @blur="handleBlur"
              @focus="handleFocus"
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              :placeholder="internetFlag ? '短信验证码' : '验证码'"
              type="text"
              tabindex="3"
              :prefix-icon="internetFlag ? Umbrella : Key"
              maxlength="7"
              size="large"
              @blur="handleBlur"
              @focus="handleFocus"
            >
              <template #append>
                <div v-if="internetFlag" class="sms-btn" @click="sendSMS" :class="{ 'is-disabled': sendSMSFlag }">
                  {{ sendSMSFlag ? `${waitTime}s` : '发送短信' }}
                </div>
                <el-image v-else :src="codeUrl" draggable="false" @click="getVerCode">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <el-button :loading="loading" type="primary" size="large" @click.prevent="handleLogin">
            登 录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
  }
  .login-card {
    width: 480px;
    max-width: 90%;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: var(--el-bg-color);
    overflow: hidden;
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;
      img {
        height: 100%;
      }
    }
    .content {
      padding: 20px 50px 50px 50px;
      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;
        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
        .sms-btn {
          width: 100px;
          height: 40px;
          line-height: 40px;
          text-align: center;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-regular);
          &:hover {
            background-color: var(--el-fill-color);
          }
          &.is-disabled {
            cursor: not-allowed;
            color: var(--el-text-color-placeholder);
          }
        }
      }
      .el-button {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
}
</style>
