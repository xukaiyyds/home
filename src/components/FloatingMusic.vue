<template>
  <div class="floating-music">
    <!-- 展开后的面板 -->
    <Transition name="fade-up">
      <div
        class="music-panel"
        v-show="store.floatingMusicOpenState"
        @mouseenter="volumeShow = true"
        @mouseleave="volumeShow = false"
      >
        <!-- 顶部信息 -->
        <div class="panel-header">
          <span class="song-name">
            {{
              store.getPlayerData.name
                ? store.getPlayerData.name + " - " + store.getPlayerData.artist
                : store.musicIsOk
                  ? "未播放音乐"
                  : "Loading..."
            }}
          </span>
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
            <img
              :src="store.getPlayerData.cover || defaultCover"
              alt="cover"
              class="cover-img"
              @error="imgError"
            />
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
          <!-- 播放模式 -->
          <div class="mode-btn" @click="changePlayMode">
            <loop-once theme="filled" size="20" fill="#efefef" v-if="store.playerLoop === 'one'" />
            <shuffle-one
              theme="filled"
              size="20"
              fill="#efefef"
              v-else-if="store.playerOrder === 'random'"
            />
            <play-cycle theme="filled" size="20" fill="#efefef" v-else />
          </div>

          <go-start
            class="control-btn"
            theme="filled"
            size="28"
            fill="#efefef"
            @click="changeMusicIndex(0)"
          />
          <div class="play-btn" @click="changePlayState">
            <play-one theme="filled" size="38" fill="#efefef" v-show="!store.playerState" />
            <pause theme="filled" size="38" fill="#efefef" v-show="store.playerState" />
          </div>
          <go-end
            class="control-btn"
            theme="filled"
            size="28"
            fill="#efefef"
            @click="changeMusicIndex(1)"
          />

          <!-- 列表按钮：打开全局音乐列表 -->
          <div class="list-btn" @click="openMusicList">
            <music-list theme="filled" size="20" fill="#efefef" />
          </div>
        </div>

        <!-- 底部音量 -->
        <div class="tools">
          <div class="volume-control">
            <div class="icon" @click="toggleMute">
              <volume-mute theme="filled" size="18" fill="#efefef" v-if="store.musicVolume == 0" />
              <volume-small
                theme="filled"
                size="18"
                fill="#efefef"
                v-else-if="store.musicVolume > 0 && store.musicVolume < 0.7"
              />
              <volume-notice theme="filled" size="18" fill="#efefef" v-else />
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

// 面板悬停显隐（跟音量数值无关）
const volumeShow = ref(false);

// 进度
const currentProgress = ref(0);
const currentTime = ref(0);
const isDragging = ref(false);
const totalDuration = computed(() => store.audioDuration || 0);

// 从 store 同步进度（Player.vue 每 500ms 会写一次）
watch(
  () => store.audioCurrent,
  (val) => {
    if (!isDragging.value) {
      currentTime.value = val;
      currentProgress.value = val;
    }
  },
  { immediate: true },
);

// 格式化时间
const formatTime = (time) => {
  if (!time) return "00:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};

// 拖动进度
const changeProgress = (val) => {
  window.$playerSeek?.(val);
  isDragging.value = false;
};

// 封面
const imgError = (e) => {
  e.target.src = defaultCover;
};

// 播放模式
const changePlayMode = () => {
  if (store.playerLoop === "one") {
    store.playerLoop = "none";
    store.playerOrder = "random";
    ElMessage({
      message: "随机播放",
      icon: h(ShuffleOne, {
        fill: "#efefef",
      }),
    });
  } else if (store.playerOrder === "random") {
    store.playerLoop = "all";
    store.playerOrder = "list";
    ElMessage({
      message: "列表循环",
      icon: h(PlayCycle, {
        fill: "#efefef",
      }),
    });
  } else {
    store.playerLoop = "one";
    store.playerOrder = "list";
    ElMessage({
      message: "单曲循环",
      icon: h(LoopOnce, {
        fill: "#efefef",
      }),
    });
  }
};

// 静音：改 store，Music.vue 里的 watch 会自动同步到播放器
const toggleMute = () => {
  if (store.musicVolume > 0) {
    store.lastMusicVolume = store.musicVolume;
    store.musicVolume = 0;
  } else {
    store.musicVolume = store.lastMusicVolume || 0.7;
  }
};

// 打开全局音乐列表
const openMusicList = () => {
  if (store.musicListShow) {
    window.$closeList?.();
  } else {
    window.$openList?.();
  }
};

// 如果音乐列表开着，一起关掉
const closePanel = () => {
  store.floatingMusicOpenState = false;
  if (store.musicListShow) {
    window.$closeList?.();
  }
};

// 控制唯一实例
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
