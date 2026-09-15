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
import METAKEYWORDS from "@/assets/metadataKeywords.json";
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

// 判断一行歌词是否为元数据（去掉括号内容后是否含关键词）
const isMetadataLine = (text) => {
  if (!text) return false;
  // 去掉所有括号内容（中英文括号都处理），避免"（作词）"这种
  const pureText = text.replace(/[（(【\[].*?[）)】\]]/g, "").trim();
  // 有纯文本时按纯文本判断；整行都是括号内容时按原文判断
  const target = pureText || text;
  return METAKEYWORDS.some((kw) => target.includes(kw));
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

// 自动播放尝试逻辑，满足三个条件才尝试：开了自动播放 & 有歌单 & 当前未播放
const tryAutoPlay = async () => {
  if (!store.playerAutoplay) return;
  if (store.playerState) return;
  if (!playList.value.length) return;
  const p = player.value;
  if (!p) return;

  try {
    await p.play();
  } catch {
    // 用户没交互过，弹提示引导
    if (!hasShownAutoplayTip) {
      hasShownAutoplayTip = true;
      ElMessage({
        message: "点击页面任意处即可开始播放音乐",
        grouping: true,
      });
    }
  }
};

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
      tryAutoPlay();
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

// 当前歌曲解析后的歌词行 [{ time, text }]
let currentLrcLines = [];
let rawLrcText = "";

// 解析 LRC 文本为 [{ time, text }]
const parseLrc = (lrcText) => {
  if (!lrcText || typeof lrcText !== "string") return [];
  const lines = [];
  const timeReg = /\[(\d+):(\d+)(?:[.:](\d+))?\]/g;
  const sectionReg = /^\[[^\]]+\]$/;
  const transReg = /\s*[（(][^（()）]*[\u4e00-\u9fa5][^（()）]*[）)]\s*$/;

  lrcText.split("\n").forEach((line) => {
    const matches = [...line.matchAll(timeReg)];
    if (!matches.length) return;
    // 先去掉时间戳
    let text = line.replace(timeReg, "").trim();
    if (!text) return;

    // 移除所有 【...】 及其内容
    text = text.replace(/【[^】]*】/g, "").trim();
    // 如果移除后为空，说明这行只有版权声明，跳过
    if (!text) return;

    // 关闭翻译时，去掉行尾的翻译括号
    if (!store.playerTrLrc) {
      text = text.replace(transReg, "").trim();
      if (!text) return;
    }

    // 整行只有方括号内容的，跳过
    if (sectionReg.test(text)) return;

    // 过滤元数据行
    if (isMetadataLine(text)) return;

    matches.forEach((m) => {
      const min = parseInt(m[1]);
      const sec = parseInt(m[2]);
      const ms = m[3] ? parseInt(m[3].padEnd(3, "0")) : 0;
      lines.push({ time: min * 60 + sec + ms / 1000, text });
    });
  });

  return lines.sort((a, b) => a.time - b.time);
};

// 加载当前歌曲的歌词（从 audio.src 提取 id，避免索引错位）
let lrcRequestToken = 0;

const loadCurrentLrc = async (songId) => {
  const token = ++lrcRequestToken;

  if (!songId) {
    if (token === lrcRequestToken) currentLrcLines = [];
    return;
  }

  try {
    const url = `${import.meta.env.VITE_SONG_API}?server=${props.songServer}&type=lrc&id=${songId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    if (token !== lrcRequestToken) return;
    rawLrcText = text;
    currentLrcLines = parseLrc(text);
  } catch (err) {
    if (token !== lrcRequestToken) return;
    console.error("[歌词] 加载失败:", err);
    currentLrcLines = [];
  }
};

// 根据播放时间找当前歌词行，同步到底栏
const updateLrc = () => {
  if (!currentLrcLines.length) return;
  const audio = player.value?.audioRef;
  if (!audio) return;

  const t = audio.currentTime;

  // 前奏阶段：还没到第一句歌词的时间，显示歌曲名
  if (t < currentLrcLines[0].time) {
    const title = store.playerTitle;
    const artist = store.playerArtist;
    const display = title ? (artist ? `${title} - ${artist}` : title) : "歌词加载中";
    if (store.playerLrc !== display) store.setPlayerLrc(display);
    return;
  }

  // 已进入歌词区域：按时间匹配
  let line = currentLrcLines[0];
  for (let i = currentLrcLines.length - 1; i >= 0; i--) {
    if (currentLrcLines[i].time <= t) {
      line = currentLrcLines[i];
      break;
    }
  }
  if (line && store.playerLrc !== line.text) {
    store.setPlayerLrc(line.text);
  }
};

// RAF 循环驱动
const syncLrc = () => {
  updateLrc();
  lrcRafId = requestAnimationFrame(syncLrc);
};

// 从正在播放的 audio.src 提取歌曲 id
const getCurrentSongId = () => {
  const audio = player.value?.audioRef;
  if (!audio?.src) return null;
  const m = audio.src.match(/[?&]id=(\d+)/);
  return m ? m[1] : null;
};

// 根据 id 在 playList 里找到对应歌曲（兼容 s.id 和 s.url 两种）
const findSongById = (songId) => {
  if (!songId) return null;
  return playList.value.find((s) => {
    if (s.id && String(s.id) === songId) return true;
    if (s.url) {
      const m = s.url.match(/[?&]id=(\d+)/);
      return m && m[1] === songId;
    }
    return false;
  });
};

/* ==================== 播放事件 ==================== */

const onPlay = async () => {
  const songId = getCurrentSongId();
  const song = findSongById(songId);
  if (!song) return;

  const ap = player.value?.aplayer;

  if (ap) {
    const realIndex = playList.value.indexOf(song);
    if (realIndex >= 0 && ap.index !== realIndex) {
      ap.index = realIndex;
    }
  }

  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(song.name, song.artist, song.cover);
  if (store.messageShow) {
    ElMessage({
      message: `${song.name} - ${song.artist}`,
      grouping: true,
      icon: h(MusicOne, { theme: "filled", fill: "#efefef" }),
    });
  }

  store.setPlayerLrc(song.artist ? `${song.name} - ${song.artist}` : song.name);
  currentLrcLines = [];
  await loadCurrentLrc(songId);
  updateLrc();
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
  if (!status || !status.duration || status.duration <= 0) return; // ← 加 !duration 判断
  try {
    navigator.mediaSession.setPositionState({
      duration: status.duration,
      position: status.playedTime,
    });
  } catch {}
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

defineExpose({ playToggle, changeVolume, changeSong, toggleList, getAudioRef, tryAutoPlay });

/* ==================== 监听 ==================== */

// 自动播放
watch(() => store.playerAutoplay, tryAutoPlay);

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

// 歌词翻译开关变化时，重新解析当前歌词（不重新请求）
watch(
  () => store.playerTrLrc,
  () => {
    if (!rawLrcText) return;
    currentLrcLines = parseLrc(rawLrcText);
    updateLrc();
  },
);

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
  currentLrcLines = [];
  lrcRequestToken++; // 让未完成的请求结果被丢弃
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
