<template>
  <footer
    id="footer"
    :class="store.footerBlur ? 'blur' : null"
    @mouseenter="isFooterHover = true"
    @mouseleave="isFooterHover = false"
  >
    <Transition name="fade" mode="out-in">
      <!-- 版权信息 -->
      <div v-if="showCopyright" class="power">
        <span>
          <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="startYear < fullYear" class="site-start">{{ startYear }} -</span>
          {{ fullYear }}
          <a :href="siteUrl">{{ siteAuthor }}</a>
        </span>
        <span class="hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">{{ config.author }}</a>
        </span>
        <span>
          &amp;
          <a v-if="siteIcp" href="https://icp.gov.moe/?keyword=20246633" target="_blank">
            {{ siteIcp }}
          </a>
        </span>
        <span class="hidden-key">
          &amp;
          <a @click="toggleHelp" style="position: relative; padding: 1px">
            查看快捷键
            <span v-show="isAltPressed" class="alt-hint-overlay">
              <span class="alt-hint-text">Alt A</span>
            </span>
          </a>
        </span>
      </div>

      <!-- 歌词 -->
      <div v-else class="lrc" @dblclick="toggleForceIcon">
        <ProgressBar :footerHover="isFooterHover" />
        <Transition name="fade" mode="out-in">
          <!-- 逐字模式 -->
          <div
            v-if="store.playerYrcEnabled && store.playerYrcCurrent"
            :key="store.playerYrcCurrent.lineIdx"
            class="lrc-all"
          >
            <WavesLeft theme="filled" size="18" fill="#efefef" />
            <span class="dwrc-box">
              <!-- 底层：通过 clip-path 展开的填充字 -->
              <span class="dwrc-2 lrc-text text-hidden" id="dwrc-2-wrap">
                <span
                  v-for="(word, i) in store.playerYrcCurrent.words"
                  :key="`o-${i}`"
                  class="dwrc-2-char"
                  :class="[
                    i === store.playerYrcCurrent.wordIdx ? 'fade-in' : 'fade-in-start',
                    i < store.playerYrcCurrent.wordIdx ? 'fade-out' : '',
                    i === store.playerYrcCurrent.wordIdx && word.duration > 1019 ? 'long-tone' : '',
                    i < store.playerYrcCurrent.wordIdx && word.duration > 1019
                      ? 'long-tone-out'
                      : '',
                    /[\u4e00-\u9fa5]/.test(word.text) ? 'dwrc-cn' : 'dwrc-en',
                  ]"
                  v-html="word.text"
                />
              </span>
              <!-- 顶层：带状态类的字 -->
              <span class="dwrc-1 lrc-text text-hidden" id="dwrc-1-wrap">
                <span
                  v-for="(word, i) in store.playerYrcCurrent.words"
                  :key="`c-${i}`"
                  class="dwrc-char"
                  :class="[
                    i === store.playerYrcCurrent.wordIdx ? 'fade-in' : 'fade-in-start',
                    i < store.playerYrcCurrent.wordIdx ? 'fade-out' : '',
                    i === store.playerYrcCurrent.wordIdx && word.duration > 1019 ? 'long-tone' : '',
                    i < store.playerYrcCurrent.wordIdx && word.duration > 1019
                      ? 'long-tone-out'
                      : '',
                    i < store.playerYrcCurrent.wordIdx ? 'dwrc-style-s2' : 'dwrc-style-s1',
                    /[\u4e00-\u9fa5]/.test(word.text) ? 'dwrc-cn' : 'dwrc-en',
                  ]"
                  :id="`lrc-char-${store.playerYrcCurrent.lineIdx}-${i}`"
                  v-html="word.text"
                />
              </span>
              <!-- 翻译：紧随逐字之后 -->
              <span
                v-if="store.playerTrLrc && store.playerYrcCurrent.translation"
                class="yrc-translation"
                >（{{ store.playerYrcCurrent.translation }}）</span
              >
            </span>
            <WavesRight theme="filled" size="18" fill="#efefef" />
          </div>

          <!-- 逐行模式（fallback） -->
          <div v-else :key="store.getPlayerLrc" class="lrc-all">
            <MusicOne v-show="!store.playerYrcEnabled" theme="filled" size="18" fill="#efefef" />
            <WavesLeft v-show="store.playerYrcEnabled" theme="filled" size="18" fill="#efefef" />
            <span
              class="lrc-text text-hidden"
              :class="{ 'lrc-char': store.playerYrcEnabled }"
              v-html="store.getPlayerLrc"
            />
            <WavesRight v-show="store.playerYrcEnabled" theme="filled" size="18" fill="#efefef" />
            <MusicOne v-show="!store.playerYrcEnabled" theme="filled" size="18" fill="#efefef" />
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { MusicOne, WavesLeft, WavesRight, Cat } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";
import ProgressBar from "@/components/ProgressBar.vue";
import { SpeechLocal } from "@/utils/speech";
import { toggleHelp } from "@/utils/help";

const store = mainStore();

/* ==================== 静态配置 ==================== */

const fullYear = new Date().getFullYear();

const SITE_CONFIG = {
  start: import.meta.env.VITE_SITE_START,
  icp: import.meta.env.VITE_SITE_ICP,
  author: import.meta.env.VITE_SITE_AUTHOR,
  url: import.meta.env.VITE_SITE_URL,
};

const startYear = SITE_CONFIG.start?.length >= 4 ? SITE_CONFIG.start.substring(0, 4) : null;
const siteIcp = SITE_CONFIG.icp;
const siteAuthor = SITE_CONFIG.author;

const siteUrl = computed(() => {
  const url = SITE_CONFIG.url;
  if (!url) return "https://www.xukaiyyds.cn";
  return /^https?:\/\//i.test(url) ? url : `//${url}`;
});

/* ==================== 本地状态 ==================== */

const isFooterHover = ref(false);
const isAltPressed = ref(false);

let forceIconClickCount = 0;

/* ==================== 计算属性 ==================== */

const showCopyright = computed(() => !store.playerState || !store.playerLrcShow);

/* ==================== 事件处理 ==================== */

const toggleForceIcon = () => {
  store.forceShowIcon = !store.forceShowIcon;
  if (store.messageShow) {
    ElMessage({
      duration: 2000,
      message: `${store.forceShowIcon ? "已启用" : "已禁用"}进度图标常驻`,
      icon: h(Cat, { theme: "filled", fill: "#efefef" }),
    });
  }
  if (store.webSpeech) {
    SpeechLocal(store.forceShowIcon ? "启用进度图标常驻.mp3" : "禁用进度图标常驻.mp3");
    forceIconClickCount += 1;
    if (forceIconClickCount > 3) {
      SpeechLocal("戳戳.mp3");
      setTimeout(() => (forceIconClickCount = 0), 10000);
    }
  }
};

const handleAltKey = (event) => {
  if (event.key !== "Alt") return;
  isAltPressed.value = event.type === "keydown";
  event.preventDefault();
};

/* ==================== 逐字 clip-path 动画 ==================== */

let clipRAFId = null;

const clipLoop = () => {
  const line = store.playerYrcCurrent;

  if (store.playerYrcEnabled && line?.words?.length) {
    const box = document.querySelector(".dwrc-box");
    if (box) {
      const outputDom = box.querySelectorAll("#dwrc-2-wrap > span");
      if (outputDom.length === line.words.length) {
        const audio = store.audioRef || document.querySelector("audio");
        const nowMs = audio ? audio.currentTime * 1000 : 0;

        line.words.forEach((word, i) => {
          const el = outputDom[i];
          if (!el) return;

          const start = word.start;
          const duration = word.duration;
          const end = start + duration;

          if (duration === 0) {
            el.style.clipPath = "inset(0 100% 0 0)";
          } else if (nowMs >= end) {
            el.style.clipPath = "inset(0 0% 0 0)";
          } else if (nowMs >= start) {
            const progress = (nowMs - start) / duration;
            const clipRight = Math.max(0, Math.min(100, (1 - progress) * 100));
            el.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
          } else {
            el.style.clipPath = "inset(0 100% 0 0)";
          }
        });
      }
    }
  }

  clipRAFId = requestAnimationFrame(clipLoop);
};

const startClipLoop = () => {
  if (clipRAFId !== null) return;
  clipRAFId = requestAnimationFrame(clipLoop);
};

const stopClipLoop = () => {
  if (clipRAFId !== null) {
    cancelAnimationFrame(clipRAFId);
    clipRAFId = null;
  }
};

watch(
  () => store.playerYrcEnabled,
  (enabled) => {
    if (enabled) startClipLoop();
    else stopClipLoop();
  },
);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  document.addEventListener("keydown", handleAltKey);
  document.addEventListener("keyup", handleAltKey);
  if (store.playerYrcEnabled) startClipLoop();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleAltKey);
  document.removeEventListener("keyup", handleAltKey);
  stopClipLoop();
});
</script>

<style lang="scss" scoped>
/* ==================== 逐字字块（顶层） ==================== */
.dwrc-char {
  display: inline-block;
  white-space: pre;
  opacity: 1;
  -webkit-transform: translateY(1px);
  transform: translateY(1px);
  -webkit-background-clip: text;
  background-clip: text;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    color 0.5s linear,
    transform 0.3s linear;

  &.fade-in-start {
    text-shadow: 0 0 2px rgba(255, 240, 245, 0.9);
    opacity: 0.6;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-in {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: colorFade 0.7s ease-in-out forwards;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-out {
    opacity: 1 !important;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    text-shadow:
      0 0 6px rgba(255, 240, 245, 0.9),
      0 0 2px rgba(176, 224, 230, 1),
      0 0 2px rgba(230, 230, 250, 1);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.fade-enter-active {
    animation: float-up 0.3s linear forwards;
  }

  &.long-tone {
    opacity: 1;
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
    animation: pulse 1.2s ease-in-out forwards !important;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.long-tone-out {
    opacity: 1 !important;
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
    animation: pulse-out 0.7s ease-in-out forwards !important;
    animation-iteration-count: 1;
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.dwrc-style-s1 {
    opacity: 0.6;
    color: rgba(220, 220, 220, 0.7);
    transition:
      color 0.5s linear,
      opacity 0.3s linear,
      transform 0.3s linear;
  }

  &.dwrc-style-s2 {
    opacity: 1;
    color: rgba(255, 240, 245, 1);
    text-shadow:
      0 0 6px rgba(176, 224, 230, 0.9),
      0 0 2px rgba(176, 224, 230, 1),
      0 0 2px rgba(230, 230, 250, 1);
  }
}

@keyframes colorFade {
  from {
    color: rgba(220, 220, 220, 0.7);
    opacity: 0.6;
    text-shadow:
      0 0 3px rgba(176, 224, 230, 0.6),
      0 0 0 rgba(176, 224, 230, 1);
  }
  to {
    color: rgba(255, 240, 245, 1);
    opacity: 1;
    text-shadow:
      0 0 6px rgba(0, 191, 255, 0.8),
      0 0 2px rgba(176, 224, 230, 0.8),
      0 0 2px rgba(230, 230, 250, 0.8);
  }
}

@keyframes float-up {
  from {
    -webkit-transform: translateY(1px);
    transform: translateY(1px);
  }
  to {
    -webkit-transform: translateY(-1px);
    transform: translateY(-1px);
  }
}

@keyframes pulse {
  from {
    color: rgba(220, 220, 220, 0.7);
    opacity: 0.6;
    text-shadow:
      0px 0px 3px rgba(255, 240, 245, 0.9),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1);
  }
  to {
    color: rgba(255, 240, 245, 1);
    opacity: 1;
    text-shadow:
      3px 3px 7px rgba(255, 240, 245, 0.9),
      0px 0px 4px rgba(255, 182, 193, 0.3),
      0px 0px 4px rgba(255, 192, 203, 0.3),
      0px 0px 8px rgba(255, 182, 193, 0.3),
      0px 0px 8px rgba(255, 192, 203, 0.3),
      0px 0px 12px rgba(255, 182, 193, 1),
      0px 0px 12px rgba(255, 192, 203, 1),
      0px 0px 16px rgba(255, 182, 193, 1),
      0px 0px 16px rgba(255, 192, 203, 1);
  }
}

@keyframes pulse-out {
  from {
    color: rgba(255, 240, 245, 1);
    opacity: 1;
    text-shadow:
      3px 3px 7px rgba(255, 240, 245, 0.9),
      0px 0px 4px rgba(255, 182, 193, 0.3),
      0px 0px 4px rgba(255, 192, 203, 0.3),
      0px 0px 8px rgba(255, 182, 193, 0.3),
      0px 0px 8px rgba(255, 192, 203, 0.3),
      0px 0px 12px rgba(255, 182, 193, 1),
      0px 0px 12px rgba(255, 192, 203, 1),
      0px 0px 16px rgba(255, 182, 193, 1),
      0px 0px 16px rgba(255, 192, 203, 1);
  }
  to {
    color: rgba(220, 220, 220, 0.7);
    opacity: 1;
    text-shadow:
      0px 0px 3px rgba(255, 240, 245, 0.9),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 0.3),
      0px 0px 0px rgba(255, 192, 203, 0.3),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1),
      0px 0px 0px rgba(255, 182, 193, 1),
      0px 0px 0px rgba(255, 192, 203, 1);
  }
}

/* ==================== 逐字字块（底层，clip-path） ==================== */
.dwrc-2-char {
  display: inline-block;
  transform: translateY(1px);
  white-space: pre;
  font-size: 1.05rem;
  font-weight: 520;
  clip-path: inset(0 100% 0 0);
  will-change: clip-path;
  opacity: 0.8;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear;
  &.fade-in-start {
    transform: translateY(1px);
  }
  &.fade-in {
    transform: translateY(-1px);
  }
  &.fade-out {
    transform: translateY(-1px);
  }
  &.long-tone {
    transform: translateY(-1px);
  }
  &.long-tone-out {
    transform: translateY(1px);
  }
}

#dwrc-2-wrap {
  display: inline-block;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.8;
  color: rgba(255, 240, 245, 0.9);
  text-shadow:
    0 0 6px rgba(0, 191, 255, 0.8),
    0px 0px 2px rgba(176, 224, 230, 0.8),
    0px 0px 2px rgba(230, 230, 250, 0.8);
  font-weight: 520;
  font-size: 1.05rem;
  white-space: nowrap;
}

/* 逐行字块 */
.lrc-char {
  opacity: 1;
  background-clip: text;
  -webkit-background-clip: text;
  color: rgba(255, 240, 245, 1);
  text-shadow:
    0 0 6px rgba(255, 240, 245, 0.9),
    0 0 2px rgba(255, 165, 0, 1),
    0 0 2px rgba(255, 179, 71, 1);
  font-weight: 520;
  transition:
    opacity 0.3s linear,
    color 0.5s linear;
}

/* ==================== 页脚 ==================== */
#footer {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 14px;
  word-break: keep-all;
  white-space: nowrap;

  .power {
    animation: fade 0.3s;
  }

  .lrc {
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    z-index: 1;
    height: 46px;
    overflow: hidden;

    .lrc-all {
      width: 98%;
      height: 46px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;

      .lrc-text {
        margin: 0 8px;
      }

      .i-icon {
        width: 18px;
        height: 18px;
        display: inherit;
      }

      .dwrc-box {
        position: relative;
        display: inline-block;
        white-space: nowrap;
        width: auto;
        height: auto;
        z-index: 0;
        vertical-align: middle;

        .dwrc-cn {
          letter-spacing: 2px;
        }

        .dwrc-en {
          letter-spacing: 0;
        }

        .dwrc-1,
        .dwrc-2 {
          white-space: nowrap;
        }

        .dwrc-1 {
          position: relative;
          z-index: 1;
        }

        .dwrc-2 {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1000;
        }

        .yrc-translation {
          opacity: 0.6;
          font-size: 0.9em;
        }
      }
    }
  }

  .alt-hint-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--main-bg-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    animation: fadeIn 0.15s ease;
  }

  .alt-hint-text {
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 2px;
    text-shadow: var(--main-big-text-shadow);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.blur {
    backdrop-filter: blur(10px);
    background: var(--main-footer-bg-color);
    font-size: 16px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s linear;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  @media (max-width: 720px) {
    font-size: 0.9rem;

    .hidden-key {
      display: none;
    }

    &.blur {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
