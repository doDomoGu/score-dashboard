<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ApiService } from "@/services/api";
import { ElMessage } from "element-plus";

const route = useRoute();

// 修复：获取路由参数 - 现在只需要获取 id
const tournamentId = parseInt(route.params.id as string);

// 定义数据结构
interface UserInfo {
  id: number;
  account: string;
  nickname: string;
}

interface PlayerGrandTotal {
  user: UserInfo;
  score: number;
}

interface RoundPlayerTotal {
  round: number;
  player_totals: Array<{
    user: UserInfo;
    score: number;
  }>;
}

interface Champion extends UserInfo {
  score: number;
}

interface TournamentData {
  id: number;
  title: string;
  category: string;
  date: string;
  info: {
    players: number[];
    round_number: number;
    scores: Array<{
      round: number;
      players: number[];
      scores: number[][];
    }>;
  };
  player_count: number;
  total_rounds: number;
  completed_rounds: number;
  is_completed: boolean;
  round_totals: RoundPlayerTotal[];
  player_totals: PlayerGrandTotal[];
  champion: Champion | null;
}

const tournament = ref<TournamentData | null>(null);
const loading = ref(true);

// 计算排名分数的函数（保持原有逻辑）
const calculateRankPoints = (scores: number[]): number[] => {
  const scoreWithIndex = scores.map((score, index) => ({ score, index }));
  scoreWithIndex.sort((a, b) => b.score - a.score);

  const points = new Array(scores.length).fill(0);
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

// 处理轮次数据，转换为显示格式
const roundsWithRanking = computed(() => {
  if (!tournament.value?.info?.scores) return [];

  return tournament.value.info.scores
    .map((roundScore, roundIdx) => {
      // 获取该轮次的总分（从round_totals中获取）
      const roundTotal = tournament.value?.round_totals.find((rt) => rt.round === roundIdx + 1);
      if (!roundTotal) return null;

      // 计算每局总分用于排名分数计算
      const gamesTotalScores = roundScore.players.map((playerId) => {
        return roundTotal.player_totals.find((pt) => pt.user.id === playerId)?.score || 0;
      });

      const rankPoints = calculateRankPoints(gamesTotalScores);

      // 创建玩家数据数组，按位置顺序（东南西北）
      const playersData = roundScore.players.map((playerId, index) => {
        const playerTotal = roundTotal.player_totals.find((pt) => pt.user.id === playerId);
        const score = playerTotal?.score || 0;
        const rankPoint = rankPoints[index];

        return {
          player: playerTotal?.user || { id: playerId, account: "unknown", nickname: "Unknown" },
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
        if (originalIndex !== -1) {
          playersData[originalIndex].rank = currentRank;
        }
      });

      return {
        number: roundIdx + 1,
        players: playersData.map((pd) => pd.player),
        scores: playersData.map((pd) => pd.score),
        playersData,
        totalScore: gamesTotalScores.reduce((sum, score) => sum + score, 0),
      };
    })
    .filter(Boolean);
});

// 计算累计排名分数
const cumulativeScores = computed(() => {
  const cumulative: { [playerId: number]: number } = {};

  if (!tournament.value?.player_totals) return cumulative;

  // 初始化所有玩家的累计分数
  tournament.value.player_totals.forEach((playerTotal) => {
    cumulative[playerTotal.user.id] = 0;
  });

  // 累加每轮的排名分数
  roundsWithRanking.value.forEach((round) => {
    round.playersData.forEach((playerData) => {
      cumulative[playerData.player.id] += playerData.rankPoint;
    });
  });

  return cumulative;
});

// 计算累计得分（实际分数）- 直接从API数据获取
const cumulativeRawScores = computed(() => {
  const cumulative: { [playerId: number]: number } = {};

  if (!tournament.value?.player_totals) return cumulative;

  tournament.value.player_totals.forEach((playerTotal) => {
    cumulative[playerTotal.user.id] = playerTotal.score;
  });

  return cumulative;
});

// 计算最终排名
const finalRanking = computed(() => {
  if (!tournament.value?.player_totals) return [];

  const players = tournament.value.player_totals.map((playerTotal) => ({
    id: playerTotal.user.id,
    name: playerTotal.user.nickname || playerTotal.user.account,
    rank: 0,
    totalPoints: cumulativeScores.value[playerTotal.user.id] || 0,
    totalRawScore: playerTotal.score,
  }));

  // 修改排序逻辑：先按排名分（totalPoints）降序，再按累计得分（totalRawScore）降序
  players.sort((a, b) => {
    // 首先按排名分降序排列
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // 如果排名分相同，则按累计得分降序排列
    return b.totalRawScore - a.totalRawScore;
  });

  let currentRank = 1;
  players.forEach((player, index) => {
    if (index > 0) {
      const prevPlayer = players[index - 1];
      // 只有当排名分和累计得分都不同时，才更新排名
      if (
        prevPlayer.totalPoints !== player.totalPoints ||
        prevPlayer.totalRawScore !== player.totalRawScore
      ) {
        currentRank = index + 1;
      }
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

// 格式化日期显示
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // 返回 YYYY-MM-DD 格式
  } catch {
    return dateString;
  }
};

// 加载赛事数据
const loadTournamentData = async () => {
  try {
    loading.value = true;

    // 修复：验证tournamentId是否有效
    if (isNaN(tournamentId)) {
      ElMessage.error("无效的赛事ID");
      return;
    }

    const data = await ApiService.getTournamentById(tournamentId);
    tournament.value = data;
  } catch (error) {
    console.error("Failed to load tournament data:", error);
    ElMessage.error("加载赛事数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTournamentData();
});
</script>

<template>
  <div class="tournament-detail">
    <!-- 标题区域 -->
    <div class="header">
      <div class="title-section">
        <h1 v-if="tournament">{{ tournament.title }}</h1>
        <h1 v-else>加载中...</h1>
        <p class="subtitle" v-if="tournament">
          {{ getCategoryName(tournament.category) }} · 赛事ID: {{ tournament.id }} · 共{{
            tournament.total_rounds
          }}轮 · 已完成{{ tournament.completed_rounds }}轮 · 比赛日期：{{
            formatDate(tournament.date)
          }}
        </p>
      </div>

      <!-- 累计排名榜 -->
      <div class="leaderboard" v-if="tournament && !loading">
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
      <div v-else-if="tournament" class="table-container">
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

              <!-- 四个玩家位置 -->
              <div
                v-for="(playerData, index) in round.playersData"
                :key="playerData.player.id"
                class="table-cell player-cell"
              >
                <div class="player-columns">
                  <span class="player-id">{{ playerData.player.id }}</span>
                  <span class="player-name">{{
                    playerData.player.nickname || playerData.player.account
                  }}</span>
                  <span
                    class="rank-points"
                    :style="{ background: getRankPointsColor(playerData.rank) }"
                  >
                    {{ playerData.rankPoint.toFixed(1) }}
                  </span>
                  <span class="score" :style="{ color: getScoreColor(playerData.score) }">
                    {{ formatScore(playerData.score) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else class="error-state">
        <p>未找到赛事数据</p>
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

  .error-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: white;
    font-size: 1.2rem;
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
      grid-template-columns: 120px 1fr 1fr 1fr 1fr;
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
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .table-container .main-table .table-row {
    grid-template-columns: 100px 1fr 1fr 1fr 1fr;
  }

  .player-columns {
    grid-template-columns: 50px 1fr 70px 70px !important;
    font-size: 0.75rem !important;
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
    grid-template-columns: 80px 1fr 1fr 1fr 1fr;
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
}
</style>
