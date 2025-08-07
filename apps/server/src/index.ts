import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { pool, testDatabaseConnection } from "./config/database";
import tournamentsRouter from "./routes/tournaments"; // 这个现在指向tournaments/index.ts
import usersRouter from "./routes/users";

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet()); // 安全头
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 基础路由
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Score Dashboard API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", async (req: Request, res: Response) => {
  try {
    // 检查数据库连接状态
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT 1 as status");
    connection.release();

    res.json({
      status: "OK",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "Connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "Disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 挂载路由
app.use("/api/tournaments", tournamentsRouter);
app.use("/api/users", usersRouter);

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404处理
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Score Dashboard API is ready!`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  // 测试数据库连接
  await testDatabaseConnection();
});

// 优雅关闭
process.on("SIGINT", async () => {
  console.log("\n📴 Shutting down server...");
  await pool.end();
  process.exit(0);
});
