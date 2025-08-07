<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import type { ITournament, TournamentCategory } from "@/types/tournament";
import { ApiService, type IDBTournament } from "@/services/api";
import { ElMessage } from "element-plus";

// 扩展ITournament类型，添加title字段和id字段
interface ITournamentRow extends ITournament {
  id: number; // 添加id字段
  title: string;
}

const router = useRouter();

// 状态管理
const tournaments = ref<ITournamentRow[]>([]);
const dbTournaments = ref<IDBTournament[]>([]);
const loading = ref(true);
const selectedCategory = ref<TournamentCategory | null>(null);

// 模拟数据（作为备用）
const mockData: ITournamentRow[] = [
  {
    id: 1, // 添加id字段
    session: 1,
    category: "qiaoma",
    champion: { id: 1, name: "Player1" },
    date: "2025-01-01",
    title: "第1届敲麻大赛",
  },
  {
    id: 2, // 添加id字段
    session: 1,
    category: "riichi",
    champion: { id: 2, name: "Player2" },
    date: "2025-01-02",
    title: "第1届日麻锦标赛",
  },
  {
    id: 3, // 添加id字段
    session: 2,
    category: "qiaoma",
    champion: { id: 3, name: "Player3" },
    date: "2025-01-03",
    title: "第2届敲麻大赛",
  },
  {
    id: 4, // 添加id字段
    session: 2,
    category: "riichi",
    champion: { id: 4, name: "Player4" },
    date: "2025-01-04",
    title: "第2届日麻锦标赛",
  },
  {
    id: 5, // 添加id字段
    session: 3,
    category: "qiaoma",
    champion: { id: 5, name: "Player5" },
    date: "2025-01-05",
    title: "春季敲麻邀请赛",
  },
  {
    id: 6, // 添加id字段
    session: 3,
    category: "riichi",
    champion: { id: 6, name: "Player6" },
    date: "2025-01-06",
    title: "春季日麻公开赛",
  },
  {
    id: 7, // 添加id字段
    session: 4,
    category: "qiaoma",
    champion: { id: 7, name: "Player7" },
    date: "2025-01-07",
    title: "夏季敲麻挑战赛",
  },
  {
    id: 8, // 添加id字段
    session: 4,
    category: "riichi",
    champion: { id: 8, name: "Player8" },
    date: "2025-01-08",
    title: "夏季日麻精英赛",
  },
];

// 格式化日期，只显示年月日
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // 返回 YYYY-MM-DD 格式
  } catch {
    return dateString; // 如果解析失败，返回原字符串
  }
};

// 转换数据库数据为前端格式
const convertDbTournaments = (dbTournaments: IDBTournament[]): ITournamentRow[] => {
  return dbTournaments.map((dbTournament) => {
    return {
      id: dbTournament.id, // 使用数据库ID
      session: dbTournament.id, // 保持向后兼容
      category: dbTournament.category,
      champion: {
        id: dbTournament.champion?.id || 0,
        name: dbTournament.champion?.nickname || dbTournament.champion?.account || "待定",
      },
      date: formatDate(dbTournament.date), // 格式化日期
      title: dbTournament.title, // 直接使用数据库中的title
    };
  });
};

// 计算属性
const totalTournaments = computed(() => tournaments.value.length);
const qiaomaTournaments = computed(
  () => tournaments.value.filter((t) => t.category === "qiaoma").length
);
const riichiTournaments = computed(
  () => tournaments.value.filter((t) => t.category === "riichi").length
);

// 筛选后的赛事列表
const filteredTournaments = computed(() => {
  if (!selectedCategory.value) {
    return tournaments.value;
  }
  return tournaments.value.filter((t) => t.category === selectedCategory.value);
});

// 筛选处理函数
const handleCategoryFilter = (category: TournamentCategory | null) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = category;
  }
};

// 检查是否为活跃状态
const isActiveFilter = (category: TournamentCategory | null) => {
  return selectedCategory.value === category;
};

// 修复：跳转到赛事详情 - 使用tournament.id
const goToTournament = (tournament: ITournamentRow) => {
  router.push(`/tournament/${tournament.id}`);
};

// 获取赛事类型的中文名称
const getCategoryName = (category: TournamentCategory) => {
  switch (category) {
    case "qiaoma":
      return "敲麻";
    case "riichi":
      return "日麻";
    default:
      return category;
  }
};

// 获取赛事类型的颜色
const getCategoryColor = (category: TournamentCategory) => {
  switch (category) {
    case "qiaoma":
      return "#667eea";
    case "riichi":
      return "#764ba2";
    default:
      return "#6c757d";
  }
};

// 加载赛事数据
const loadTournaments = async () => {
  try {
    loading.value = true;

    // 尝试从API获取数据
    const data = await ApiService.getTournaments();
    dbTournaments.value = data;

    if (data.length > 0) {
      // 使用真实数据
      tournaments.value = convertDbTournaments(data);
    } else {
      // 使用模拟数据
      tournaments.value = mockData;
      ElMessage.info("使用模拟数据显示");
    }
  } catch (error) {
    console.error("Failed to load tournaments:", error);
    // 发生错误时使用模拟数据
    tournaments.value = mockData;
    ElMessage.warning("API连接失败，使用模拟数据");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadTournaments();
});
</script>

<template>
  <div class="score-dashboard">
    <!-- 标题区域 -->
    <div class="header">
      <h1>麻神杯</h1>
      <div class="stats">
        <!-- 总赛事数 - 点击显示全部 -->
        <div
          class="stat-item"
          :class="{ active: isActiveFilter(null) }"
          @click="handleCategoryFilter(null)"
        >
          <span class="stat-label">总赛事数</span>
          <span class="stat-value">{{ totalTournaments }}</span>
        </div>

        <!-- 雀魂麻将筛选 -->
        <div
          class="stat-item"
          :class="{ active: isActiveFilter('qiaoma') }"
          @click="handleCategoryFilter('qiaoma')"
        >
          <span class="stat-label">雀魂麻将</span>
          <span class="stat-value">{{ qiaomaTournaments }}</span>
        </div>

        <!-- 日麻筛选 -->
        <div
          class="stat-item"
          :class="{ active: isActiveFilter('riichi') }"
          @click="handleCategoryFilter('riichi')"
        >
          <span class="stat-label">日麻</span>
          <span class="stat-value">{{ riichiTournaments }}</span>
        </div>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载赛事数据中...</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="table-row">
            <div class="table-cell header-cell">赛事类型</div>
            <div class="table-cell header-cell">赛事名称</div>
            <div class="table-cell header-cell">冠军玩家</div>
            <div class="table-cell header-cell">比赛日期</div>
          </div>
        </div>

        <!-- 表体 - 使用筛选后的数据 -->
        <div class="table-body">
          <div v-for="game in filteredTournaments" :key="game.id" class="table-row data-row">
            <div class="table-cell category-cell">
              <span
                class="category-badge"
                :style="{ backgroundColor: getCategoryColor(game.category) }"
              >
                {{ getCategoryName(game.category) }}
              </span>
            </div>
            <div class="table-cell title-cell">
              <!-- 修改：赛事名称可点击跳转 -->
              <span class="title-text clickable" @click="goToTournament(game)">
                {{ game.title }}
              </span>
            </div>
            <div class="table-cell champion-cell">
              <div class="champion-info">
                <span class="champion-name">{{ game.champion.name }}</span>
                <span class="champion-id">ID: {{ game.champion.id }}</span>
              </div>
            </div>
            <div class="table-cell date-cell">{{ game.date }}</div>
          </div>

          <!-- 无数据状态 -->
          <div v-if="filteredTournaments.length === 0" class="no-data">
            <p>暂无符合条件的赛事数据</p>
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
    flex-wrap: wrap;

    .stat-item {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      cursor: pointer;
      padding: 15px 20px;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }

      &.active {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.05);

        .stat-value {
          color: #fff;
          text-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
        }
      }

      .stat-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        margin-bottom: 5px;
        transition: color 0.3s ease;
      }

      .stat-value {
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
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
  grid-template-columns: 120px 2fr 1.5fr 200px;
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

    // 针对第1、2、4列设置居中
    &:nth-child(1),
    &:nth-child(2),
    &:nth-child(4) {
      text-align: center;
    }
  }
}

.data-row {
  .table-cell {
    font-size: 1rem;
    color: #2c3e50;
  }
}

.title-cell {
  display: flex;
  justify-content: center;
  align-items: center;

  .title-text {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1rem;
    text-align: center;
    transition: all 0.2s ease;
    padding: 8px 12px;
    border-radius: 8px;

    &.clickable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      &:active {
        transform: scale(0.98);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      }
    }
  }
}

.category-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-badge {
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}

.champion-cell {
  .champion-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .champion-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .champion-id {
      color: #6c757d;
      font-size: 0.875rem;
    }
  }
}

.date-cell {
  color: #495057;
  font-weight: 500;
  text-align: center;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6c757d;
  font-size: 1.1rem;
  font-style: italic;
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
      grid-template-columns: 100px 1.5fr 1fr 100px;
      min-height: 50px;
    }

    .table-cell {
      padding: 10px 15px;
      font-size: 0.875rem;
    }

    .title-text {
      font-size: 0.875rem !important;
    }
  }
}
</style>
