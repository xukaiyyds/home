<template>
  <div class="floating-music">
    <!-- 展开后的面板 -->
    <Transition name="fade-up">
      <div class="music-panel" v-show="store.floatingMusicOpenState">
        <!-- 顶部信息 -->
        <div class="panel-header">
          <span class="song-name">{{ displayName }}</span>
          <div class="header-actions">
            <close-small
              theme="filled"
              size="20"
              fill="#efefef"
              class="close-btn"
              @click="closePanel"
            />
          </div>
        </div>

        <!-- 封面与旋转 -->
        <div class="cover-container">
          <div :class="['cover', { rotating: store.playerState }]">
            <img :src="coverSrc" alt="cover" class="cover-img" @error="imgError" />
            <div class="center-hole"></div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-container" v-if="store.musicIsOk">
          <el-slider
            v-model="currentProgress"
            :show-tooltip="false"
            :min="0"
            :max="totalDuration"
            size="small"
            @change="changeProgress"
            @input="isDragging = true"
          />
          <div class="time-info">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(totalDuration) }}</span>
          </div>
        </div>
        <div class="loading" v-else>
          <span>Loading...</span>
        </div>

        <!-- 控制区 -->
        <div class="control">
          <!-- 播放模式：单按钮循环切换 -->
          <div class="mode-btn" @click="changePlayMode">
            <component :is="currentMode.icon" theme="filled" size="20" fill="#efefef" />
          </div>

          <go-start
            class="control-btn"
            theme="filled"
            size="28"
            fill="#efefef"
            @click="changeMusicIndex(0)"
          />

          <div class="play-btn" @click="changePlayState">
            <play-one v-if="!store.playerState" theme="filled" size="38" fill="#efefef" />
            <pause v-else theme="filled" size="38" fill="#efefef" />
          </div>

          <go-end
            class="control-btn"
            theme="filled"
            size="28"
            fill="#efefef"
            @click="changeMusicIndex(1)"
          />

          <!-- 列表按钮：打开/关闭全局音乐列表 -->
          <div class="list-btn" @click="toggleMusicList">
            <music-list theme="filled" size="20" fill="#efefef" />
          </div>
        </div>

        <!-- 底部音量 -->
        <div class="tools">
          <div class="volume-control">
            <div class="icon" @click="toggleMute">
              <component :is="volumeIcon" theme="filled" size="18" fill="#efefef" />
            </div>
            <el-slider
              v-model="store.musicVolume"
              :show-tooltip="false"
              :min="0"
              :max="1"
              :step="0.01"
              size="small"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮按钮 -->
    <div
      class="fab"
      v-show="!store.floatingMusicOpenState"
      @click="store.floatingMusicOpenState = true"
    >
      <MusicMenu theme="filled" size="17" fill="#efefef" />
    </div>
  </div>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseSmall,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
  MusicMenu,
  LoopOnce,
  ShuffleOne,
  PlayCycle,
  MusicList,
} from "@icon-park/vue-next";
import { mainStore } from "@/store";

const store = mainStore();

const defaultCover = "/images/icon/album_300.png";

/* ==================== 静态配置 ==================== */

// 播放模式表：按顺序循环切换
const PLAY_MODES = [
  { label: "列表循环", icon: PlayCycle, loop: "all", order: "list" },
  { label: "单曲循环", icon: LoopOnce, loop: "one", order: "list" },
  { label: "随机播放", icon: ShuffleOne, loop: "none", order: "random" },
];

/* ==================== 本地状态 ==================== */

// 进度条状态
const currentProgress = ref(0);
const currentTime = ref(0);
const isDragging = ref(false);
const totalDuration = computed(() => store.audioDuration || 0);

/* ==================== 计算属性 ==================== */

// 歌曲名显示（只访问具体 state，避免 getter 重复创建对象）
const displayName = computed(() => {
  if (store.playerTitle) return `${store.playerTitle} - ${store.playerArtist}`;
  return store.musicIsOk ? "未播放音乐" : "Loading...";
});

// 封面（缺省时用默认图）
const coverSrc = computed(() => store.playerCover || defaultCover);

// 当前播放模式索引
const currentModeIndex = computed(() => {
  if (store.playerLoop === "one") return 1;
  if (store.playerOrder === "random") return 2;
  return 0;
});
const currentMode = computed(() => PLAY_MODES[currentModeIndex.value]);

// 音量图标（三态）
const volumeIcon = computed(() => {
  if (store.musicVolume === 0) return VolumeMute;
  if (store.musicVolume < 0.7) return VolumeSmall;
  return VolumeNotice;
});

/* ==================== 进度同步 ==================== */

// 从 store 同步进度（Player.vue 定时写入）
// 拖动中不同步，避免把用户拖动的位置覆盖掉
watch(
  () => store.audioCurrent,
  (val) => {
    if (isDragging.value) return;
    currentTime.value = val;
    currentProgress.value = val;
  },
  { immediate: true },
);

/* ==================== 工具函数 ==================== */

const formatTime = (time) => {
  if (!time) return "00:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/* ==================== 事件处理 ==================== */

// 拖动结束：写入播放进度
const changeProgress = (val) => {
  window.$playerSeek?.(val);
  isDragging.value = false;
};

// 封面加载失败
const imgError = (e) => {
  e.target.src = defaultCover;
};

// 播放模式循环切换
const changePlayMode = () => {
  const next = PLAY_MODES[(currentModeIndex.value + 1) % PLAY_MODES.length];
  store.playerLoop = next.loop;
  store.playerOrder = next.order;
  ElMessage({
    message: next.label,
    icon: h(next.icon, { fill: "#efefef" }),
  });
};

// 静音切换（改 store，Music.vue 的 watch 会自动同步到播放器）
const toggleMute = () => {
  if (store.musicVolume > 0) {
    store.lastMusicVolume = store.musicVolume;
    store.musicVolume = 0;
  } else {
    store.musicVolume = store.lastMusicVolume || 0.7;
  }
};

// 打开/关闭全局音乐列表
const toggleMusicList = () => {
  if (store.musicListShow) window.$closeList?.();
  else window.$openList?.();
};

// 关闭面板（同时收起音乐列表）
const closePanel = () => {
  store.floatingMusicOpenState = false;
  if (store.musicListShow) window.$closeList?.();
};

// 播放控制（统一走全局实例方法）
const changePlayState = () => window.$playerToggle?.();
const changeMusicIndex = (type) => window.$playerChange?.(type);
</script>

<style lang="scss" scoped>
.floating-music {
  position: fixed;
  left: 34px;
  bottom: 0px;
  z-index: 1;

  .fab {
    position: absolute;
    bottom: calc(23px - 34px / 2);
    right: -6px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    background-color: var(--main-open-music-bg-color);
    border-radius: 50%;
    transition: all 0.3s;
    opacity: 0.8;
    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    &:active {
      transform: scale(0.95);
    }
  }

  .music-panel {
    position: absolute;
    bottom: 63px;
    left: calc(-34px / 2);
    z-index: 2;
    width: 320px;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    backdrop-filter: blur(20px);
    background: var(--main-panel-bg-color);
    box-shadow: var(--main-big-box-shadow);

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .song-name {
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 260px;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .close-btn {
        opacity: 0.8;
        transition: opacity 0.3s;
        &:hover {
          opacity: 1;
        }
      }
    }

    .cover-container {
      display: flex;
      justify-content: center;
      padding: 10px 0;
      .cover {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background-color: var(--main-select-bg-color);
        position: relative;
        box-shadow: 0 0 10px #00000050;
        overflow: hidden;
        border: 4px solid var(--main-bg-color);
        animation: rotate 20s linear infinite;

        &.rotating {
          animation-play-state: running;
        }
        &:not(.rotating) {
          animation-play-state: paused;
        }

        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .center-hole {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: var(--main-bg-color);
          border-radius: 50%;
          border: 2px solid var(--main-loading-bg-color);
        }
      }
    }

    .progress-container {
      width: 100%;
      .time-info {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #ffffff80;
        margin-top: 4px;
      }
      :deep(.el-slider) {
        --el-slider-main-bg-color: #efefef;
        --el-slider-runway-bg-color: var(--main-cards-header-bg-color);
        --el-slider-button-size: 12px;
        height: 16px;
      }
    }

    .loading {
      text-align: center;
      color: #ffffff80;
      font-size: 12px;
    }

    .control {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;

      .mode-btn,
      .list-btn {
        opacity: 0.8;
        transition: all 0.3s;
        &:hover {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      .play-btn {
        transition: transform 0.2s;
        &:hover {
          transform: scale(1.1);
        }
        &:active {
          transform: scale(0.95);
        }
      }

      .control-btn {
        opacity: 0.8;
        transition: opacity 0.3s;
        &:hover {
          opacity: 1;
        }
      }
    }

    .tools {
      .volume-control {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--main-cards-body-bg-color);
        padding: 8px 12px;
        height: 40px;
        border-radius: 12px;
        vertical-align: middle;
        .icon {
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }
        :deep(.el-slider) {
          --el-slider-main-bg-color: #efefef;
          --el-slider-runway-bg-color: var(--main-cards-header-bg-color);
          --el-slider-button-size: 12px;
          height: 20px;
        }
      }
    }
  }
}

/* 动画 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
