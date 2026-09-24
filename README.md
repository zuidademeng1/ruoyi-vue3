<p align="center">
	<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">RuoYi-Vue3</h1>
	<h4 align="center">基于 Vue3 + Element Plus + Vite 的若依前后端分离管理系统前端</h4>
</p>

## 项目简介

本仓库为 [RuoYi-Vue3](https://gitee.com/y_project/RuoYi-Vue) 的二次开发版本，在若依管理系统前端的基础上做了一些界面与功能定制。

## 技术栈

- 前端框架：[Vue 3](https://v3.cn.vuejs.org)
- UI 组件库：[Element Plus](https://element-plus.org/zh-CN)
- 构建工具：[Vite](https://cn.vitejs.dev)
- 状态管理：[Pinia](https://pinia.vuejs.org)
- 路由管理：[Vue Router 4](https://router.vuejs.org)
- HTTP 请求：[Axios](https://axios-http.com)

## 前端运行

```bash
# 克隆项目
git clone https://github.com/zuidademeng1/ruoyi-vue3.git

# 进入项目目录
cd ruoyi-vue3

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

启动后浏览器会自动打开，访问地址：**http://localhost:80**

> 说明：本项目为前后端分离架构的**前端部分**，登录及数据展示需要同时启动配套的 RuoYi-Vue 后端（默认 8080 端口）。前端接口代理配置见 `vite.config.js`。

## 构建部署

```bash
# 构建测试环境
npm run build:stage

# 构建生产环境
npm run build:prod
```

## 致谢

- 原项目：[RuoYi-Vue3](https://gitee.com/y_project/RuoYi-Vue)，基于 MIT 协议开源。
