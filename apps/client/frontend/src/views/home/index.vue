<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Score {
  id: number;
  player: string;
  score: number;
  date: string;
}

const scores = ref<Score[]>([]);
const loading = ref(true);

// 模拟数据
const mockData: Score[] = [
  { id: 1, player: "Alice", score: 95, date: "2025-01-01" },
  { id: 2, player: "Bob", score: 87, date: "2025-01-02" },
  { id: 3, player: "Charlie", score: 92, date: "2025-01-03" },
  { id: 4, player: "David", score: 88, date: "2025-01-04" },
  { id: 5, player: "Eve", score: 96, date: "2025-01-05" },
  { id: 6, player: "Frank", score: 79, date: "2025-01-06" },
  { id: 7, player: "Grace", score: 91, date: "2025-01-07" },
  { id: 8, player: "Henry", score: 85, date: "2025-01-08" },
  { id: 9, player: "Ivy", score: 93, date: "2025-01-09" },
  { id: 10, player: "Jack", score: 89, date: "2025-01-10" },
];

onMounted(() => {
  // 模拟加载延迟
  setTimeout(() => {
    scores.value = mockData;
    loading.value = false;
  }, 1000);
});

const getScoreColor = (score: number) => {
  if (score >= 90) return "#28a745"; // 绿色 - 优秀
  if (score >= 80) return "#ffc107"; // 黄色 - 良好
  return "#dc3545"; // 红色 - 需要改进
};
</script>

<template>
  <div class="score-dashboard">
    <!-- 标题区域 -->
    <div class="header">
      <h1>分数仪表板</h1>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">总记录数</span>
          <span class="stat-value">{{ scores.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均分</span>
          <span class="stat-value">
            {{
              scores.length
                ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
                : 0
            }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最高分</span>
          <span class="stat-value">
            {{ scores.length ? Math.max(...scores.map((s) => s.score)) : 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="table-row">
            <div class="table-cell header-cell">ID</div>
            <div class="table-cell header-cell">玩家姓名</div>
            <div class="table-cell header-cell">分数</div>
            <div class="table-cell header-cell">日期</div>
            <div class="table-cell header-cell">等级</div>
          </div>
        </div>

        <!-- 表体 -->
        <div class="table-body">
          <div v-for="score in scores" :key="score.id" class="table-row data-row">
            <div class="table-cell">{{ score.id }}</div>
            <div class="table-cell player-name">{{ score.player }}</div>
            <div class="table-cell score-cell">
              <span class="score-badge" :style="{ backgroundColor: getScoreColor(score.score) }">
                {{ score.score }}
              </span>
            </div>
            <div class="table-cell">{{ score.date }}</div>
            <div class="table-cell">
              <span
                class="grade-badge"
                :class="{
                  'grade-excellent': score.score >= 90,
                  'grade-good': score.score >= 80 && score.score < 90,
                  'grade-needs-improvement': score.score < 80,
                }"
              >
                {{ score.score >= 90 ? "优秀" : score.score >= 80 ? "良好" : "待改进" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.score-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  h1 {
    color: white;
    margin: 0 0 20px 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .stats {
    display: flex;
    gap: 40px;

    .stat-item {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .stat-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        margin-bottom: 5px;
      }

      .stat-value {
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
  }
}

.table-container {
  flex: 1;
  padding: 20px 40px 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: white;

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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.table {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  background: linear-gradient(135deg, #667eea, #5a7bc8);
  color: white;
  font-weight: bold;
}

.table-body {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 100px;
  min-height: 60px;
  align-items: center;
  border-bottom: 1px solid #e1e5e9;
  transition: all 0.2s ease;

  &:hover:not(.table-header .table-row) {
    background-color: #f8f9fa;
    transform: translateY(-1px);
  }
}

.table-cell {
  padding: 15px 20px;

  &.header-cell {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.data-row {
  .table-cell {
    font-size: 1rem;
    color: #2c3e50;
  }

  .player-name {
    font-weight: 600;
    color: #34495e;
  }
}

.score-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.score-badge {
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.125rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 60px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
}

.grade-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;

  &.grade-excellent {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  &.grade-good {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  &.grade-needs-improvement {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

/* 滚动条样式 */
.table-body::-webkit-scrollbar {
  width: 8px;
}

.table-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .score-dashboard {
    .header {
      padding: 15px 20px;

      h1 {
        font-size: 2rem;
      }

      .stats {
        gap: 20px;
        flex-wrap: wrap;
      }
    }

    .table-container {
      padding: 15px 20px 20px;
    }

    .table-row {
      grid-template-columns: 60px 1fr 100px 100px 80px;
      min-height: 50px;
    }

    .table-cell {
      padding: 10px 15px;
      font-size: 0.875rem;
    }
  }
}
</style>
