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
import { parseYRC, findYrcLineIndex, findYrcWordIndex } from "@/utils/yrc";
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
    store.playerYrcLines = [];
    store.playerYrcCurrent = null;

    const res = await getPlayerList(props.songServer, props.songType, effectiveSongId.value);
    store.musicIsOk = true;
    playList.value = res;

    nextTick(() => {
      const ap = player.value?.aplayer;
      if (!ap) return;
      ap.index = 0;
      tryAutoPlay();
      setTimeout(syncPlayerIndex, 300);

      // 切换歌单后，如果全局音乐列表是打开状态，确保列表重新展开
      if (store.musicListShow) {
        setTimeout(() => {
          const list = document.querySelector(".music-list .aplayer-list");
          if (list && list.classList.contains("aplayer-list-hide")) {
            player.value?.toggleList();
          }
        }, 500);
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

// 当前歌曲解析后的歌词行 [{ time, text }]
let currentLrcLines = [];
let rawLrcText = "";

// 把翻译 LRC 解析为 [{ ms, text }]，用于逐字模式查找
const parseTranslation = (transText) => {
  if (!transText) return [];
  const timeReg = /^\[(\d+):(\d+)(?:[.:](\d+))?\]/;
  const list = [];
  transText.split("\n").forEach((line) => {
    const m = line.match(timeReg);
    if (!m) return;
    const ms =
      parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseInt((m[3] || "000").padEnd(3, "0"));
    const text = line.replace(timeReg, "").trim();
    if (text) list.push({ ms, text });
  });
  return list;
};

// 找到与某时间戳最接近的翻译
const findTranslation = (ms) => {
  const list = store.playerTransLines;
  if (!list.length) return "";
  let best = null;
  let bestDist = 300;
  for (const item of list) {
    const dist = Math.abs(item.ms - ms);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best ? best.text : "";
};

// 把翻译按时间轴合并到原歌词行末
const mergeTranslation = (lrcText, transText) => {
  if (!transText) return lrcText;

  const timeReg = /^\[(\d+):(\d+)(?:[.:](\d+))?\]/;
  const toMs = (m) =>
    parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseInt((m[3] || "000").padEnd(3, "0"));

  // 解析翻译为 [{ ms, text }]
  const transList = [];
  transText.split("\n").forEach((line) => {
    const m = line.match(timeReg);
    if (!m) return;
    const text = line.replace(timeReg, "").trim();
    if (text) transList.push({ ms: toMs(m), text });
  });

  if (!transList.length) return lrcText;

  // 逐行匹配：在 ±300ms 容差内找最近的翻译
  return lrcText
    .split("\n")
    .map((line) => {
      const m = line.match(timeReg);
      if (!m) return line;
      const lineMs = toMs(m);

      let best = null;
      let bestDist = 300; // 容差 300ms
      for (const item of transList) {
        const dist = Math.abs(item.ms - lineMs);
        if (dist < bestDist) {
          bestDist = dist;
          best = item;
        }
      }
      if (!best) return line;
      // 避免翻译和原文一样（有些歌翻译就是原文）
      const originalText = line.replace(timeReg, "").trim();
      if (best.text === originalText) return line;
      return `${line} (${best.text})`;
    })
    .join("\n");
};

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
    const url = `${import.meta.env.VITE_SONG_API}/lyric/new?id=${songId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (token !== lrcRequestToken) return;

    // 原文
    const rawLrc = data.lrc?.lyric || "";
    // 翻译：逐字歌词在 ytlrc，逐行歌词在 tlyric
    const rawTrans = data.ytlrc?.lyric || data.tlyric?.lyric || "";

    // 把翻译合并到原文：`[00:12.34]原文 (翻译)`
    rawLrcText = mergeTranslation(rawLrc, rawTrans);
    // 保存翻译行给逐字模式用
    store.playerTransLines = parseTranslation(rawTrans);
    currentLrcLines = parseLrc(rawLrcText);

    // 逐字歌词
    if (data.yrc?.lyric) {
      store.playerYrcLines = parseYRC(data.yrc.lyric);
    } else {
      store.playerYrcLines = [];
    }
  } catch (err) {
    if (token !== lrcRequestToken) return;
    console.error("[歌词] 加载失败:", err);
    currentLrcLines = [];
    store.playerYrcLines = [];
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

const syncLrc = () => {
  const audio = player.value?.audioRef;
  const yrcLines = store.playerYrcLines;

  if (audio && yrcLines.length) {
    const nowMs = audio.currentTime * 1000;
    const lineIdx = findYrcLineIndex(yrcLines, nowMs);

    if (lineIdx >= 0) {
      const line = yrcLines[lineIdx];
      const wordIdx = findYrcWordIndex(line.words, nowMs);

      // 查找当前行的翻译
      const translation = store.playerTrLrc ? findTranslation(line.start) : "";

      const current = store.playerYrcCurrent;

      if (!current || current.lineIdx !== lineIdx || current.translation !== translation) {
        store.playerYrcCurrent = {
          lineIdx,
          wordIdx,
          words: line.words,
          translation,
        };
      } else if (current.wordIdx !== wordIdx) {
        store.playerYrcCurrent.wordIdx = wordIdx;
      }
    } else {
      if (store.playerYrcCurrent) {
        store.playerYrcCurrent = null;
        updateLrc();
      }
    }
  } else {
    if (store.playerYrcCurrent) store.playerYrcCurrent = null;
    updateLrc();
  }

  lrcRafId = requestAnimationFrame(syncLrc);
};

// 从 audio.src 反查歌曲在 playList 中的位置，同步给 APlayer
const syncPlayerIndex = () => {
  const ap = player.value?.aplayer;
  const audio = player.value?.audioRef;
  if (!ap || !audio?.src) return;
  if (!playList.value.length) return;

  const srcFile = audio.src.split("/").pop()?.split("?")[0];
  if (!srcFile) return;

  const realIndex = playList.value.findIndex((s) => {
    const sFile = s.url.split("/").pop()?.split("?")[0];
    return sFile === srcFile;
  });

  if (realIndex >= 0 && ap.index !== realIndex) {
    ap.index = realIndex;
  }
};

const getCurrentSong = () => {
  const audio = player.value?.audioRef;
  const ap = player.value?.aplayer;

  // 优先用 audio.src 匹配（随机模式下 ap.index 可能不准）
  if (audio?.src && playList.value.length) {
    const srcFile = audio.src.split("/").pop()?.split("?")[0];
    if (srcFile) {
      const match = playList.value.find((s) => {
        const sFile = s.url.split("/").pop()?.split("?")[0];
        return sFile === srcFile;
      });
      if (match) return match;
    }
  }

  // 兜底：ap.index
  if (!ap) return null;
  return playList.value[ap.index] || null;
};

/* ==================== 播放事件 ==================== */

const onPlay = async () => {
  const song = getCurrentSong();
  if (!song) return;

  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(song.name, song.artist, song.cover);
  syncPlayerIndex();
  if (store.messageShow) {
    ElMessage({
      message: `${song.name} - ${song.artist}`,
      grouping: true,
      icon: h(MusicOne, { theme: "filled", fill: "#efefef" }),
    });
  }

  store.setPlayerLrc(song.artist ? `${song.name} - ${song.artist}` : song.name);
  currentLrcLines = [];
  await loadCurrentLrc(song.id);
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
  syncPlayerIndex();
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
    // 逐行：重新解析
    if (rawLrcText) {
      currentLrcLines = parseLrc(rawLrcText);
      updateLrc();
    }
    // 逐字：清空让下次 syncLrc 重建（会带上新的 translation）
    if (store.playerYrcCurrent) {
      store.playerYrcCurrent = { ...store.playerYrcCurrent };
    }
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
