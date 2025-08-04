# Score Dashboard

一个基于 pnpm workspace 的 monorepo 项目，包含前端和后端应用。

## 项目结构

```
score-dashboard/
├── apps/
│   ├── client/
│   │   ├── frontend/     # Vue3前端应用
│   │   └── backend/      # Vue3后台管理应用
│   └── server/           # Express API服务器
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动前端应用
pnpm dev:frontend    # http://localhost:5173

# 启动后台管理应用
pnpm dev:backend     # http://localhost:5174

# 启动API服务器
pnpm dev:server      # http://localhost:3000

# 同时启动前端应用
pnpm dev:all

# 启动所有应用（包括服务器）
pnpm dev:full
```

### 构建

```bash
# 构建前端应用
pnpm build:frontend
pnpm build:backend

# 构建服务器
pnpm build:server

# 构建所有应用
pnpm build:full
```

## 应用说明

### Frontend (Vue3)

- **端口**: 5173
- **技术栈**: Vue3 + TypeScript + Vue Router + Pinia + ESLint
- **用途**: 主要的前端用户界面

### Backend (Vue3)

- **端口**: 5174
- **技术栈**: Vue3 + TypeScript + Vue Router + Pinia + ESLint
- **用途**: 后台管理界面

### Server (Express)

- **端口**: 3000
- **技术栈**: Express + TypeScript + CORS + Helmet
- **用途**: RESTful API 服务器

## API 文档

### 基本端点

- `GET /` - 服务器信息
- `GET /api/health` - 健康检查
- `GET /api/scores` - 获取分数列表
- `POST /api/scores` - 创建新分数

## 开发规范

- 使用 TypeScript 进行类型安全开发
- 前端应用已配置 CORS 可以访问 API 服务器
- 使用 ESLint 进行代码质量检查
- 支持热重载开发体验
