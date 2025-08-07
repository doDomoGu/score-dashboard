import { Request, Response } from "express";
import { pool } from "../../config/database";

// 定义 tournament info 字段的类型
interface TournamentInfo {
  players: number[]; // 参加赛事的 user.id 数组
  round_number: number; // 赛事总轮次数
  scores: RoundScore[]; // 每轮得分情况
}

interface RoundScore {
  round: number; // 轮次编号
  players: number[]; // 该轮次参加的 user.id
  scores: number[][]; // 该轮次中每一局的得分情况
}

// 用户信息接口
interface UserInfo {
  id: number;
  account: string;
  nickname: string;
}

// 计算每轮玩家总分的接口（包含用户信息）
interface RoundPlayerTotal {
  round: number;
  player_totals: Array<{
    user: UserInfo;
    score: number;
  }>;
}

// 计算每个玩家在所有轮次中的总分（包含用户信息）
interface PlayerGrandTotal {
  user: UserInfo;
  score: number;
}

// 获取赛事列表
export const getTournaments = async (req: Request, res: Response) => {
  try {
    const [rows] = (await pool.execute(
      "SELECT id, title, category, date, info, created_at, updated_at FROM tournament ORDER BY date DESC"
    )) as any[];

    // 处理 info 字段，直接使用对象
    const processedTournaments = await Promise.all(
      rows.map(async (tournament: any) => {
        const info: TournamentInfo | null = tournament.info;

        // 获取所有相关用户信息
        const allUserIds = info?.players || [];
        let usersMap: Map<number, UserInfo> = new Map();

        if (allUserIds.length > 0) {
          const placeholders = allUserIds.map(() => "?").join(",");
          const [userRows] = (await pool.execute(
            `SELECT id, account, nickname FROM user WHERE id IN (${placeholders})`,
            allUserIds
          )) as any[];

          userRows.forEach((user: any) => {
            usersMap.set(user.id, {
              id: user.id,
              account: user.account,
              nickname: user.nickname,
            });
          });
        }

        // 计算每轮次每位玩家的总分
        const roundPlayerTotals: RoundPlayerTotal[] = [];
        const playerScoreMap: Map<number, number> = new Map();

        if (info?.scores) {
          info.scores.forEach((roundScore, roundIdx) => {
            const roundPlayerScores: Map<number, number> = new Map();

            // 初始化该轮次所有参与玩家的得分为0
            roundScore.players.forEach((playerId) => {
              roundPlayerScores.set(playerId, 0);
            });

            // 累加该轮次中每一局的得分
            roundScore.scores.forEach((gameScore) => {
              gameScore.forEach((score, playerIndex) => {
                const playerId = roundScore.players[playerIndex];
                if (playerId !== undefined && roundPlayerScores.has(playerId)) {
                  const currentScore = roundPlayerScores.get(playerId) || 0;
                  roundPlayerScores.set(playerId, currentScore + score);
                }
              });
            });

            // 将该轮次的总分加入到玩家的总分中
            roundPlayerScores.forEach((score, playerId) => {
              const currentGrandTotal = playerScoreMap.get(playerId) || 0;
              playerScoreMap.set(playerId, currentGrandTotal + score);
            });

            // 构造该轮次的玩家总分数组（按该轮次players顺序）
            const roundPlayerTotalArray = roundScore.players.map(
              (playerId) => ({
                user: usersMap.get(playerId) || {
                  id: playerId,
                  account: "unknown",
                  nickname: "Unknown",
                },
                score: roundPlayerScores.get(playerId) || 0,
              })
            );

            roundPlayerTotals.push({
              round: roundIdx + 1,
              player_totals: roundPlayerTotalArray,
            });
          });
        }

        // 构造玩家总分数组（按info.players原始顺序）
        const playerTotals: PlayerGrandTotal[] = (info?.players || []).map(
          (playerId) => ({
            user: usersMap.get(playerId) || {
              id: playerId,
              account: "unknown",
              nickname: "Unknown",
            },
            score: playerScoreMap.get(playerId) || 0,
          })
        );

        // 找出总分最高的玩家（冠军）
        let champion: (UserInfo & { score: number }) | null = null;
        let highestScore = -Infinity;
        playerTotals.forEach((playerTotal) => {
          if (playerTotal.score > highestScore) {
            highestScore = playerTotal.score;
            champion = {
              ...playerTotal.user,
              score: playerTotal.score,
            };
          }
        });

        return {
          ...tournament,
          info,
          // 添加一些便于前端使用的计算字段
          player_count: info?.players?.length || 0,
          total_rounds: info?.round_number || 0,
          completed_rounds: info?.scores?.length || 0,
          is_completed: info ? info.scores?.length >= info.round_number : false,
          // 新增：每轮次玩家得分统计（包含用户信息）
          round_totals: roundPlayerTotals,
          // 新增：玩家总分统计（包含用户信息，按原始顺序）
          player_totals: playerTotals,
          // 新增：冠军信息（包含用户信息和得分）
          champion: champion,
        };
      })
    );

    res.json(processedTournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({
      error: "Failed to fetch tournaments",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
