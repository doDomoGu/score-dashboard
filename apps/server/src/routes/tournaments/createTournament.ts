import { Request, Response } from "express";
import { pool } from "../../config/database";

// 创建赛事
export const createTournament = async (req: Request, res: Response) => {
  const { title, category, date, info } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "title, category, and date are required",
    });
  }

  if (!["qiaoma", "riichi"].includes(category)) {
    return res.status(400).json({
      error: "Invalid category",
      message: "category must be either 'qiaoma' or 'riichi'",
    });
  }

  try {
    const [result] = (await pool.execute(
      "INSERT INTO tournament (title, category, date, info) VALUES (?, ?, ?, ?)",
      [title, category, date, info ? JSON.stringify(info) : null]
    )) as any;

    const newTournament = {
      id: result.insertId,
      title,
      category,
      date,
      info, // 直接返回原始的 JSON 对象，不需要解析
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
