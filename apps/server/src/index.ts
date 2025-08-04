import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

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

// 路由
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Score Dashboard API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API路由
app.get("/api/scores", (req: Request, res: Response) => {
  // 示例数据
  const scores = [
    { id: 1, player: "Alice", score: 95, date: "2025-01-01" },
    { id: 2, player: "Bob", score: 87, date: "2025-01-02" },
    { id: 3, player: "Charlie", score: 92, date: "2025-01-03" },
  ];
  res.json(scores);
});

app.post("/api/scores", (req: Request, res: Response) => {
  const { player, score } = req.body;

  if (!player || typeof score !== "number") {
    return res.status(400).json({
      error: "Invalid input. Player name and numeric score are required.",
    });
  }

  const newScore = {
    id: Date.now(),
    player,
    score,
    date: new Date().toISOString().split("T")[0],
  };

  res.status(201).json(newScore);
});

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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Score Dashboard API is ready!`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
