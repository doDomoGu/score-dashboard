import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// API路由 - 获取用户列表
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, account, nickname, created_at, updated_at FROM user ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API路由 - 创建用户
router.post("/", async (req: Request, res: Response) => {
  const { account, nickname } = req.body;

  if (!account || !nickname) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "account and nickname are required",
    });
  }

  try {
    const [result] = (await pool.execute(
      "INSERT INTO user (account, nickname) VALUES (?, ?)",
      [account, nickname]
    )) as any;

    const newUser = {
      id: result.insertId,
      account,
      nickname,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);

    // 处理重复账号错误
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Account already exists",
        message: "This account is already registered",
      });
    }

    res.status(500).json({
      error: "Failed to create user",
      message: error.message || "Unknown error",
    });
  }
});

// API路由 - 根据ID获取单个用户
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      error: "Invalid user ID",
      message: "User ID must be a valid number",
    });
  }

  try {
    const [rows] = (await pool.execute(
      "SELECT id, account, nickname, created_at, updated_at FROM user WHERE id = ?",
      [id]
    )) as any[];

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        message: `User with ID ${id} does not exist`,
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      error: "Failed to fetch user",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API路由 - 更新用户
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { account, nickname } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      error: "Invalid user ID",
      message: "User ID must be a valid number",
    });
  }

  if (!account || !nickname) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "account and nickname are required",
    });
  }

  try {
    const [result] = (await pool.execute(
      "UPDATE user SET account = ?, nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [account, nickname, id]
    )) as any;

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "User not found",
        message: `User with ID ${id} does not exist`,
      });
    }

    // 返回更新后的用户
    const [updatedRows] = (await pool.execute(
      "SELECT id, account, nickname, created_at, updated_at FROM user WHERE id = ?",
      [id]
    )) as any[];

    res.json(updatedRows[0]);
  } catch (error: any) {
    console.error("Error updating user:", error);

    // 处理重复账号错误
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Account already exists",
        message: "This account is already registered",
      });
    }

    res.status(500).json({
      error: "Failed to update user",
      message: error.message || "Unknown error",
    });
  }
});

// API路由 - 删除用户
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      error: "Invalid user ID",
      message: "User ID must be a valid number",
    });
  }

  try {
    // 先获取要删除的用户信息
    const [rows] = (await pool.execute(
      "SELECT id, account, nickname FROM user WHERE id = ?",
      [id]
    )) as any[];

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        message: `User with ID ${id} does not exist`,
      });
    }

    // 删除用户
    await pool.execute("DELETE FROM user WHERE id = ?", [id]);

    res.json({
      message: "User deleted successfully",
      deletedUser: rows[0],
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      error: "Failed to delete user",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
