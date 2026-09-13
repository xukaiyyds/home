<template>
  <!-- 功能区域 -->
  <div :class="store.mobileFuncState ? 'function mobile' : 'function'">
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="left">
          <Hitokoto v-show="!store.musicOpenState || store.useFloatingPlayer" />
          <Music />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="right cards" @click="changeBox">
          <div class="time">
            <div class="date">
              <!-- 12 小时制：斜杠分隔 -->
              <template v-if="store.use12HourFormat">
                <span>{{ dateSlashFormat }}</span>
              </template>
              <!-- 24 小时制：中文分隔 -->
              <template v-else>
                <span>{{ currentTime.year }}&nbsp;年&nbsp;</span>
                <span>{{ currentTime.month }}&nbsp;月&nbsp;</span>
                <span>{{ currentTime.day }}&nbsp;日</span>
              </template>
              <span class="sm-hidden">&nbsp;{{ currentTime.weekday }}</span>
            </div>
            <div class="text">
              {{ timeMain }}
              <span v-if="store.use12HourFormat" class="amPm">{{ currentTime.amPm }}</span>
            </div>
          </div>
          <Weather />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getCurrentTime } from "@/utils/getTime";
import { mainStore } from "@/store";
import Music from "@/components/Music.vue";
import Hitokoto from "@/components/Hitokoto.vue";
import Weather from "@/components/Weather.vue";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 移动端宽度阈值（与 store.setInnerWidth 保持一致）
const MOBILE_WIDTH = 721;

// 时间刷新间隔
const TIME_REFRESH_INTERVAL = 1000;

/* ==================== 当前时间 ==================== */

// 初始值直接调用 getCurrentTime，避免模板首次渲染出现 undefined
const currentTime = ref(getCurrentTime(store.use12HourFormat));

// 12 小时制下的日期字符串
const dateSlashFormat = computed(
  () => `${currentTime.value.year} / ${currentTime.value.month} / ${currentTime.value.day}`,
);

// 主时间：HH:mm（有秒则补 :ss）
const timeMain = computed(() => {
  const { hour, minute, second } = currentTime.value;
  return second !== null && second !== undefined
    ? `${hour}:${minute}:${second}`
    : `${hour}:${minute}`;
});

const updateTimeData = () => {
  currentTime.value = getCurrentTime(store.use12HourFormat);
};

/* ==================== 事件处理 ==================== */

// 点击右侧功能区：桌面端切换时光胶囊
const changeBox = () => {
  if (store.innerWidth >= MOBILE_WIDTH) {
    store.boxOpenState = !store.boxOpenState;
  }
};

/* ==================== 生命周期 ==================== */

let timeInterval = null;

onMounted(() => {
  updateTimeData();
  timeInterval = setInterval(updateTimeData, TIME_REFRESH_INTERVAL);
});

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style lang="scss" scoped>
.function {
  height: 165px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  &.mobile {
    .el-row {
      .el-col {
        &:nth-of-type(1) {
          display: contents;
        }
        &:nth-of-type(2) {
          display: none;
        }
      }
    }
  }
  .el-row {
    height: 100%;
    width: 100%;
    margin: 0 !important;
    .el-col {
      &:nth-of-type(1) {
        padding-left: 0 !important;
      }
      &:nth-of-type(2) {
        padding-right: 0 !important;
      }
      @media (max-width: 910px) {
        &:nth-of-type(1) {
          display: none;
        }
        &:nth-of-type(2) {
          padding: 0 !important;
          flex: none;
          max-width: none;
          width: 100%;
        }
      }
    }
    .left,
    .right {
      width: 100%;
      height: 100%;
    }
    .right {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      animation: fade 0.5s;
      .time {
        font-size: 1.1rem;
        text-align: center;
        .date {
          text-overflow: ellipsis;
          overflow-x: hidden;
          white-space: nowrap;
        }
        .text {
          margin-top: 10px;
          font-size: 3.25rem;
          letter-spacing: 2px;
          font-family: "UnidreamLED";
          .amPm {
            font-size: 1.25rem;
            opacity: 0.6;
          }
        }
        @media (min-width: 1201px) and (max-width: 1280px) {
          font-size: 1rem;
        }
        @media (min-width: 911px) and (max-width: 992px) {
          font-size: 1rem;
          .text {
            font-size: 2.75rem;
          }
        }
      }
      .weather {
        text-align: center;
        width: 100%;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
      }
      @media (max-width: 720px) {
        pointer-events: none;
      }
    }
  }
}
</style>
