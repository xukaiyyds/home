<template>
  <div v-if="store.footerProgressBar" class="progress-bar">
    <div
      class="progress"
      :class="{ dragging: isDragging }"
      :style="{ width: isDragging ? `${dragProgress}%` : `${progressBarWidth}%` }"
    >
      <img
        v-if="showProgressIcon"
        src="/images/icon/ProgressBar.ico"
        class="progress-icon"
        draggable="false"
        @mousedown="handleMouseDown"
        @touchstart.prevent="handleTouchStart"
        ref="icon"
      />
      <Loading
        v-if="!store.playerCanplay"
        theme="filled"
        size="32"
        fill="#f7989e"
        :spin="true"
        class="loading-icon"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { Loading } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { throttle } from "lodash";

const store = mainStore();
const showProgressIcon = ref(false);
const isDragging = ref(false);
const dragProgress = ref(0);
const icon = ref(null);
let dragTimer = null;
let audioElement = null;

// 接收 playerRef
const props = defineProps({
  forceShowIcon: {
    type: Boolean,
    default: false,
  },
  playerRef: {
    type: Object,
    default: null,
  },
});

// 进度计算
const progressBarWidth = computed(() => {
  if (!store.playerState) return 0;
  const duration = store.playerDuration || 0;
  if (duration === 0) return 0;
  return (store.playerCurrentTime / duration) * 100 || 0;
});

// 获取 audio 元素
const getAudio = () => {
  // 从 store 获取
  if (store.audioRef) {
    return store.audioRef;
  }
  // 降级
  return document.querySelector("audio");
};

// 鼠标事件
const handleMouseEnter = () => {
  showProgressIcon.value = props.forceShowIcon || true;
};
const handleMouseLeave = () => {
  showProgressIcon.value = props.forceShowIcon || false;
};

const handleMouseDown = (e) => {
  e.preventDefault();
  const audio = getAudio();
  if (!audio || !store.playerDuration) return;
  isDragging.value = true;
  const progressBar = document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  const initialX = e.clientX - rect.left;
  const clampedX = Math.max(0, Math.min(rect.width, initialX));
  dragProgress.value = (clampedX / rect.width) * 100;
};

const onMouseUp = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  if (dragTimer) clearTimeout(dragTimer);
  const audio = getAudio();
  if (audio && store.playerDuration) {
    audio.currentTime = (dragProgress.value / 100) * store.playerDuration;
  }
  dragTimer = setTimeout(() => {
    if (icon.value) icon.value.style.left = "";
  }, 1000);
};

const onMouseMove = throttle((e) => {
  if (!isDragging.value) return;
  const progressBar = document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  let offsetX = e.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgress.value = (offsetX / rect.width) * 100;
  if (icon.value) {
    const iconWidth = icon.value.offsetWidth || 32;
    const newLeft = offsetX - iconWidth / 2;
    icon.value.style.left = `${newLeft}px`;
  }
}, 16);

// 触摸事件
const handleTouchStart = (e) => {
  if (e.touches.length > 1) return;
  const audio = getAudio();
  if (!audio || !store.playerDuration) return;
  isDragging.value = true;
  const progressBar = document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  const initialX = e.touches[0].clientX - rect.left;
  const clampedX = Math.max(0, Math.min(rect.width, initialX));
  dragProgress.value = (clampedX / rect.width) * 100;
};

const onTouchMove = throttle((e) => {
  if (!isDragging.value) return;
  const touch = e.touches[0];
  e.preventDefault();
  const progressBar = document.querySelector(".progress-bar");
  if (!progressBar) return;
  const rect = progressBar.getBoundingClientRect();
  let offsetX = touch.clientX - rect.left;
  offsetX = Math.max(0, Math.min(rect.width, offsetX));
  dragProgress.value = (offsetX / rect.width) * 100;
  if (icon.value) {
    const iconWidth = icon.value.offsetWidth || 32;
    const newLeft = offsetX - iconWidth / 2;
    icon.value.style.left = `${newLeft}px`;
  }
}, 16);

const onTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  const audio = getAudio();
  if (audio && store.playerDuration) {
    audio.currentTime = (dragProgress.value / 100) * store.playerDuration;
  }
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    if (icon.value) icon.value.style.left = "";
  }, 1000);
};

// 监听外部强制显示
watch(
  () => props.forceShowIcon,
  (val) => {
    showProgressIcon.value = val || false;
  },
  { immediate: true },
);

onMounted(() => {
  nextTick(() => {
    audioElement = document.querySelector("audio");
    const footer = document.querySelector("#footer");
    if (footer) {
      footer.addEventListener("mouseenter", handleMouseEnter);
      footer.addEventListener("mouseleave", handleMouseLeave);
    }
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
  document.removeEventListener("touchcancel", onTouchEnd);
  const footer = document.querySelector("#footer");
  if (footer) {
    footer.removeEventListener("mouseenter", handleMouseEnter);
    footer.removeEventListener("mouseleave", handleMouseLeave);
  }
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
  background-color: #fff;
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

    .loading-icon {
      position: absolute;
      user-select: none;
      touch-action: none;
      top: -16px;
      right: -16px;
      width: 32px;
      height: 32px;
      color: #f7989e;
    }

    .progress-icon {
      position: absolute;
      user-select: none;
      touch-action: none;
      top: -16px;
      right: -16px;
      opacity: 1;
      width: 32px;
      height: 32px;
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
