<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import type { IRound } from "@/types/round";
import type { IPlayer } from "@/types/player";

const route = useRoute();

// 获取路由参数
const category = route.params.category as string;
const session = parseInt(route.params.number as string);

const rounds = ref<IRound[]>([]);
const loading = ref(true);

const mockPlayers: (IPlayer & { rank: number })[] = [
  { id: 1, name: "张三", rank: 0 },
  { id: 2, name: "李四", rank: 0 },
  { id: 3, name: "王五", rank: 0 },
  { id: 4, name: "赵六", rank: 0 },
  { id: 5, name: "孙七", rank: 0 },
];

// 5人单循环，共5轮，每轮4人参赛，轮空1人
// 修改：避免3人同分，打乱分数顺序
const mockRounds: IRound[] = [
  {
    number: 1,
    players: [mockPlayers[0], mockPlayers[1], mockPlayers[2], mockPlayers[3]], // 孙七轮空
    scores: [-30, 45, -35, 20], // 打乱分数顺序，4个不同分数
  },
  {
    number: 2,
    players: [mockPlayers[1], mockPlayers[2], mockPlayers[3], mockPlayers[4]], // 张三轮空
    scores: [25, -100, 50, 10], // 打乱分数顺序，4个不同分数
  },
  {
    number: 3,
    players: [mockPlayers[2], mockPlayers[3], mockPlayers[4], mockPlayers[0]], // 李四轮空
    scores: [30, -90, 35, 25], // 打乱分数顺序，4个不同分数
  },
  {
    number: 4,
    players: [mockPlayers[3], mockPlayers[4], mockPlayers[0], mockPlayers[1]], // 王五轮空
    scores: [-20, 60, -15, -25], // 打乱分数顺序，4个不同分数
  },
  {
    number: 5,
    players: [mockPlayers[4], mockPlayers[0], mockPlayers[1], mockPlayers[2]], // 赵六轮空
    scores: [15, -45, 20, 10], // 打乱分数顺序，4个不同分数
  },
];

// 获取轮空玩家
const getByePlayer = (roundNumber: number): IPlayer => {
  switch (roundNumber) {
    case 1:
      return mockPlayers[4]; // 孙七轮空
    case 2:
      return mockPlayers[0]; // 张三轮空
    case 3:
      return mockPlayers[1]; // 李四轮空
    case 4:
      return mockPlayers[2]; // 王五轮空
    case 5:
      return mockPlayers[3]; // 赵六轮空
    default:
      return mockPlayers[0];
  }
};

// 计算排名分数的函数
const calculateRankPoints = (scores: number[]): number[] => {
  const scoreWithIndex = scores.map((score, index) => ({ score, index }));
  scoreWithIndex.sort((a, b) => b.score - a.score);

  const points = new Array(4).fill(0);
  const basePoints = [4, 3, 2, 1];

  let i = 0;
  while (i < scoreWithIndex.length) {
    const currentScore = scoreWithIndex[i].score;
    const sameScorePlayers = [];
    let j = i;

    while (j < scoreWithIndex.length && scoreWithIndex[j].score === currentScore) {
      sameScorePlayers.push(scoreWithIndex[j]);
      j++;
    }

    let totalPoints = 0;
    for (let k = 0; k < sameScorePlayers.length; k++) {
      totalPoints += basePoints[i + k];
    }
    const averagePoints = totalPoints / sameScorePlayers.length;

    sameScorePlayers.forEach((player) => {
      points[player.index] = averagePoints;
    });

    i = j;
  }

  return points;
};

// 计算每轮的排名和排名分数
const roundsWithRanking = computed(() => {
  return rounds.value.map((round) => {
    const rankPoints = calculateRankPoints(round.scores);

    // 创建玩家数据数组，按位置顺序（东南西北）
    const playersData = round.players.map((player, index) => {
      const score = round.scores[index];
      const rankPoint = rankPoints[index];

      return {
        player,
        score,
        rankPoint,
        position: ["东家", "南家", "西家", "北家"][index],
      };
    });

    // 计算排名（按分数排序）
    const sortedForRank = [...playersData].sort((a, b) => b.score - a.score);
    let currentRank = 1;
    sortedForRank.forEach((playerData, index) => {
      if (index > 0 && sortedForRank[index - 1].score !== playerData.score) {
        currentRank = index + 1;
      }
      // 找到原数组中对应的玩家并设置排名
      const originalIndex = playersData.findIndex((p) => p.player.id === playerData.player.id);
      playersData[originalIndex].rank = currentRank;
    });

    return {
      ...round,
      playersData,
      byePlayer: getByePlayer(round.number),
      totalScore: round.scores.reduce((sum, score) => sum + score, 0),
    };
  });
});

// 计算累计排名分数
const cumulativeScores = computed(() => {
  const cumulative: { [playerId: number]: number } = {};

  mockPlayers.forEach((player) => {
    cumulative[player.id] = 0;
  });

  roundsWithRanking.value.forEach((round) => {
    round.playersData.forEach((playerData) => {
      cumulative[playerData.player.id] += playerData.rankPoint;
    });
  });

  return cumulative;
});

// 计算累计得分（实际分数）
const cumulativeRawScores = computed(() => {
  const cumulative: { [playerId: number]: number } = {};

  mockPlayers.forEach((player) => {
    cumulative[player.id] = 0;
  });

  roundsWithRanking.value.forEach((round) => {
    round.playersData.forEach((playerData) => {
      cumulative[playerData.player.id] += playerData.score;
    });
  });

  return cumulative;
});

// 计算最终排名
const finalRanking = computed(() => {
  const players = mockPlayers.map((player) => ({
    ...player,
    totalPoints: cumulativeScores.value[player.id],
    totalRawScore: cumulativeRawScores.value[player.id],
  }));

  players.sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  players.forEach((player, index) => {
    if (index > 0 && players[index - 1].totalPoints !== player.totalPoints) {
      currentRank = index + 1;
    }
    player.rank = currentRank;
  });

  return players;
});

// 获取赛事类型的中文名称
const getCategoryName = (category: string) => {
  switch (category) {
    case "qiaoma":
      return "敲麻";
    case "riichi":
      return "日麻";
    default:
      return category;
  }
};

// 获取排名图标
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    case 4:
      return "4️⃣";
    default:
      return "5️⃣";
  }
};

// 格式化分数显示
const formatScore = (score: number) => {
  return score > 0 ? `+${score}` : score.toString();
};

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score > 0) return "#28a745";
  if (score < 0) return "#dc3545";
  return "#6c757d";
};

// 根据排名获取排名分数颜色
const getRankPointsColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "linear-gradient(135deg, #FFD700, #FFA500)"; // 金色
    case 2:
      return "linear-gradient(135deg, #C0C0C0, #A9A9A9)"; // 银色
    case 3:
      return "linear-gradient(135deg, #CD7F32, #B87333)"; // 铜色
    case 4:
      return "linear-gradient(135deg, #808080, #696969)"; // 铁色/灰色
    default:
      return "linear-gradient(135deg, #6c757d, #495057)"; // 默认灰色
  }
};

onMounted(() => {
  setTimeout(() => {
    rounds.value = mockRounds;
    loading.value = false;
  }, 1000);
});
</script>

<template>
  <div class="tournament-detail">
    <!-- 标题区域 -->
    <div class="header">
      <div class="title-section">
        <h1>第{{ session }}届 {{ getCategoryName(category) }}</h1>
        <p class="subtitle">对战详情 · 共{{ rounds.length }}轮 · 东南西北座次</p>
      </div>

      <!-- 累计排名榜 -->
      <div class="leaderboard">
        <h3>最终排名</h3>
        <div class="ranking-cards">
          <div
            v-for="player in finalRanking"
            :key="player.id"
            class="ranking-card"
            :class="{ 'top-rank': player.rank <= 3 }"
          >
            <div class="rank-icon">{{ getRankIcon(player.rank) }}</div>
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span class="total-points">排名分: {{ player.totalPoints.toFixed(1) }}分</span>
              <span class="total-raw-score" :style="{ color: getScoreColor(player.totalRawScore) }">
                累计得分: {{ formatScore(player.totalRawScore) }}
              </span>
              <span class="final-rank">第{{ player.rank }}名</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对战记录表格 -->
    <div class="content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载对战数据中...</p>
      </div>

      <!-- 对战数据表格 -->
      <div v-else class="table-container">
        <div class="main-table">
          <!-- 表头 -->
          <div class="table-header">
            <!-- 主表头 -->
            <div class="table-row main-header-row">
              <div class="table-cell round-header">轮次</div>
              <div class="table-cell position-header">东家</div>
              <div class="table-cell position-header">南家</div>
              <div class="table-cell position-header">西家</div>
              <div class="table-cell position-header">北家</div>
              <div class="table-cell bye-header">轮空玩家</div>
            </div>
            <!-- 子表头 -->
            <div class="table-row sub-header-row">
              <div class="table-cell round-subheader"></div>
              <div class="table-cell player-subheader">
                <div class="sub-columns">
                  <span>ID</span>
                  <span>姓名</span>
                  <span>排名分</span>
                  <span>得分</span>
                </div>
              </div>
              <div class="table-cell player-subheader">
                <div class="sub-columns">
                  <span>ID</span>
                  <span>姓名</span>
                  <span>排名分</span>
                  <span>得分</span>
                </div>
              </div>
              <div class="table-cell player-subheader">
                <div class="sub-columns">
                  <span>ID</span>
                  <span>姓名</span>
                  <span>排名分</span>
                  <span>得分</span>
                </div>
              </div>
              <div class="table-cell player-subheader">
                <div class="sub-columns">
                  <span>ID</span>
                  <span>姓名</span>
                  <span>排名分</span>
                  <span>得分</span>
                </div>
              </div>
              <div class="table-cell bye-subheader">
                <div class="bye-sub-columns">
                  <span>ID</span>
                  <span>姓名</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 表体 -->
          <div class="table-body">
            <div v-for="round in roundsWithRanking" :key="round.number" class="table-row data-row">
              <!-- 轮次 -->
              <div class="table-cell round-cell">
                <div class="round-info">
                  <span class="round-number">第{{ round.number }}轮</span>
                </div>
              </div>

              <!-- 东家 -->
              <div class="table-cell player-cell">
                <div class="player-columns">
                  <span class="player-id">{{ round.playersData[0].player.id }}</span>
                  <span class="player-name">{{ round.playersData[0].player.name }}</span>
                  <span
                    class="rank-points"
                    :style="{ background: getRankPointsColor(round.playersData[0].rank) }"
                  >
                    {{ round.playersData[0].rankPoint.toFixed(1) }}
                  </span>
                  <span class="score" :style="{ color: getScoreColor(round.playersData[0].score) }">
                    {{ formatScore(round.playersData[0].score) }}
                  </span>
                </div>
              </div>

              <!-- 南家 -->
              <div class="table-cell player-cell">
                <div class="player-columns">
                  <span class="player-id">{{ round.playersData[1].player.id }}</span>
                  <span class="player-name">{{ round.playersData[1].player.name }}</span>
                  <span
                    class="rank-points"
                    :style="{ background: getRankPointsColor(round.playersData[1].rank) }"
                  >
                    {{ round.playersData[1].rankPoint.toFixed(1) }}
                  </span>
                  <span class="score" :style="{ color: getScoreColor(round.playersData[1].score) }">
                    {{ formatScore(round.playersData[1].score) }}
                  </span>
                </div>
              </div>

              <!-- 西家 -->
              <div class="table-cell player-cell">
                <div class="player-columns">
                  <span class="player-id">{{ round.playersData[2].player.id }}</span>
                  <span class="player-name">{{ round.playersData[2].player.name }}</span>
                  <span
                    class="rank-points"
                    :style="{ background: getRankPointsColor(round.playersData[2].rank) }"
                  >
                    {{ round.playersData[2].rankPoint.toFixed(1) }}
                  </span>
                  <span class="score" :style="{ color: getScoreColor(round.playersData[2].score) }">
                    {{ formatScore(round.playersData[2].score) }}
                  </span>
                </div>
              </div>

              <!-- 北家 -->
              <div class="table-cell player-cell">
                <div class="player-columns">
                  <span class="player-id">{{ round.playersData[3].player.id }}</span>
                  <span class="player-name">{{ round.playersData[3].player.name }}</span>
                  <span
                    class="rank-points"
                    :style="{ background: getRankPointsColor(round.playersData[3].rank) }"
                  >
                    {{ round.playersData[3].rankPoint.toFixed(1) }}
                  </span>
                  <span class="score" :style="{ color: getScoreColor(round.playersData[3].score) }">
                    {{ formatScore(round.playersData[3].score) }}
                  </span>
                </div>
              </div>

              <!-- 轮空玩家 -->
              <div class="table-cell bye-cell">
                <div class="bye-player-info">
                  <span class="bye-player-id">{{ round.byePlayer.id }}</span>
                  <span class="bye-player-name">{{ round.byePlayer.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tournament-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  .title-section {
    margin-bottom: 30px;

    h1 {
      color: white;
      margin: 0 0 10px 0;
      font-size: 2.5rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      font-size: 1.125rem;
    }
  }

  .leaderboard {
    h3 {
      color: white;
      margin: 0 0 20px 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .ranking-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;

      .ranking-card {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: all 0.3s ease;

        &.top-rank {
          background: rgba(255, 215, 0, 0.2);
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .rank-icon {
          font-size: 2rem;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 3px;

          .player-name {
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
          }

          .total-points {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.875rem;
            font-weight: 500;
          }

          .total-raw-score {
            font-size: 0.875rem;
            font-weight: 500;
          }

          .final-rank {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.75rem;
          }
        }
      }
    }
  }
}

.content {
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    padding: 60px 20px;

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    p {
      font-size: 1.125rem;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);

  .main-table {
    width: 100%;

    .table-header {
      background: linear-gradient(135deg, #667eea, #5a7bc8);
      color: white;

      .main-header-row {
        .table-cell {
          font-weight: bold;
          font-size: 1rem;
          text-align: center;
          padding: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }
      }

      .sub-header-row {
        .table-cell {
          padding: 10px;
          border-bottom: none;
        }

        .round-subheader {
          // 空白区域
        }

        .player-subheader {
          .sub-columns {
            display: grid;
            grid-template-columns: 60px 1fr 80px 80px;
            gap: 5px;
            font-size: 0.75rem;
            font-weight: 500;
            text-align: center;

            span {
              color: rgba(255, 255, 255, 0.9);
            }
          }
        }

        .bye-subheader {
          .bye-sub-columns {
            display: grid;
            grid-template-columns: 60px 1fr;
            gap: 5px;
            font-size: 0.75rem;
            font-weight: 500;
            text-align: center;

            span {
              color: rgba(255, 255, 255, 0.9);
            }
          }
        }
      }
    }

    .table-body {
      .data-row {
        border-bottom: 1px solid #e1e5e9;
        transition: all 0.2s ease;

        &:hover {
          background-color: #f8f9fa;
        }

        &:last-child {
          border-bottom: none;
        }
      }
    }

    .table-row {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 1fr 1fr 150px;
      min-height: 60px;
      align-items: center;
    }

    .table-cell {
      padding: 15px;
      border-right: 1px solid #e1e5e9;

      &:last-child {
        border-right: none;
      }
    }

    .round-cell {
      text-align: center;

      .round-info {
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: center;

        .round-number {
          font-weight: bold;
          color: #2c3e50;
          font-size: 1rem;
        }
      }
    }

    .player-cell {
      .player-columns {
        display: grid;
        grid-template-columns: 60px 1fr 80px 80px;
        gap: 5px;
        align-items: center;
        text-align: center;

        .player-id {
          color: #6c757d;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }

        .player-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.875rem;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rank-points {
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 0.75rem;
          text-align: center;
        }

        .score {
          font-weight: bold;
          font-size: 0.875rem;
          font-family: "Courier New", monospace;
          text-align: center;
        }
      }
    }

    .bye-cell {
      background: rgba(108, 117, 125, 0.1);

      .bye-player-info {
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 5px;
        align-items: center;
        text-align: center;

        .bye-player-id {
          color: #6c757d;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }

        .bye-player-name {
          font-weight: 600;
          color: #6c757d;
          font-size: 0.875rem;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .table-container .main-table .table-row {
    grid-template-columns: 100px 1fr 1fr 1fr 1fr 120px;
  }

  .player-columns {
    grid-template-columns: 50px 1fr 70px 70px !important;
    font-size: 0.75rem !important;
  }

  .bye-player-info {
    grid-template-columns: 50px 1fr !important;
  }
}

@media (max-width: 768px) {
  .tournament-detail {
    padding: 15px;
  }

  .header {
    padding: 20px;

    .title-section h1 {
      font-size: 2rem;
    }

    .leaderboard .ranking-cards {
      grid-template-columns: 1fr;
    }
  }

  .table-container .main-table .table-row {
    grid-template-columns: 80px 1fr 1fr 1fr 1fr 100px;
    min-height: 80px;
  }

  .table-cell {
    padding: 8px !important;
  }

  .player-columns {
    grid-template-columns: 40px 1fr 60px 60px !important;
    gap: 3px !important;
    font-size: 0.7rem !important;
  }

  .sub-columns {
    grid-template-columns: 40px 1fr 60px 60px !important;
    font-size: 0.625rem !important;
  }

  .bye-player-info {
    grid-template-columns: 40px 1fr !important;
  }

  .bye-sub-columns {
    grid-template-columns: 40px 1fr !important;
    font-size: 0.625rem !important;
  }
}
</style>
