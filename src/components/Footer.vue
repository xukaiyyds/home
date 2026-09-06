<template>
  <footer
    id="footer"
    :class="store.footerBlur ? 'blur' : null"
    @mouseenter="isFooterHover = true"
    @mouseleave="isFooterHover = false"
  >
    <Transition name="fade" mode="out-in">
      <div v-if="!store.playerState || !store.playerLrcShow" class="power">
        <span>
          <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="startYear < fullYear" class="site-start">
            {{ startYear }}
            -
          </span>
          {{ fullYear }}
          <a :href="siteUrl">{{ siteAuthor }}</a>
        </span>
        <!-- 以下信息请不要修改哦 -->
        <span class="hidden">
          &amp;&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">
            {{ config.author }}
          </a>
        </span>
        <!-- 站点备案 -->
        <span>
          &amp;
          <a v-if="siteIcp" href="https://icp.gov.moe/?keyword=20246633" target="_blank">
            {{ siteIcp }}
          </a>
        </span>
        <!-- 查看帮助 -->
        <span class="hidden">
          &amp;
          <a @click="toggleHelp" style="position: relative">
            查看快捷键
            <span v-show="isAltPressed" class="alt-hint-overlay">
              <span class="alt-hint-text">Alt A</span>
            </span>
          </a>
        </span>
      </div>
      <div v-else class="lrc" @dblclick="toggleForceIcon">
        <ProgressBar :footerHover="isFooterHover" />
        <Transition name="fade" mode="out-in">
          <div class="lrc-all" :key="store.getPlayerLrc">
            <music-one theme="filled" size="18" fill="#efefef" />
            <span class="lrc-text text-hidden" v-html="store.getPlayerLrc" />
            <music-one theme="filled" size="18" fill="#efefef" />
          </div>
        </Transition>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { MusicOne } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";
import ProgressBar from "@/components/ProgressBar.vue";
import { SpeechLocal } from "@/utils/speech";
import { toggleHelp } from "@/utils/help";

const store = mainStore();
const fullYear = new Date().getFullYear();
const isFooterHover = ref(false);
let chuover = 0;

// 加载配置数据
const startYear = ref(
  import.meta.env.VITE_SITE_START?.length >= 4
    ? import.meta.env.VITE_SITE_START.substring(0, 4)
    : null,
);
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://www.xukaiyyds.cn";
  // 判断协议前缀
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  }
  return url;
});

const toggleForceIcon = () => {
  store.forceShowIcon = !store.forceShowIcon;
  if (store.messageShow) {
    ElMessage({
      dangerouslyUseHTMLString: true,
      message: `${store.forceShowIcon ? "已启用" : "已禁用"}进度图标常驻`,
    });
  }
  if (store.webSpeech) {
    if (store.forceShowIcon) {
      SpeechLocal("启用进度图标常驻.mp3");
    } else {
      SpeechLocal("禁用进度图标常驻.mp3");
    }
    chuover += 1;
    if (chuover > 3) {
      SpeechLocal("戳戳.mp3");
      setTimeout(() => {
        chuover = 0;
      }, 10000);
    }
  }
};

const isAltPressed = ref(false);

// Alt 键按下/释放事件
const handleAltKey = (event) => {
  event.preventDefault();
  if (event.key === "Alt") {
    isAltPressed.value = event.type === "keydown";
  }
};

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
  // 文字不换行
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
    justify-content: center;

    .lrc-all {
      width: 98%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;

      .lrc-text {
        margin: 0 8px;
      }

      .i-icon {
        width: 18px;
        height: 18px;
        display: inherit;
      }
    }
  }

  .alt-hint-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 10;
    animation: fadeIn 0.15s ease;
  }

  .alt-hint-text {
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 2px;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
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
    transition: opacity 0.15s ease-in-out;
  }

  @media (max-width: 720px) {
    font-size: 0.9rem;

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
