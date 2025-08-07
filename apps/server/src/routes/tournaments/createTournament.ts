import { Request, Response } from "express";
import { pool } from "../../config/database";

// 定义赛事信息结构
interface TournamentInfo {
  players: number[]; // 参加赛事的 user.id 数组
  round_number: number; // 赛事总轮次数
  scores: Array<{
    round: number;
    players: number[];
    scores: number[][];
  }>; // 每轮得分情况，初始为空数组
}

// 创建赛事
export const createTournament = async (req: Request, res: Response) => {
  const { title, category = "qiaoma", players } = req.body;

  // 基本字段验证
  if (!title) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "title is required",
    });
  }

  if (!["qiaoma", "riichi"].includes(category)) {
    return res.status(400).json({
      error: "Invalid category",
      message: "category must be either 'qiaoma' or 'riichi'",
    });
  }

  // 玩家数量验证
  if (!players || !Array.isArray(players)) {
    return res.status(400).json({
      error: "Missing or invalid players",
      message: "players must be an array of player IDs",
    });
  }

  if (players.length !== 4 && players.length !== 5) {
    return res.status(400).json({
      error: "Invalid player count",
      message: "Only 4 or 5 players are allowed",
    });
  }

  // 验证玩家ID都是数字
  const invalidPlayers = players.filter(
    (id) => !Number.isInteger(id) || id <= 0
  );
  if (invalidPlayers.length > 0) {
    return res.status(400).json({
      error: "Invalid player IDs",
      message: "All player IDs must be positive integers",
    });
  }

  // 验证玩家ID是否重复
  const uniquePlayers = [...new Set(players)];
  if (uniquePlayers.length !== players.length) {
    return res.status(400).json({
      error: "Duplicate players",
      message: "Player IDs must be unique",
    });
  }

  try {
    // 验证玩家是否存在于数据库中
    const placeholders = players.map(() => "?").join(",");
    const [userRows] = (await pool.execute(
      `SELECT id FROM user WHERE id IN (${placeholders})`,
      players
    )) as any[];

    if (userRows.length !== players.length) {
      const existingIds = userRows.map((row: any) => row.id);
      const missingIds = players.filter((id) => !existingIds.includes(id));
      return res.status(400).json({
        error: "Players not found",
        message: `Player IDs not found in database: ${missingIds.join(", ")}`,
      });
    }

    // 根据玩家数量设置轮次数：4人或5人都是5轮
    const round_number = 5;

    // 构建赛事信息
    const info: TournamentInfo = {
      players: players,
      round_number: round_number,
      scores: [], // 初始为空，比赛开始后逐轮添加
    };

    // 使用当前日期作为比赛日期
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 格式

    // 插入赛事数据
    const [result] = (await pool.execute(
      "INSERT INTO tournament (title, category, date, info) VALUES (?, ?, ?, ?)",
      [title, category, date, JSON.stringify(info)]
    )) as any;

    // 构建返回数据
    const newTournament = {
      id: result.insertId,
      title,
      category,
      date,
      info,
      player_count: players.length,
      total_rounds: round_number,
      completed_rounds: 0,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(newTournament);
  } catch (error) {
    console.error("Error creating tournament:", error);
    res.status(500).json({
      error: "Failed to create tournament",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
