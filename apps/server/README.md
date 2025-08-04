# Express Server API

基于 TypeScript 和 Express 的服务端应用。

## 功能特性

- ✅ TypeScript 支持
- ✅ Express.js 框架
- ✅ CORS 配置（支持前端应用访问）
- ✅ 安全头设置（Helmet）
- ✅ 环境变量配置
- ✅ 热重载开发（tsx watch）
- ✅ ESLint 代码检查

## API 端点

### 基本信息

- `GET /` - 服务器信息
- `GET /api/health` - 健康检查

### 分数管理

- `GET /api/scores` - 获取所有分数
- `POST /api/scores` - 添加新分数

## 开发

```bash
# 开发模式（带热重载）
pnpm dev

# 构建
pnpm build

# 生产模式启动
pnpm start

# 代码检查
pnpm lint
pnpm lint:fix
```

## 环境变量

复制 `.env` 文件并根据需要修改：

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```
