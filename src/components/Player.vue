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
const retryMap = new Set();
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

// 翻译行与原歌词行的最大时间容差（毫秒）
const TRANS_TOLERANCE = 300;

// 自动播放失败的提示（只弹一次）
let hasShownAutoplayTip = false;

// 播放错误提示时长
const ERROR_MSG_DURATION = 2000;

/* ==================== 本地状态 ==================== */

const player = ref(null);
const playList = ref([]);

// 歌词同步的 RAF 句柄
let lrcRafId = null;

// 当前歌曲解析后的歌词行 [{ time, text }]
let currentLrcLines = [];
// 逐字翻译行 [{ ms, text }]（来自 ytlrc，仅供逐字模式使用）
let currentYrcTransLines = [];

// 防抖加载定时器
let customSongTimer = null;

// 歌词请求 token（防止旧请求覆盖新请求）
let lrcRequestToken = 0;

/* ==================== 计算属性 ==================== */

const listHeight = computed(() => `${props.listMaxHeight}px`);

// 当前生效的歌单 ID（动态读取自定义歌单）
const effectiveSongId = computed(() => {
  if (store.playerSwitchId === 3) {
    return store.playCustomSong || STATIC_SONG_IDS[0];
  }
  return STATIC_SONG_IDS[store.playerSwitchId] || STATIC_SONG_IDS[0];
});

/* ==================== 工具函数 ==================== */

// 从 audio.src 中提取文件名（用于匹配歌曲）
const getAudioFileName = () => {
  const src = player.value?.audioRef?.src;
  if (!src) return null;
  return src.split("/").pop()?.split("?")[0] || null;
};

// 按文件名在 playList 中查找歌曲
const findSongByAudioSrc = () => {
  const fileName = getAudioFileName();
  if (!fileName || !playList.value.length) return null;
  return playList.value.find((s) => s.url.split("/").pop()?.split("?")[0] === fileName) || null;
};

// 清空逐字歌词状态
const clearYrcState = () => {
  store.playerYrcLines = [];
  store.playerYrcCurrent = null;
};

// LRC 时间戳正则
const LRC_TIME_REG = /^\[(\d+):(\d+)(?:[.:](\d+))?\]/;

// 把 LRC 时间戳 match 转成毫秒
const timeMatchToMs = (m) =>
  parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseInt((m[3] || "000").padEnd(3, "0"));

// 判断一行歌词是否为元数据
const isMetadataLine = (text) => {
  if (!text) return false;
  const pureText = text.replace(/[（(【\[].*?[）)】\]]/g, "").trim();
  const target = pureText || text;
  return METAKEYWORDS.some((kw) => target.includes(kw));
};

/* ==================== 歌单加载 ==================== */

// 自动播放尝试逻辑
const tryAutoPlay = async () => {
  if (!store.playerAutoplay) return;
  if (store.playerState) return;
  if (!playList.value.length) return;
  const p = player.value;
  if (!p) return;

  try {
    await p.play();
  } catch {
    if (!hasShownAutoplayTip) {
      hasShownAutoplayTip = true;
      ElMessage({
        message: "点击页面任意处即可开始播放音乐",
        grouping: true,
      });
    }
  }
};

// 从 audio.src 反查歌曲索引，同步给 APlayer
const syncPlayerIndex = () => {
  const ap = player.value?.aplayer;
  if (!ap) return;
  const realIndex = playList.value.findIndex(
    (s) => s.url.split("/").pop()?.split("?")[0] === getAudioFileName(),
  );
  if (realIndex >= 0 && ap.index !== realIndex) {
    ap.index = realIndex;
  }
};

let playlistToken = 0;

const loadPlaylist = async () => {
  const token = ++playlistToken;
  try {
    // 先清空，强制 APlayer 重置内部状态
    playList.value = [];
    // 重置播放器状态与歌词
    store.playerState = false;
    store.playerLrc = "歌词加载中";
    store.playerTitle = null;
    store.playerArtist = null;
    store.playerCover = null;
    clearYrcState();

    const res = await getPlayerList(props.songServer, props.songType, effectiveSongId.value);
    if (token !== playlistToken) return;
    const list = Array.isArray(res) ? res : [];
    playList.value = list;
    store.musicIsOk = list.length > 0;
    if (!store.musicIsOk) {
      ElMessage({ message: "歌单为空", grouping: true });
      return;
    }

    nextTick(() => {
      const ap = player.value?.aplayer;
      if (!ap) return;
      tryAutoPlay();
      setTimeout(syncPlayerIndex, 300);

      // 切换歌单后，若音乐列表打开，确保列表重新展开
      if (store.musicListShow) {
        setTimeout(() => {
          const list = document.querySelector(".music-list .aplayer-list");
          if (list?.classList.contains("aplayer-list-hide")) {
            player.value?.toggleList();
          }
        }, 500);
      }
    });
  } catch (err) {
    if (token !== playlistToken) return;
    console.error("播放列表加载失败：", err);
    store.musicIsOk = false;
    ElMessage({
      message: "播放器加载失败",
      grouping: true,
      icon: h(PlayWrong, { theme: "filled", fill: "#efefef" }),
    });
    if (store.webSpeech) {
      setTimeout(() => SpeechLocal("播放器加载失败.mp3"), 17000);
    }
  }
};

/* ==================== 歌词解析 ==================== */

// 把翻译 LRC 解析为 [{ ms, text }]
const parseTranslation = (transText) => {
  if (!transText) return [];
  const list = [];
  transText.split("\n").forEach((line) => {
    const m = line.match(LRC_TIME_REG);
    if (!m) return;
    const text = line.replace(LRC_TIME_REG, "").trim();
    if (text) list.push({ ms: timeMatchToMs(m), text });
  });
  return list;
};

// ytlrc 可能的时间戳格式：[startMs,durationMs] 或 [mm:ss.ms]
const YRC_LINE_REG = /^\[(\d+),(\d+)\]/;
// ytlrc 中可能夹杂的逐字标记：(wordStart,wordDuration,flag)
const YRC_WORD_TAG = /\(\d+,\d+,\d*\)/g;

// 解析 ytlrc（逐字翻译）为 [{ ms, text }]
const parseYrcTranslation = (ytlrcText) => {
  if (!ytlrcText) return [];
  const list = [];
  ytlrcText.split("\n").forEach((raw) => {
    let ms = null;
    let line = raw;

    // 优先逐字时间戳 [startMs,durationMs]
    const ym = line.match(YRC_LINE_REG);
    if (ym) {
      ms = parseInt(ym[1]);
      line = line.slice(ym[0].length);
    } else {
      // 回退标准 LRC 时间戳 [mm:ss.ms]
      const lm = line.match(LRC_TIME_REG);
      if (!lm) return;
      ms = timeMatchToMs(lm);
      line = line.slice(lm[0].length);
    }

    // 去掉逐字标记，只留纯文本
    const text = line.replace(YRC_WORD_TAG, "").trim();
    if (text) list.push({ ms, text });
  });
  return list;
};

// 找到与某时间戳最接近的翻译
const findTranslation = (ms) => {
  // 优先 ytlrc（逐字翻译）；为空时回退到 tlyric（逐行翻译，已在 store.playerTransLines）
  const list = currentYrcTransLines.length ? currentYrcTransLines : store.playerTransLines;
  if (!list.length) return "";
  let best = null;
  let bestDist = TRANS_TOLERANCE;
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
  if (!transText) return { text: lrcText, list: [] };

  const transList = parseTranslation(transText);
  if (!transList.length) return { text: lrcText, list: [] };

  const text = lrcText
    .split("\n")
    .map((line) => {
      const m = line.match(LRC_TIME_REG);
      if (!m) return line;
      const lineMs = timeMatchToMs(m);

      let best = null;
      let bestDist = TRANS_TOLERANCE;
      for (const item of transList) {
        const dist = Math.abs(item.ms - lineMs);
        if (dist < bestDist) {
          bestDist = dist;
          best = item;
        }
      }
      if (!best) return line;

      const originalText = line.replace(LRC_TIME_REG, "").trim();
      if (best.text === originalText) return line;
      return `${line} (${best.text})`;
    })
    .join("\n");

  return { text, list: transList };
};

// 解析 LRC 文本为 [{ time, text }]
const parseLrc = (lrcText) => {
  if (!lrcText || typeof lrcText !== "string") return [];
  const lines = [];
  const timeReg = /\[(\d+):(\d+)(?:[.:](\d+))?\]/g;
  const sectionReg = /^\[[^\]]+\]$/;

  lrcText.split("\n").forEach((line) => {
    const matches = [...line.matchAll(timeReg)];
    if (!matches.length) return;

    let text = line.replace(timeReg, "").trim();
    if (!text) return;

    // 移除所有 【...】 及其内容
    text = text.replace(/【[^】]*】/g, "").trim();
    if (!text) return;

    if (sectionReg.test(text)) return;
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

/* ==================== 歌词加载 ==================== */

const loadCurrentLrc = async (songId) => {
  const token = ++lrcRequestToken;

  if (!songId) {
    if (token === lrcRequestToken) {
      currentLrcLines = [];
      currentYrcTransLines = [];
      store.playerYrcLines = [];
      store.playerYrcCurrent = null;
    }
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
    // 逐行翻译：tlyric（标准 LRC 时间戳，供逐行模式）
    const rawTrans = data.tlyric?.lyric || "";
    // 逐字翻译：ytlrc（[startMs,durationMs] 格式，供逐字模式）
    const rawYrcTrans = data.ytlrc?.lyric || "";

    const merged = mergeTranslation(rawLrc, rawTrans);
    store.playerTransLines = merged.list;
    currentLrcLines = parseLrc(merged.text);

    // 逐字翻译
    currentYrcTransLines = parseYrcTranslation(rawYrcTrans);

    // 逐字歌词
    store.playerYrcLines = data.yrc?.lyric ? parseYRC(data.yrc.lyric) : [];
  } catch (err) {
    if (token !== lrcRequestToken) return;
    console.error("[歌词] 加载失败:", err);
    currentLrcLines = [];
    currentYrcTransLines = [];
    store.playerYrcLines = [];
    store.playerYrcCurrent = null;
    store.playerTransLines = [];
  }
};

/* ==================== 歌词同步循环 ==================== */

// 逐行模式：根据播放时间找当前行
const updateLrc = () => {
  if (!currentLrcLines.length) return;
  const audio = player.value?.audioRef;
  if (!audio) return;

  const t = audio.currentTime;

  // 前奏阶段：显示歌名
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

// 逐字模式：更新 playerYrcCurrent
const updateYrcCurrent = (audio) => {
  const yrcLines = store.playerYrcLines;
  const nowMs = audio.currentTime * 1000;
  const lineIdx = findYrcLineIndex(yrcLines, nowMs);

  if (lineIdx < 0) {
    // 前奏阶段：清空
    if (store.playerYrcCurrent) {
      store.playerYrcCurrent = null;
      updateLrc();
    }
    return;
  }

  const line = yrcLines[lineIdx];
  const wordIdx = findYrcWordIndex(line.words, nowMs);
  const translation = store.playerTrLrc ? findTranslation(line.start) : "";

  const current = store.playerYrcCurrent;

  // 换行或翻译变化 → 重建对象
  if (!current || current.lineIdx !== lineIdx || current.translation !== translation) {
    store.playerYrcCurrent = { lineIdx, wordIdx, words: line.words, translation };
  } else if (current.wordIdx !== wordIdx) {
    store.playerYrcCurrent = { ...current, wordIdx };
  }
};

// RAF 驱动
const syncLrc = () => {
  const audio = player.value?.audioRef;

  // 只有"开了开关 + 有逐字数据 + 有音频"时才走逐字
  if (audio && store.playerYrcEnabled && store.playerYrcLines.length) {
    updateYrcCurrent(audio);
  } else {
    if (store.playerYrcCurrent) store.playerYrcCurrent = null;
    updateLrc();
  }

  lrcRafId = requestAnimationFrame(syncLrc);
};

/* ==================== 当前歌曲 ==================== */

// 优先用 audio.src 匹配（随机模式下 ap.index 可能不准）
const getCurrentSong = () => {
  const match = findSongByAudioSrc();
  if (match) return match;

  const ap = player.value?.aplayer;
  if (!ap) return null;
  return playList.value[ap.index] || null;
};

/* ==================== 播放事件 ==================== */

const onPlay = async () => {
  const song = getCurrentSong();
  if (!song) return;

  // 每次真正开始播一首歌，清掉它的重试标记
  retryMap.delete(song.id);

  store.setPlayerState(player.value?.audioRef?.paused ?? false);
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
  clearYrcState();
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

const loadMusicError = async () => {
  const ap = player.value?.aplayer;
  const audio = player.value?.audioRef;
  if (!ap || !audio?.src) return;

  // 反查当前歌曲
  const currentFile = audio.src.split("/").pop()?.split("?")[0];
  const index = playList.value.findIndex(
    (s) => s.url.split("/").pop()?.split("?")[0] === currentFile,
  );
  if (index < 0) return;

  const song = playList.value[index];

  // 已经重试过一次还是失败 → 放弃，让 APlayer 切下一首
  if (retryMap.has(song.id)) {
    retryMap.delete(song.id);
    console.error("播放失败（已重试过）: " + song.name);
    ElMessage({
      message: `歌曲《${song.name}》无法播放，已跳过`,
      grouping: true,
      icon: h(PlayWrong, { theme: "filled", fill: "#EFEFEF" }),
      duration: ERROR_MSG_DURATION,
    });
    return;
  }

  retryMap.add(song.id);
  console.log(`[播放器] URL 过期，重新获取: ${song.name}`);

  try {
    const base = import.meta.env.VITE_SONG_API;
    const res = await fetch(`${base}/song/url/v1?id=${song.id}&level=exhigh`);
    const data = await res.json();

    // 请求期间用户切歌了 → 放弃重试
    if (getAudioFileName() !== currentFile) {
      console.log("[播放器] 重试期间已切歌，放弃");
      retryMap.delete(song.id);
      return;
    }

    const newUrl = data.data?.[0]?.url?.replace(/^http:\/\//, "https://");

    if (!newUrl) {
      console.error("重试失败，无新 URL:", song.name);
      retryMap.delete(song.id);
      return;
    }

    console.log(`[播放器] 新 URL 已获取，重新播放: ${song.name}`);

    // 更新列表 + APlayer 内部
    playList.value[index].url = newUrl;
    if (ap.list?.audios?.[index]) {
      ap.list.audios[index].url = newUrl;
    }

    // 强制重新加载
    audio.src = newUrl;
    audio.load();
    await audio.play().catch(() => {});

    // 10 秒后清标记，允许将来再次重试
    setTimeout(() => retryMap.delete(song.id), 10000);
  } catch (e) {
    console.error("刷新 URL 失败:", e);
    retryMap.delete(song.id);
  }
};

// 媒体会话位置状态（部分浏览器支持）
const updatePositionState = () => {
  if (!("mediaSession" in navigator)) return;
  const status = player.value?.audioStatus;
  if (!status || !status.duration || status.duration <= 0) return;
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

// 逐字开关变化时，立即刷新显示
watch(
  () => store.playerYrcEnabled,
  (enabled) => {
    if (enabled) {
      const audio = player.value?.audioRef;
      if (audio && store.playerYrcLines.length) {
        updateYrcCurrent(audio);
      }
    } else {
      // 关闭：清空逐字状态 + 立即回退到逐行
      store.playerYrcCurrent = null;
      updateLrc();
    }
  },
);

// 翻译开关只影响逐字歌词，逐行始终显示翻译
watch(
  () => store.playerTrLrc,
  () => {
    if (!store.playerYrcEnabled) return;
    const audio = player.value?.audioRef;
    if (audio && store.playerYrcLines.length) updateYrcCurrent(audio);
  },
);

// 切换歌单：立即加载
watch(() => store.playerSwitchId, loadPlaylist);

// 自定义歌单 ID 变化时：防抖加载
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
  if (lrcRafId) cancelAnimationFrame(lrcRafId);
  if (customSongTimer) clearTimeout(customSongTimer);
  currentLrcLines = [];
  currentYrcTransLines = [];
  lrcRequestToken++;
  playlistToken++;
});
</script>

<style lang="scss" scoped>
.aplayer {
  width: 90%;
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
      height: 45px;
      margin-left: 0;
      border-color: transparent !important;
      background: var(--main-cards-header-bg-color);

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
