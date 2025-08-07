import { Request, Response } from "express";
import { pool } from "../../config/database";

// 更新赛事
export const updateTournament = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, category, date, info } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      error: "Invalid tournament ID",
      message: "Tournament ID must be a valid number",
    });
  }

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
      "UPDATE tournament SET title = ?, category = ?, date = ?, info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, category, date, info ? JSON.stringify(info) : null, id]
    )) as any;

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Tournament not found",
        message: `Tournament with ID ${id} does not exist`,
      });
    }

    // 返回更新后的赛事
    const [updatedRows] = (await pool.execute(
      "SELECT id, title, category, date, info, created_at, updated_at FROM tournament WHERE id = ?",
      [id]
    )) as any[];

    res.json(updatedRows[0]);
  } catch (error) {
    console.error("Error updating tournament:", error);
    res.status(500).json({
      error: "Failed to update tournament",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
