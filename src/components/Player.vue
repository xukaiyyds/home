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
    :volume="volume"
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

const player = ref(null);
const playList = ref([]);
const playIndex = ref(0);

const props = defineProps({
  theme: { type: String, default: "#efefef" },
  volume: { type: Number, default: 0.7, validator: (v) => v >= 0 && v <= 1 },
  songServer: { type: String, default: "netease" },
  songType: { type: String, default: "playlist" },
  songId: { type: String, default: "3778678" },
  listFolded: { type: Boolean, default: false },
  listMaxHeight: { type: Number, default: 420 },
});

const listHeight = computed(() => props.listMaxHeight + "px");

// 歌单ID映射
const songIdMap = {
  0: import.meta.env.VITE_SONG_ID,
  1: "5059661515",
  2: "2829816518",
  3: store.playCustomSong,
};

const effectiveSongId = computed(() => {
  return songIdMap[store.playerSwitchId] || songIdMap[0];
});

const loadPlaylist = async () => {
  try {
    // 先清空播放列表，强制 APlayer 重置
    playList.value = [];
    const res = await getPlayerList(props.songServer, props.songType, effectiveSongId.value);
    store.musicIsOk = true;
    // 赋值新歌单
    playList.value = res;
    console.log("音乐加载完成", playList.value);

    // 等待 DOM 更新后重置索引
    nextTick(() => {
      if (player.value && player.value.aplayer) {
        // 重置索引到 0
        player.value.aplayer.index = 0;
        // 如果自动播放开启，尝试播放
        if (store.playerAutoplay) {
          player.value.play().catch(() => {});
        }
      }
    });
  } catch (err) {
    console.error(err);
    store.musicIsOk = false;
    ElMessage({
      message: "播放器加载失败",
      grouping: true,
      icon: h(PlayWrong, { theme: "filled", fill: "#efefef" }),
    });
    if (store.webSpeech) {
      setTimeout(() => {
        SpeechLocal("播放器加载失败.mp3");
      }, 15000);
    }
  }
};

// 监听播放列表变化，当列表更新且不为空时，确保索引为0
watch(
  playList,
  (newVal) => {
    if (newVal.length && player.value && player.value.aplayer) {
      // 如果当前索引不是0，重置
      if (player.value.aplayer.index !== 0) {
        player.value.aplayer.index = 0;
      }
    }
  },
  { deep: false },
);

// 监听随机播放
watch(
  () => store.playerOrder,
  (newOrder) => {
    if (!player.value) return;
    player.value.aplayer.order = newOrder;
  },
);

// 监听循环模式
watch(
  () => store.playerLoop,
  (newLoop) => {
    if (!player.value) return;
    if (player.value) {
      player.value.aplayer.loop = newLoop;
    }
  },
);

// 监听歌单切换
watch(() => store.playerSwitchId, loadPlaylist);

onMounted(() => {
  nextTick(loadPlaylist);
});

// 播放事件
const onPlay = () => {
  playIndex.value = player.value.aplayer.index;
  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, { theme: "filled", fill: "#efefef" }),
  });
};

const onPause = () => {
  store.setPlayerState(player.value.audioRef.paused);
};

const onTimeUp = () => {
  store.playerCurrentTime = player.value.audioStatus.playedTime;
  store.playerDuration = player.value.audioStatus.duration;
  let lyrics = player.value.aplayer.lyrics[playIndex.value];
  let idx = player.value.aplayer.lyricIndex;
  if (!lyrics || !lyrics[idx]) return;
  let lrc = lyrics[idx][1];
  if (lrc === "Loading") lrc = "歌词加载中";
  else if (lrc === "Not available") lrc = "歌词加载失败";
  store.setPlayerLrc(lrc);
};

const playToggle = () => player.value.toggle();
const changeVolume = (value) => player.value.setVolume(value, false);
const changeSong = (type) => {
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  nextTick(() => player.value.play());
};
const toggleList = () => player.value.toggleList();

const loadMusicError = () => {
  let notice =
    playList.value.length > 1 ? "播放歌曲出现错误，播放器将在 2s 后进行下一首" : "播放歌曲出现错误";
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, { theme: "filled", fill: "#EFEFEF" }),
    duration: 2000,
  });
  if (store.webSpeech) {
    if (playList.value.length > 1) {
      SpeechLocal("歌曲加载失败.mp3");
    } else {
      SpeechLocal("播放器未知异常.mp3");
    }
  }
  console.error("播放歌曲错误: " + player.value.aplayer.audio[player.value.aplayer.index].name);
};

const getAudioRef = () => {
  return player.value?.audioRef || null;
};

function updatePositionState() {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setPositionState({
      duration: player.value.audioStatus.duration,
      position: player.value.audioStatus.playedTime,
    });
  }
}

const onCanplay = () => {
  store.setPlayerCanplay(true);
  if (player.value?.audioRef) {
    store.audioRef = player.value.audioRef;
  }
  updatePositionState();
};

defineExpose({ playToggle, changeVolume, changeSong, toggleList, getAudioRef });
</script>

<style lang="scss" scoped>
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "HarmonyOS_Regular", sans-serif !important;
  box-shadow: var(--main-small-box-shadow) !important;

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
          hsla(0deg, 0%, 100%, 0)
        );
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
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
