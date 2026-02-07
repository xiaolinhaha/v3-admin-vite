/// <reference types="vitest/config" />

import { resolve } from "node:path"
import vue from "@vitejs/plugin-vue"
import UnoCSS from "unocss/vite"
import AutoImport from "unplugin-auto-import/vite"
import SvgComponent from "unplugin-svg-component/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"
import { defineConfig, loadEnv } from "vite"
import { VueMcp } from "vite-plugin-vue-mcp"
import svgLoader from "vite-svg-loader"

const proxyConfigure = (proxy: any, _options: any) => {
  proxy.on("proxyRes", (proxyRes: any, _req: any, _res: any) => {
    const cookies = proxyRes.headers["set-cookie"]
    if (cookies) {
      proxyRes.headers["set-cookie"] = cookies.map((cookie: any) => {
        return cookie.replace(/; secure/gi, "").replace(/; SameSite=None/gi, "")
      })
    }
  })
}

// Configuring Vite: https://cn.vite.dev/config
export default defineConfig(({ mode }) => {
  const { VITE_PUBLIC_PATH } = loadEnv(mode, process.cwd(), "") as ImportMetaEnv
  return {
    // 开发或打包构建时用到的公共基础路径
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        // @ 符号指向 src 目录
        "@": resolve(__dirname, "src"),
        // @@ 符号指向 src/common 通用目录
        "@@": resolve(__dirname, "src/common")
      }
    },
    // 开发环境服务器配置
    server: {
      // 是否监听所有地址
      host: true,
      // 端口号
      port: 3333,
      // 端口被占用时，是否直接退出
      strictPort: false,
      // 是否自动打开浏览器
      open: true,
      // 反向代理
      proxy: {
        "/api/v1": {
          target: "https://apifoxmock.com/m1/2930465-2145633-default",
          // 是否为 WebSocket
          ws: false,
          // 是否允许跨域
          changeOrigin: true
        },
        "/iopApiAdmin/nebula": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.152.7.38:8762", // 位士
          target: "https://malla.leagpoint.com", // 测试环境
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/iop": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.152.7.89:8762",  //龙建军
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/ieport": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.6.22:8762",
          // target: "http://localhost:8762",
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/record": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.7.26:8762", // 测试
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/rule": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.152.6.50:8762",  //kangkang
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.6.22:8762",
          // target: "http://10.192.247.76:8762",
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/api": {
          // target: "http://10.152.5.143:8762",  //swagger 路劲替换免登录
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.6.65:8762",  //龙建军
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/bot": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.192.247.76:8762",
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/iopApiAdmin/open": {
          // target: "http://10.188.44.153:8762", // 测试
          // target: "http://10.152.7.89:8762",  //龙建军
          // target: "http://10.152.6.195:8762",  //成
          // target: "http://10.192.247.76:8762",
          target: "https://malla.leagpoint.com", // 测试
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { "*": "" },
          configure: proxyConfigure
        },
        "/upload": {
          target: "http://10.152.143.75:49212",
          changeOrigin: true
        },
        "/robot/download": {
          target: "http://10.152.143.75:49212",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/robot\/download/, "/download")
        },
        "/robot/train": {
          target: "http://10.152.143.75:49211",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/robot\/train/, "/lgbm/train")
        },
        "/robot/predict": {
          target: "http://10.152.143.75:49211",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/robot\/predict/, "/lgbm/predict")
        }
      },
      // 是否允许跨域
      cors: true,
      // 预热常用文件，提高初始页面加载速度
      warmup: {
        clientFiles: [
          "./src/layouts/**/*.*",
          "./src/pinia/**/*.*",
          "./src/router/**/*.*"
        ]
      }
    },
    // 构建配置
    build: {
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        output: {
          /**
           * @name 分块策略
           * @description 1. 注意这些包名必须存在，否则打包会报错
           * @description 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            element: ["element-plus", "@element-plus/icons-vue"],
            vxe: ["vxe-table"]
          }
        }
      },
      // 是否开启 gzip 压缩大小报告，禁用时能略微提高构建性能
      reportCompressedSize: false,
      // 单个 chunk 文件的大小超过 2048kB 时发出警告
      chunkSizeWarningLimit: 2048
    },
    // 混淆器
    esbuild:
      mode === "development" || mode === "test"
        ? undefined
        : {
            // 打包构建时移除 console.log
            pure: ["console.log"],
            // 打包构建时移除 debugger
            drop: ["debugger"],
            // 打包构建时移除所有注释
            legalComments: "none"
          },
    // 依赖预构建
    optimizeDeps: {
      include: ["element-plus/es/components/*/style/css"]
    },
    // CSS 相关配置
    css: {
      // 线程中运行 CSS 预处理器
      preprocessorMaxWorkers: true
    },
    // 插件配置
    plugins: [
      vue(),
      // 支持将 SVG 文件导入为 Vue 组件
      svgLoader({
        defaultImport: "url",
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  // @see https://github.com/svg/svgo/issues/1128
                  removeViewBox: false
                }
              }
            }
          ]
        }
      }),
      // 自动生成 SvgIcon 组件和 SVG 雪碧图
      SvgComponent({
        iconDir: [resolve(__dirname, "src/common/assets/icons")],
        preserveColor: resolve(__dirname, "src/common/assets/icons/preserve-color"),
        dts: true,
        dtsDir: resolve(__dirname, "types/auto")
      }),
      // 原子化 CSS
      UnoCSS(),
      // 自动按需导入 API
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        dts: "types/auto/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()]
      }),
      // 自动按需导入组件
      Components({
        dts: "types/auto/components.d.ts",
        resolvers: [ElementPlusResolver()]
      }),
      // 为项目开启 MCP Server
      VueMcp()
    ],
    // Configuring Vitest: https://cn.vitest.dev/config
    test: {
      include: ["tests/**/*.test.{ts,js}"],
      environment: "happy-dom",
      server: {
        deps: {
          inline: ["element-plus"]
        }
      }
    }
  }
})
