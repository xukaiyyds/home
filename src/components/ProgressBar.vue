<template>
  <div v-if="store.footerProgressBar" ref="progressBarRef" class="progress-bar">
    <div
      class="progress"
      :class="{ dragging: isDragging }"
      :style="{ width: isDragging ? `${dragProgress}%` : `${progressBarWidth}%` }"
    >
      <img
        v-show="showIcon"
        src="/images/icon/ProgressBar.ico"
        class="progress-icon"
        draggable="false"
        ref="iconRef"
        @mousedown="onDragStart"
        @touchstart.prevent="onDragStart"
      />
    </div>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { throttle } from "lodash";

const store = mainStore();

/* ==================== Props ==================== */

const props = defineProps({
  footerHover: {
    type: Boolean,
    default: false,
  },
});

/* ==================== 静态配置 ==================== */

// 拖动节流帧间隔（约 60fps）
const THROTTLE_MS = 16;
// 拖动结束后图标归位的延迟
const ICON_RESET_DELAY = 1000;
// 图标宽度兜底值（icon.offsetWidth 为 0 时使用）
const FALLBACK_ICON_WIDTH = 32;

/* ==================== 本地状态 ==================== */

const isDragging = ref(false);
const dragProgress = ref(0);

const progressBarRef = ref(null);
const iconRef = ref(null);

// 图标归位定时器
let dragTimer = null;

/* ==================== 计算属性 ==================== */

// 图标显示：常驻模式或底栏悬停时
const showIcon = computed(() => store.forceShowIcon || props.footerHover);

// 播放进度百分比
const progressBarWidth = computed(() => {
  if (!store.playerState) return 0;
  const duration = store.playerDuration || 0;
  return duration === 0 ? 0 : (store.playerCurrentTime / duration) * 100 || 0;
});

/* ==================== 工具函数 ==================== */

// 获取当前音频元素（store 优先，DOM 兜底）
const getAudio = () => store.audioRef || document.querySelector("audio");

// 获取进度条矩形（拖动过程中需要实时读取）
const getBarRect = () => progressBarRef.value?.getBoundingClientRect() ?? null;

// 根据鼠标/触摸位置计算并写入进度
const updateDragProgress = (clientX) => {
  const rect = getBarRect();
  if (!rect || rect.width === 0) return;
  const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
  dragProgress.value = (offsetX / rect.width) * 100;
  // 同步拖动图标位置（用 style.left 覆盖 CSS 默认定位）
  if (iconRef.value) {
    const iconWidth = iconRef.value.offsetWidth || FALLBACK_ICON_WIDTH;
    iconRef.value.style.left = `${offsetX - iconWidth / 2}px`;
  }
};

// 拖动结束后把图标位置重置回 CSS 默认
const resetIconPosition = () => {
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    if (iconRef.value) iconRef.value.style.left = "";
  }, ICON_RESET_DELAY);
};

// 结束拖动：写入播放进度 + 图标归位
const finishDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  const audio = getAudio();
  if (audio && store.playerDuration) {
    audio.currentTime = (dragProgress.value / 100) * store.playerDuration;
  }
  resetIconPosition();
};

/* ==================== 拖动开始 ==================== */

// 鼠标和触摸统一入口
const onDragStart = (event) => {
  event.preventDefault();
  if (!getAudio() || !store.playerDuration) return;

  // 触摸事件取 touches[0]，鼠标事件直接取 clientX
  const clientX = event.touches ? event.touches[0]?.clientX : event.clientX;
  if (clientX == null) return;

  isDragging.value = true;
  updateDragProgress(clientX);
};

/* ==================== 拖动过程（节流） ==================== */

// 鼠标和触摸统一入口
const onDragMove = throttle((event) => {
  if (!isDragging.value) return;

  const clientX = event.touches ? event.touches[0]?.clientX : event.clientX;
  if (clientX == null) return;

  // 触摸事件需阻止默认滚动
  if (event.cancelable && event.touches) event.preventDefault();
  updateDragProgress(clientX);
}, THROTTLE_MS);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  document.addEventListener("mouseup", finishDrag);
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", finishDrag);
  document.addEventListener("touchcancel", finishDrag);
});

onBeforeUnmount(() => {
  document.removeEventListener("mouseup", finishDrag);
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("touchend", finishDrag);
  document.removeEventListener("touchcancel", finishDrag);
  if (dragTimer) clearTimeout(dragTimer);
});
</script>

<style lang="scss" scoped>
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1.5px;
  opacity: 1;
  user-select: none;
  background-color: #efefef;
  z-index: 999;

  .progress {
    height: 100%;
    width: 100%;
    opacity: 1;
    background-color: #f7989e;
    transition: width 0.1s linear;
    position: relative;
    user-select: none;

    &.dragging {
      transition: none !important;
    }

    .progress-icon {
      position: absolute;
      user-select: none;
      touch-action: none;
      top: -12px;
      right: -12px;
      opacity: 1;
      width: 24px;
      height: 24px;
      cursor: grab;
      transform: translateX(var(--progress-icon-x, 0)) translateZ(0);
      will-change: transform;
      transition: transform 0.1s linear;

      &:active {
        cursor: grabbing;
      }
    }
  }
}
</style>
