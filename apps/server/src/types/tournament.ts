// 定义赛事相关的类型

export interface TournamentInfo {
  players: number[]; // 参加赛事的 user.id 数组
  round_number: number; // 赛事总轮次数
  scores: RoundScore[]; // 每轮得分情况
}

export interface RoundScore {
  round: number; // 轮次编号 (1, 2, 3, ...)
  players: number[]; // 该轮次参加的 user.id
  scores: GameScore[]; // 该轮次中每一局的得分情况
}

export interface GameScore {
  game: number; // 局数编号 (1, 2, 3, ...)
  scores: number[]; // 每个玩家的得分数组，顺序与 players 一致
}

// 计算每轮玩家总分的接口
export interface RoundPlayerTotal {
  round: number;
  player_totals: {
    [userId: number]: number;
  };
}

// 计算每个玩家在所有轮次中的总分
export interface PlayerGrandTotal {
  [userId: number]: number;
}

export interface Tournament {
  id: number;
  title: string;
  category: "qiaoma" | "riichi";
  date: string;
  info: TournamentInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface TournamentWithStats extends Tournament {
  player_count: number; // 参赛人数
  total_rounds: number; // 总轮次数
  completed_rounds: number; // 已完成轮次数
  is_completed: boolean; // 是否已完成所有轮次
  round_totals: RoundPlayerTotal[]; // 每轮次玩家得分统计
  player_totals: PlayerGrandTotal; // 玩家总分统计
  champion_id: number | null; // 冠军玩家ID
  champion_score: number | null; // 冠军得分
}

// 示例数据，展示正确的数据结构
export const exampleTournamentInfo: TournamentInfo = {
  players: [1, 2, 3, 4], // 4名玩家参赛
  round_number: 2, // 共2轮
  scores: [
    {
      round: 1,
      players: [1, 2, 3, 4], // 第1轮：玩家1,2,3,4参加
      scores: [
        {
          game: 1, // 第1局
          scores: [25000, 20000, 15000, 10000], // 分别对应玩家1,2,3,4的得分
        },
        {
          game: 2, // 第2局
          scores: [30000, 25000, 20000, 15000], // 分别对应玩家1,2,3,4的得分
        },
      ],
    },
    {
      round: 2,
      players: [1, 2, 3, 4], // 第2轮：玩家1,2,3,4参加
      scores: [
        {
          game: 1, // 第1局
          scores: [20000, 30000, 25000, 15000], // 分别对应玩家1,2,3,4的得分
        },
      ],
    },
  ],
};

// 上述示例的计算结果
export const exampleCalculationResult = {
  round_totals: [
    {
      round: 1,
      player_totals: { 1: 55000, 2: 45000, 3: 35000, 4: 25000 }, // 第1轮每位玩家总分
    },
    {
      round: 2,
      player_totals: { 1: 20000, 2: 30000, 3: 25000, 4: 15000 }, // 第2轮每位玩家总分
    },
  ],
  player_totals: { 1: 75000, 2: 75000, 3: 60000, 4: 40000 }, // 每位玩家的总分
  champion_id: 2, // ID较大的玩家获胜（如果分数相同）
  champion_score: 75000,
};
