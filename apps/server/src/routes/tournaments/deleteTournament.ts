import { Request, Response } from "express";
import { pool } from "../../config/database";

// 删除赛事
export const deleteTournament = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      error: "Invalid tournament ID",
      message: "Tournament ID must be a valid number",
    });
  }

  try {
    // 先获取要删除的赛事信息
    const [rows] = (await pool.execute(
      "SELECT id, title FROM tournament WHERE id = ?",
      [id]
    )) as any[];

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Tournament not found",
        message: `Tournament with ID ${id} does not exist`,
      });
    }

    // 删除赛事
    await pool.execute("DELETE FROM tournament WHERE id = ?", [id]);

    res.json({
      message: "Tournament deleted successfully",
      deletedTournament: rows[0],
    });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    res.status(500).json({
      error: "Failed to delete tournament",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
