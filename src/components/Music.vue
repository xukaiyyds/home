<template>
  <!-- 音乐控制面板 -->
  <div
    class="music cards"
    @mouseenter="volumeShow = true"
    @mouseleave="volumeShow = false"
    v-show="store.musicOpenState && !store.useFloatingPlayer"
  >
    <div class="btns">
      <span @click="openMusicList()">音乐列表</span>
      <span @click="store.musicOpenState = false">回到一言</span>
    </div>
    <div class="control">
      <go-start theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(0)" />
      <Transition name="fade" mode="out-in">
        <div :key="store.playerState" class="state" @click="changePlayState">
          <play-one theme="filled" size="50" fill="#efefef" v-show="!store.playerState" />
          <pause theme="filled" size="50" fill="#efefef" v-show="store.playerState" />
        </div>
      </Transition>
      <go-end theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(1)" />
    </div>
    <div class="menu">
      <div class="name" v-show="!volumeShow">
        <span>{{ displaySong }}</span>
      </div>
      <div class="volume" v-show="volumeShow">
        <div class="icon">
          <component :is="volumeIcon" theme="filled" size="24" fill="#efefef" />
        </div>
        <el-slider
          v-model="store.musicVolume"
          :show-tooltip="false"
          :min="0"
          :max="1"
          :step="0.01"
        />
      </div>
    </div>
  </div>

  <!-- 音乐列表弹窗 -->
  <Transition name="fade" mode="out-in">
    <div class="music-list" v-show="store.musicListShow" @click="closeMusicList()">
      <Transition name="zoom">
        <div class="list" v-show="store.musicListShow" @click.stop>
          <close-one
            class="close"
            theme="filled"
            size="28"
            fill="#ffffff60"
            @click="closeMusicList()"
          />
          <Player
            ref="playerRef"
            :songServer="playerData.server"
            :songType="playerData.type"
            :songId="playerData.id"
            :volume="store.musicVolume"
          />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
  MusicMenu,
  MusicList,
  HomeTwo,
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { SpeechLocal } from "@/utils/speech";
import { mainStore } from "@/store";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 音量步进值
const VOLUME_STEP = 0.05;

// 播放列表配置（构建时确定，无需响应式）
const playerData = {
  server: import.meta.env.VITE_SONG_SERVER,
  type: import.meta.env.VITE_SONG_TYPE,
  id: import.meta.env.VITE_SONG_ID,
};

/* ==================== 本地状态 ==================== */

// 音量条显隐（hover 触发）
const volumeShow = ref(false);

// 播放器实例引用
const playerRef = ref(null);

/* ==================== 计算属性 ==================== */

// 歌曲名（避免模板里多次访问 getter）
const displaySong = computed(() => {
  if (store.playerTitle) return `${store.playerTitle} - ${store.playerArtist}`;
  return "未播放音乐";
});

// 音量图标（三态）
const volumeIcon = computed(() => {
  if (store.musicVolume === 0) return VolumeMute;
  if (store.musicVolume < 0.7) return VolumeSmall;
  return VolumeNotice;
});

/* ==================== 播放列表控制 ==================== */

const openMusicList = () => {
  store.musicListShow = true;
  playerRef.value?.toggleList();
  if (store.webSpeech) SpeechLocal("好耶.mp3");
};

const closeMusicList = () => {
  store.musicListShow = false;
  playerRef.value?.toggleList();
};

/* ==================== 播放控制 ==================== */

const changePlayState = () => playerRef.value?.playToggle();
const changeMusicIndex = (type) => playerRef.value?.changeSong(type);

/* ==================== 通用工具 ==================== */

// 当前是否聚焦在输入框（避免快捷键劫持输入）
const isInputFocused = () => {
  const el = document.activeElement;
  return el && (el.tagName === "INPUT" || el.isContentEditable);
};

// 显示操作提示消息
const showMessage = (message, icon) => {
  if (store.messageShow) {
    ElMessage({ duration: 2000, message, icon: h(icon, { fill: "#efefef" }) });
  }
};

/* ==================== 键盘事件处理 ==================== */

// 左右方向键：上一首 / 下一首
const handleHorizontalArrow = (event) => {
  if (isInputFocused()) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    changeMusicIndex(0);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    changeMusicIndex(1);
  }
};

// 上下方向键：调节音量
const handleVerticalArrow = (event) => {
  if (isInputFocused()) return;
  if (event.key === "ArrowUp") {
    event.preventDefault();
    store.musicVolume = Math.min(1, store.musicVolume + VOLUME_STEP);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    store.musicVolume = Math.max(0, store.musicVolume - VOLUME_STEP);
  }
};

// Alt + H：回到首页（关闭所有浮层）
const handleHToggle = (event) => {
  if (!event.altKey || event.key.toLowerCase() !== "h") return;
  event.preventDefault();
  const anyOpen =
    store.boxOpenState || store.setOpenState || store.searchOpenState || store.musicListShow;
  if (!anyOpen) return;

  store.boxOpenState = false;
  store.setOpenState = false;
  store.searchOpenState = false;
  if (store.floatingMusicOpenState) store.floatingMusicOpenState = false;
  if (store.musicListShow) closeMusicList();
  showMessage("已回到首页", HomeTwo);
};

// M 键：切换音乐面板 / 悬浮播放器
const handleMKey = (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key.toLowerCase() !== "m") return;
  if (isInputFocused()) return;
  event.preventDefault();

  if (store.useFloatingPlayer) {
    store.floatingMusicOpenState = !store.floatingMusicOpenState;
    showMessage(`已${store.floatingMusicOpenState ? "打开" : "关闭"}音乐播放器`, MusicMenu);
    if (!store.floatingMusicOpenState && store.musicListShow) {
      window.$closeList?.();
    }
  } else {
    store.musicOpenState = !store.musicOpenState;
    // 修改：原代码误用 floatingMusicOpenState、且图标 MusicListMenu 未定义
    showMessage(`已${store.musicOpenState ? "打开" : "关闭"}音乐播放器`, MusicMenu);
  }
};

// Alt + M：切换音乐列表
const handleAltMKey = (event) => {
  if (!event.altKey || event.key.toLowerCase() !== "m") return;
  event.preventDefault();
  store.boxOpenState = false;
  if (store.setOpenState || store.searchOpenState) {
    store.setOpenState = false;
    store.searchOpenState = false;
  }

  if (store.musicListShow) {
    closeMusicList();
    showMessage(`已关闭音乐列表`, MusicList);
  } else {
    openMusicList();
    showMessage(`已打开音乐列表`, MusicList);
  }
};

// 空格键：播放 / 暂停
const handleSpaceKey = (event) => {
  if (!store.musicIsOk) return;
  if (event.code !== "Space") return;
  if (isInputFocused()) return;
  event.preventDefault();
  changePlayState();
};

// 首次交互：自动播放（仅触发一次）
const handleFirstInteraction = () => {
  playerRef.value?.tryAutoPlay?.();
  removeFirstInteractionListeners();
};

const removeFirstInteractionListeners = () => {
  document.removeEventListener("click", handleFirstInteraction);
  document.removeEventListener("keydown", handleFirstInteraction);
  document.removeEventListener("touchstart", handleFirstInteraction);
};

/* ==================== 监听 ==================== */

// 音量变化同步到播放器
watch(
  () => store.musicVolume,
  (v) => playerRef.value?.changeVolume(v),
  { immediate: true },
);

// 设置页 / 搜索页打开时，自动关闭音乐列表
watch([() => store.setOpenState, () => store.searchOpenState], ([setOpen, searchOpen]) => {
  if ((setOpen || searchOpen) && store.musicListShow) {
    closeMusicList();
  }
});

/* ==================== 生命周期 ==================== */

onMounted(() => {
  // 首次交互监听（自清理）
  document.addEventListener("click", handleFirstInteraction);
  document.addEventListener("keydown", handleFirstInteraction);
  document.addEventListener("touchstart", handleFirstInteraction);

  // 快捷键监听
  document.addEventListener("keydown", handleHorizontalArrow);
  document.addEventListener("keydown", handleVerticalArrow);
  document.addEventListener("keydown", handleHToggle);
  document.addEventListener("keydown", handleMKey);
  document.addEventListener("keydown", handleAltMKey);
  document.addEventListener("keydown", handleSpaceKey);

  // 暴露全局方法（供其他组件调用）
  window.$openList = openMusicList;
  window.$closeList = closeMusicList;
  window.$playerToggle = changePlayState;
  window.$playerChange = changeMusicIndex;
  window.$playerSeek = (val) => {
    const audio = playerRef.value?.getAudioRef?.();
    if (audio) audio.currentTime = val;
  };
  window.$setVolume = (v) => playerRef.value?.changeVolume(v);
});

onBeforeUnmount(() => {
  removeFirstInteractionListeners();
  document.removeEventListener("keydown", handleHorizontalArrow);
  document.removeEventListener("keydown", handleVerticalArrow);
  document.removeEventListener("keydown", handleHToggle);
  document.removeEventListener("keydown", handleMKey);
  document.removeEventListener("keydown", handleAltMKey);
  document.removeEventListener("keydown", handleSpaceKey);
});
</script>

<style lang="scss" scoped>
.music {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  animation: fade 0.5s;

  .btns {
    display: flex;
    align-items: center;
    margin-bottom: 6px;

    span {
      background: var(--main-open-music-bg-color);
      padding: 2px 8px;
      border-radius: 6px;
      margin: 0px 6px;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;

      &:hover {
        background: #ffffff4d;
      }
    }
  }

  .control {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;

    .state {
      transition: opacity 0.1s;

      .i-icon {
        width: 50px;
        height: 50px;
        display: block;
      }
    }

    .i-icon {
      width: 36px;
      height: 36px;
      display: flex;
      border-radius: 6px;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transform: scale(1);

      &:hover {
        background: #ffffff33;
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .menu {
    height: 26px;
    width: 100%;
    line-height: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .name {
      width: 100%;
      text-align: center;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
      animation: fade 0.3s;
    }

    .volume {
      width: 100%;
      padding: 0 12px;
      display: flex;
      align-items: center;
      flex-direction: row;
      animation: fade 0.3s;

      .icon {
        margin-right: 12px;

        span {
          width: 24px;
          height: 24px;
          display: block;
        }
      }

      :deep(*) {
        transition: none;
      }

      :deep(.el-slider__button) {
        transition: 0.3s;
      }

      .el-slider {
        margin-right: 12px;
        --el-slider-main-bg-color: #efefef;
        --el-slider-runway-bg-color: var(--main-cards-header-bg-color);
        --el-slider-button-size: 16px;
      }
    }
  }
}

.music-list {
  position: fixed;
  top: 0;
  left: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background-color: var(--main-mores-bg-color);
  backdrop-filter: blur(20px);
  z-index: 1;

  .list {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    top: calc(50% - 300px);
    left: calc(50% - 320px);
    width: 640px;
    height: 600px;
    background: var(--main-panel-bg-color);
    box-shadow: var(--main-big-box-shadow);
    border-radius: 6px;
    z-index: 999;

    @media (max-width: 720px) {
      left: calc(50% - 45%);
      width: 90%;
    }

    .close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      display: block;

      &:hover {
        transform: scale(1.2);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// 弹窗动画
.zoom-enter-active {
  animation: zoom 0.4s ease-in-out;
}

.zoom-leave-active {
  animation: zoom 0.3s ease-in-out reverse;
}

@keyframes zoom {
  0% {
    opacity: 0;
    transform: scale(0) translateY(-600px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
