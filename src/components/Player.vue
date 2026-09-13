<template>
  <APlayer
    v-if="playList.length"
    ref="player"
    :audio="playList"
    :autoplay="store.playerAutoplay"
    :theme="theme"
    :autoSwitch="false"
    :loop="store.playerLoop"
    :order="store.playerOrder"
    :volume="store.musicVolume"
    :showLrc="true"
    :listFolded="listFolded"
    :listMaxHeight="listMaxHeight"
    :noticeSwitch="false"
    @play="onPlay"
    @pause="onPause"
    @timeupdate="onTimeUp"
    @error="loadMusicError"
    @canplay="onCanplay"
  />
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList } from "@/api";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import { SpeechLocal } from "@/utils/speech";

const store = mainStore();

/* ==================== Props ==================== */

const props = defineProps({
  theme: { type: String, default: "#efefef" },
  volume: { type: Number, default: 0.7, validator: (v) => v >= 0 && v <= 1 },
  songServer: { type: String, default: "netease" },
  songType: { type: String, default: "playlist" },
  songId: { type: String, default: "3778678" },
  listFolded: { type: Boolean, default: false },
  listMaxHeight: { type: Number, default: 420 },
});

/* ==================== 静态配置 ==================== */

// 静态歌单映射（不含自定义）
const STATIC_SONG_IDS = {
  0: import.meta.env.VITE_SONG_ID,
  1: "5059661515",
  2: "2829816518",
};

// APlayer 内置的歌词占位文案 → 本地化替换
const LRC_TEXT_MAP = {
  Loading: "歌词加载中",
  "Not available": "歌词加载失败",
};

/* ==================== 本地状态 ==================== */

const player = ref(null);
const playList = ref([]);

// 歌词同步的 RAF 句柄（提到 setup 作用域，供 onBeforeUnmount 访问）
let lrcRafId = null;

/* ==================== 计算属性 ==================== */

const listHeight = computed(() => `${props.listMaxHeight}px`);

// 当前生效的歌单 ID（动态读取自定义歌单）
const effectiveSongId = computed(() => {
  // 自定义模式：读 store.playCustomSong，为空则回退到默认歌单
  if (store.playerSwitchId === 3) {
    return store.playCustomSong || STATIC_SONG_IDS[0];
  }
  return STATIC_SONG_IDS[store.playerSwitchId] || STATIC_SONG_IDS[0];
});

/* ==================== 歌单加载 ==================== */

const loadPlaylist = async () => {
  try {
    // 先清空，强制 APlayer 重置内部状态
    playList.value = [];
    // 重置播放器状态与歌词，避免残留上一个歌单的信息
    store.playerState = false;
    store.playerLrc = "歌词加载中";
    store.playerTitle = null;
    store.playerArtist = null;
    store.playerCover = null;

    const res = await getPlayerList(props.songServer, props.songType, effectiveSongId.value);
    store.musicIsOk = true;
    playList.value = res;

    // DOM 更新后重置索引 & 按需自动播放
    nextTick(() => {
      const ap = player.value?.aplayer;
      if (!ap) return;
      ap.index = 0;
      if (store.playerAutoplay) {
        player.value.play().catch(() => {});
      }
    });
  } catch (err) {
    console.error("播放列表加载失败：", err);
    store.musicIsOk = false;
    ElMessage({
      message: "播放器加载失败",
      grouping: true,
      icon: h(PlayWrong, { theme: "filled", fill: "#efefef" }),
    });
    if (store.webSpeech) {
      setTimeout(() => SpeechLocal("播放器加载失败.mp3"), 15000);
    }
  }
};

/* ==================== 歌词同步 ==================== */

const syncLrc = () => {
  const ap = player.value?.aplayer;
  if (ap && playList.value.length) {
    const lyrics = ap.lyrics?.[ap.index];
    const current = lyrics?.[ap.lyricIndex];
    if (current) {
      const raw = current[1];
      const lrc = LRC_TEXT_MAP[raw] ?? raw;
      // 只在变化时写，避免无谓的响应式更新
      if (store.playerLrc !== lrc) store.setPlayerLrc(lrc);
    }
  }
  lrcRafId = requestAnimationFrame(syncLrc);
};

/* ==================== 播放事件 ==================== */

const onPlay = () => {
  const ap = player.value?.aplayer;
  if (!ap) return;
  const index = ap.index;
  const song = playList.value[index];
  if (!song) return;

  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(song.name, song.artist, song.cover);
  // 修改：直接用 song 数据，避免再访问 getter
  ElMessage({
    message: `${song.name} - ${song.artist}`,
    grouping: true,
    icon: h(MusicOne, { theme: "filled", fill: "#efefef" }),
  });
};

const onPause = () => {
  const audio = player.value?.audioRef;
  if (audio) store.setPlayerState(audio.paused);
};

const onTimeUp = () => {
  const audio = player.value?.audioRef;
  if (!audio) return;

  const duration = audio.duration || 0;
  const current = audio.currentTime || 0;

  // 底栏进度条
  store.playerCurrentTime = current;
  store.playerDuration = duration;
  // 悬浮面板
  store.audioCurrent = current;
  store.audioDuration = duration;
};

const onCanplay = () => {
  store.setPlayerCanplay(true);
  if (player.value?.audioRef) store.audioRef = player.value.audioRef;
  updatePositionState();
};

const loadMusicError = () => {
  const hasNext = playList.value.length > 1;
  ElMessage({
    message: hasNext ? "播放歌曲出现错误，播放器将在 2s 后进行下一首" : "播放歌曲出现错误",
    grouping: true,
    icon: h(PlayWrong, { theme: "filled", fill: "#EFEFEF" }),
    duration: 2000,
  });
  if (store.webSpeech) {
    SpeechLocal(hasNext ? "歌曲加载失败.mp3" : "播放器未知异常.mp3");
  }
  // 添加空值保护，避免 player 状态异常时再次报错
  const audioList = player.value?.aplayer?.audio;
  const currentIndex = player.value?.aplayer?.index;
  if (audioList && audioList[currentIndex]) {
    console.error("播放歌曲错误: " + audioList[currentIndex].name);
  }
};

// 媒体会话位置状态（部分浏览器支持）
const updatePositionState = () => {
  if (!("mediaSession" in navigator)) return;
  const status = player.value?.audioStatus;
  if (!status) return;
  navigator.mediaSession.setPositionState({
    duration: status.duration,
    position: status.playedTime,
  });
};

/* ==================== 对外暴露的播放器控制 ==================== */

const playToggle = () => player.value?.toggle();
const changeVolume = (value) => player.value?.setVolume(value, false);
const toggleList = () => player.value?.toggleList();
const getAudioRef = () => player.value?.audioRef || null;

const changeSong = (type) => {
  if (!player.value) return;
  if (type === 0) player.value.skipBack();
  else player.value.skipForward();
  nextTick(() => player.value?.play());
};

defineExpose({ playToggle, changeVolume, changeSong, toggleList, getAudioRef });

/* ==================== 监听 ==================== */

// 播放列表更新后，确保索引归零
watch(playList, (newVal) => {
  const ap = player.value?.aplayer;
  if (newVal.length && ap && ap.index !== 0) ap.index = 0;
});

// 随机模式 / 循环模式：直接同步给 APlayer 实例
watch([() => store.playerOrder, () => store.playerLoop], ([order, loop]) => {
  const ap = player.value?.aplayer;
  if (!ap) return;
  ap.order = order;
  ap.loop = loop;
});

// 切换歌单：立即加载
watch(() => store.playerSwitchId, loadPlaylist);

// 自定义歌单 ID 变化时：防抖加载（避免输入过程中频繁请求）
let customSongTimer = null;
watch(
  () => store.playCustomSong,
  () => {
    if (store.playerSwitchId !== 3) return;
    if (customSongTimer) clearTimeout(customSongTimer);
    customSongTimer = setTimeout(loadPlaylist, 800);
  },
);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  nextTick(loadPlaylist);
  lrcRafId = requestAnimationFrame(syncLrc);
});

onBeforeUnmount(() => {
  // 修复：原 rafId 声明在 onMounted 内部，这里访问不到
  if (lrcRafId) cancelAnimationFrame(lrcRafId);
  // 组件卸载时清理定时器
  if (customSongTimer) clearTimeout(customSongTimer);
});
</script>

<style lang="scss" scoped>
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "HarmonyOS_Regular", sans-serif !important;
  box-shadow: var(--main-small-box-shadow) !important;
  text-shadow: var(--main-small-text-shadow);

  :deep(.aplayer-body) {
    background-color: transparent;

    .aplayer-pic {
      display: none;
    }

    .aplayer-info {
      margin-left: 0;
      background-color: var(--main-cards-header-bg-color);
      border-color: transparent !important;

      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 2px;
        overflow: initial;

        .aplayer-title {
          font-size: 16px;
          margin-right: 6px;
        }

        .aplayer-author {
          color: #efefef;
        }
      }

      .aplayer-lrc {
        text-align: left;
        margin: 7px 0 6px 6px;
        height: 44px;
        mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0) 100%
        );
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0) 100%
        );

        &::before,
        &::after {
          display: none;
        }

        p {
          color: #efefef;
        }

        .aplayer-lrc-current {
          font-size: 0.95rem;
          margin-bottom: 4px !important;
        }
      }

      .aplayer-controller {
        display: none;
      }
    }
  }

  :deep(.aplayer-list) {
    height: v-bind(listHeight);
    border-top: 0;
    background-color: var(--main-cards-body-bg-color);

    ol {
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      li {
        border-color: transparent;

        &.aplayer-list-light {
          background: var(--main-cards-header-bg-color);
          border-radius: 6px;
        }

        &:hover {
          background: var(--main-open-music-bg-color) !important;
          border-radius: 6px !important;
        }

        .aplayer-list-index,
        .aplayer-list-author {
          color: #efefef;
        }
      }
    }
  }
}
</style>
