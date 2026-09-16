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
        <!-- 以下信息请不要修改哦 -->
        <span class="hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">{{ config.author }}</a>
        </span>
        <!-- 站点备案 -->
        <span>
          &amp;
          <a v-if="siteIcp" href="https://icp.gov.moe/?keyword=20246633" target="_blank">
            {{ siteIcp }}
          </a>
        </span>
        <!-- 查看帮助 -->
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
          <div v-if="store.playerYrcCurrent" :key="store.playerYrcCurrent.lineIdx" class="lrc-all">
            <WavesLeft theme="filled" size="18" fill="#efefef" />
            <span class="dwrc-box">
              <!-- 底层：通过 width 展开的填充字 -->
              <span class="dwrc-2 lrc-text text-hidden" id="dwrc-2-wrap">
                <span
                  v-for="(word, i) in store.playerYrcCurrent.words"
                  :key="`o-${i}`"
                  :class="/[\u4e00-\u9fa5]/.test(word.text) ? 'dwrc-cn' : 'dwrc-en'"
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
            <WavesLeft theme="filled" size="18" fill="#efefef" />
            <span class="lrc-char lrc-text text-hidden" v-html="store.getPlayerLrc" />
            <WavesRight theme="filled" size="18" fill="#efefef" />
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { WavesLeft, WavesRight, Cat } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";
import ProgressBar from "@/components/ProgressBar.vue";
import { SpeechLocal } from "@/utils/speech";
import { toggleHelp } from "@/utils/help";

const store = mainStore();

/* ==================== 静态配置 ==================== */

const fullYear = new Date().getFullYear();

// 环境变量集中读取（只读一次）
const SITE_CONFIG = {
  start: import.meta.env.VITE_SITE_START,
  icp: import.meta.env.VITE_SITE_ICP,
  author: import.meta.env.VITE_SITE_AUTHOR,
  url: import.meta.env.VITE_SITE_URL,
};

const startYear = SITE_CONFIG.start?.length >= 4 ? SITE_CONFIG.start.substring(0, 4) : null;
const siteIcp = SITE_CONFIG.icp;
const siteAuthor = SITE_CONFIG.author;

// 站点 URL 规范化：缺省用默认值，无协议时补 //
const siteUrl = computed(() => {
  const url = SITE_CONFIG.url;
  if (!url) return "https://www.xukaiyyds.cn";
  return /^https?:\/\//i.test(url) ? url : `//${url}`;
});

/* ==================== 本地状态 ==================== */

const isFooterHover = ref(false);
const isAltPressed = ref(false);

// 双击进度图标计数（用于触发"戳戳"音效）
let forceIconClickCount = 0;

/* ==================== 计算属性 ==================== */

// 播放中且开启底栏歌词时显示歌词，否则显示版权
const showCopyright = computed(() => !store.playerState || !store.playerLrcShow);

/* ==================== 事件处理 ==================== */

// 双击进度图标：切换"进度图标常驻"
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
    // 连续点击超过 3 次时触发"戳戳"提示
    forceIconClickCount += 1;
    if (forceIconClickCount > 3) {
      SpeechLocal("戳戳.mp3");
      setTimeout(() => (forceIconClickCount = 0), 10000);
    }
  }
};

// Alt 键按下状态（用于显示快捷键提示）
const handleAltKey = (event) => {
  if (event.key !== "Alt") return;
  isAltPressed.value = event.type === "keydown";
  event.preventDefault();
};

/* ==================== 逐字歌词动画 ==================== */

const animatedChars = new Set();

watch(
  () => store.playerYrcCurrent?.lineIdx,
  async (newIdx) => {
    if (newIdx === undefined || newIdx === null) return;

    animatedChars.clear();

    await nextTick();
    await new Promise((r) => requestAnimationFrame(r));

    const box = document.querySelector(".dwrc-box");
    if (!box) return;

    const outputDom = box.querySelectorAll("#dwrc-2-wrap span");
    const inputDom = box.querySelectorAll("#dwrc-1-wrap span");
    if (!outputDom.length || !inputDom.length) return;

    const line = store.playerYrcCurrent;
    const audio = store.audioRef || document.querySelector("audio");
    if (!audio || !line) return;

    const nowMs = audio.currentTime * 1000;

    line.words.forEach((word, i) => {
      const inputItem = inputDom[i];
      const outputItem = outputDom[i];
      if (!inputItem || !outputItem) return;

      const width = inputItem.getBoundingClientRect().width;
      if (width === 0) return;

      const wordEnd = word.start + word.duration;

      // 已唱完 → 直接铺满
      if (wordEnd <= nowMs) {
        outputItem.style.width = `${width}px`;
        animatedChars.add(i);
        return;
      }

      // 正在唱 → 从中途接上
      if (word.start <= nowMs && !animatedChars.has(i)) {
        const elapsed = nowMs - word.start;
        const remaining = word.duration - elapsed;
        const startWidth = (elapsed / word.duration) * width;
        outputItem.style.width = `${startWidth}px`;
        outputItem.style.transform = "translateY(-1px)";

        const anim = outputItem.animate([{ width: `${startWidth}px` }, { width: `${width}px` }], {
          duration: remaining,
          fill: "forwards",
          easing: "linear",
        });
        anim.onfinish = () => {
          outputItem.style.transform = "translateY(1px)";
          outputItem.animate(
            [{ transform: "translateY(-1px)" }, { transform: "translateY(1px)" }],
            { duration: 300, fill: "forwards", easing: "linear" },
          );
        };
        animatedChars.add(i);
        return;
      }

      // 还没唱 → delay 后展开
      if (word.start > nowMs && !animatedChars.has(i)) {
        outputItem.style.width = "0px";
        outputItem.style.transform = "translateY(-1px)";

        const anim = outputItem.animate([{ width: "0px" }, { width: `${width}px` }], {
          delay: word.start - nowMs,
          duration: Math.max(80, word.duration),
          fill: "forwards",
          easing: "linear",
        });
        anim.onfinish = () => {
          outputItem.style.transform = "translateY(1px)";
          outputItem.animate(
            [{ transform: "translateY(-1px)" }, { transform: "translateY(1px)" }],
            { duration: 300, fill: "forwards", easing: "linear" },
          );
        };
        animatedChars.add(i);
      }
    });
  },
  { flush: "post" },
);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  document.addEventListener("keydown", handleAltKey);
  document.addEventListener("keyup", handleAltKey);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleAltKey);
  document.removeEventListener("keyup", handleAltKey);
});
</script>

<style lang="scss" scoped>
/* ==================== 逐字字块 ==================== */
.dwrc-char {
  display: inline-block;
  white-space: pre;
  opacity: 1;
  transform: translateY(1px);
  background-clip: text;
  -webkit-background-clip: text;
  font-weight: 520;
  font-size: 1.05rem;
  transition:
    color 0.5s linear,
    transform 0.3s linear;

  &.fade-in-start {
    text-shadow: 0 0 2px rgba(176, 224, 230, 0.9);
    opacity: 0.6;
    transform: translateY(1px);
  }

  &.fade-in {
    opacity: 1;
    transform: translateY(-1px);
    animation: colorFade 0.7s ease-in-out forwards;
  }

  &.fade-out {
    opacity: 1 !important;
    transform: translateY(-1px);
    text-shadow:
      0 0 6px rgba(176, 224, 230, 0.9),
      0 0 2px rgba(176, 224, 230, 1),
      0 0 2px rgba(230, 230, 250, 1);
  }

  &.long-tone {
    opacity: 1;
    transform: translateY(-1px);
    animation: pulse 1.2s ease-in-out forwards !important;
  }

  &.long-tone-out {
    opacity: 1 !important;
    transform: translateY(1px);
    animation: pulse-out 0.7s ease-in-out forwards !important;
  }

  &.dwrc-style-s1 {
    opacity: 0.6;
    color: rgba(220, 220, 220, 0.7);
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
      0 0 6px rgba(176, 224, 230, 0.9),
      0 0 2px rgba(176, 224, 230, 1),
      0 0 2px rgba(230, 230, 250, 1);
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

/* 底层填充字 */
#dwrc-2-wrap > span {
  display: inline-block;
  transform: translateY(1px);
  white-space: pre;
  overflow: hidden;
  width: 0;
  opacity: 0.8;
  transition:
    opacity 0.3s linear,
    color 0.5s linear,
    transform 0.3s linear,
    width 0.3s linear;
}

#dwrc-2-wrap {
  display: inline-block;
  position: absolute;
  width: auto;
  opacity: 0.8;
  color: rgba(255, 240, 245, 0.9);
  text-shadow:
    0 0 6px rgba(0, 191, 255, 0.8),
    0 0 2px rgba(176, 224, 230, 0.8),
    0 0 2px rgba(230, 230, 250, 0.8);
  font-weight: 520;
  font-size: 1.05rem;
  overflow: hidden;
  white-space: nowrap;
}

/* 逐行字块 */
.lrc-char {
  display: inline;
  opacity: 1;
  background-clip: text;
  -webkit-background-clip: text;
  color: rgba(255, 240, 245, 1);
  text-shadow:
    0 0 6px rgba(255, 240, 245, 0.9),
    0 0 2px rgba(255, 165, 0, 1),
    0 0 2px rgba(255, 179, 71, 1);
  font-weight: 520;
  font-size: 1.05rem;
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
