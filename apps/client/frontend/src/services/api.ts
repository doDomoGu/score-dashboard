import axios from "axios";
import type { ITournament } from "@/types/tournament";
import type { IPlayer } from "@/types/player";

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", error);
    if (error.response) {
      // 服务器响应错误
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      // 请求发送失败
      console.error("Request failed:", error.request);
    } else {
      // 其他错误
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// 数据库赛事类型
export interface IDBTournament {
  id: number;
  title: string;
  category: "qiaoma" | "riichi";
  date: string;
  info?: any;
  created_at?: string;
  updated_at?: string;
  // 新增：统计字段
  player_count?: number;
  total_rounds?: number;
  completed_rounds?: number;
  is_completed?: boolean;
  round_totals?: RoundPlayerTotal[];
  player_totals?: PlayerGrandTotal[];
  champion?: Champion | null;
}

// 用户信息接口
export interface UserInfo {
  id: number;
  account: string;
  nickname: string;
}

// 玩家总分接口
export interface PlayerGrandTotal {
  user: UserInfo;
  score: number;
}

// 每轮玩家总分接口
export interface RoundPlayerTotal {
  round: number;
  player_totals: Array<{
    user: UserInfo;
    score: number;
  }>;
}

// 冠军接口
export interface Champion extends UserInfo {
  score: number;
}

// 数据库用户类型
export interface IDBUser {
  id: number;
  account: string;
  nickname: string;
  created_at?: string;
  updated_at?: string;
}

// API服务类
export class ApiService {
  // 健康检查
  static async healthCheck() {
    const response = await api.get("/api/health");
    return response.data;
  }

  // 赛事相关API
  static async getTournaments(): Promise<IDBTournament[]> {
    const response = await api.get("/api/tournaments");
    return response.data;
  }

  static async getTournamentById(id: number): Promise<IDBTournament> {
    const response = await api.get(`/api/tournaments/${id}`);
    return response.data;
  }

  static async createTournament(tournament: {
    title: string;
    category: "qiaoma" | "riichi";
    date: string;
    info?: any;
  }): Promise<IDBTournament> {
    const response = await api.post("/api/tournaments", tournament);
    return response.data;
  }

  // 用户相关API
  static async getUsers(): Promise<IDBUser[]> {
    const response = await api.get("/api/users");
    return response.data;
  }

  static async createUser(user: { account: string; nickname: string }): Promise<IDBUser> {
    const response = await api.post("/api/users", user);
    return response.data;
  }

  // 示例分数API（保留原有功能）
  static async getScores() {
    const response = await api.get("/api/scores");
    return response.data;
  }

  static async createScore(score: { player: string; score: number }) {
    const response = await api.post("/api/scores", score);
    return response.data;
  }
}

export default api;
