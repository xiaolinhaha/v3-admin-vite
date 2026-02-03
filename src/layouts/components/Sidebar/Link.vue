<script lang="ts" setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { isExternal } from "@@/utils/validate"

interface Props {
  to: string
  target?: string
  openMode?: "tab" | "window"
  withToken?: boolean
}

const props = defineProps<Props>()
const router = useRouter()

const openInNewWindow = computed(() => props.openMode === "window")

const appendQuery = (rawHref: string, params: Record<string, string>) => {
  const applyQuery = (path: string) => {
    const [base, query = ""] = path.split("?")
    const searchParams = new URLSearchParams(query)
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value)
    })
    const queryString = searchParams.toString()
    return queryString ? `${base}?${queryString}` : base
  }

  if (rawHref.includes("#")) {
    const [prefix, hashPart = ""] = rawHref.split("#")
    return `${prefix}#${applyQuery(hashPart)}`
  }

  return applyQuery(rawHref)
}

const href = computed(() => {
  const rawHref = isExternal(props.to) ? props.to : router.resolve(props.to).href
  if (!props.withToken) return rawHref
  const token = localStorage.getItem("TOKEN") || ""
  const seatId = sessionStorage.getItem("userName") || ""
  const bizType = sessionStorage.getItem("biztype") || ""
  const params: Record<string, string> = {}
  if (token) params.token = token
  if (seatId) params.seatId = seatId
  if (bizType) params.bizType = bizType
  if (!Object.keys(params).length) return rawHref
  return appendQuery(rawHref, params)
})

const handleOpen = (event: MouseEvent) => {
  if (!openInNewWindow.value) return
  const features = "noopener,noreferrer,width=1280,height=800"
  const newWindow = window.open(href.value, "_blank", features)
  if (newWindow?.focus) newWindow.focus()
  event.preventDefault()
}
</script>

<template>
  <a
    v-if="isExternal(props.to) || props.target === '_blank'"
    :href="href"
    :target="props.target || '_blank'"
    rel="noopener"
    @click="handleOpen"
  >
    <slot />
  </a>
  <router-link v-else :to="props.to">
    <slot />
  </router-link>
</template>
