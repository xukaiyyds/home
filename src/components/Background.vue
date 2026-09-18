<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="store.bgUrl"
      class="bg"
      :style="{ '--blur': store.backgroundBlur + 'px' }"
      alt="cover"
      @load="imgLoadComplete"
      @error="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div v-if="store.showBackgroundGray" :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a
        v-if="store.backgroundShow && [1, 2, 3].includes(store.coverType)"
        class="down"
        :href="store.bgUrl"
        target="_blank"
      >
        下载壁纸
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
import initUniverse from "@/utils/dark";
import initFirefly from "@/utils/firefly";
import initSnowfall from "@/utils/snow";
import initBubble from "@/utils/bubbles";
import initSakura from "@/utils/sakura";
import { SpeechLocal } from "@/utils/speech";

const store = mainStore();
const emit = defineEmits(["loadComplete"]);

/* ==================== 静态配置 ==================== */

// 壁纸随机数（组件生命周期内固定）
// 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字
const bgRandom = Math.floor(Math.random() * 6 + 1);
const bgRandoms = Math.floor(Math.random() * 12 + 1)
  .toString()
  .padStart(2, "0");

// 粒子特效映射表（key → { 存储字段, 初始化函数 }）
const PARTICLE_MAP = {
  star: { key: "universe", init: initUniverse },
  snow: { key: "snowfall", init: initSnowfall },
  firefly: { key: "firefly", init: initFirefly },
  bubble: { key: "bubble", init: initBubble },
  sakura: { key: "sakura", init: initSakura },
};

/* ==================== 本地状态 ==================== */

const isMobile = ref(window.innerWidth < 721);
const imgTimeout = ref(null);

// 特效清理函数容器（普通对象即可，无需响应式）
const cleanupFns = {
  universe: null,
  firefly: null,
  snowfall: null,
  bubble: null,
  sakura: null,
};

/* ==================== 壁纸逻辑 ==================== */

// 获取当前主题对应的默认壁纸路径
const getDefaultBg = () => {
  if (isMobile.value) return "/images/photo/bg1.png";
  const theme = store.themeType === "dark" ? "dark" : "light";
  return `/images/${theme}/bg${bgRandom}.png`;
};

// 非默认壁纸的 URL 生成器（查表替代 if-else）
const BG_URL_BUILDERS = {
  1: () => `https://plog.xukaiyyds.cn/img/wallpaper/淡雅/${bgRandoms}.jpg`,
  2: () => `https://plog.xukaiyyds.cn/img/wallpaper/星空/${bgRandoms}.jpg`,
  3: () => "https://api.xinyew.cn/api/bing",
  4: () => "https://tu.ltyuanfang.cn/api/fengjing.php",
  5: () => "https://t.alcy.cc/ycy",
  6: () => store.backgroundCustom,
};

const changeBg = (type) => {
  if (type === 0) {
    store.bgUrl = getDefaultBg();
    return;
  }
  const builder = BG_URL_BUILDERS[type];
  if (builder) store.bgUrl = builder();
};

/* ==================== 图片事件 ==================== */

const imgLoadComplete = () => {
  const delay = Math.floor(Math.random() * 301) + 300;
  imgTimeout.value = setTimeout(() => store.setImgLoadStatus(true), delay);
};

const imgAnimationEnd = () => emit("loadComplete");

const imgLoadError = () => {
  console.error("壁纸加载失败：", store.bgUrl);
  ElMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(Error, { theme: "filled", fill: "#efefef" }),
  });
  store.bgUrl = getDefaultBg();
  if (store.webSpeech) {
    setTimeout(() => SpeechLocal("壁纸加载失败.mp3"), 2000);
  }
};

/* ==================== 粒子特效管理 ==================== */

const stopAllEffects = () => {
  Object.keys(cleanupFns).forEach((key) => {
    cleanupFns[key]?.();
    cleanupFns[key] = null;
  });
};

const applyParticle = (type) => {
  stopAllEffects();
  const config = PARTICLE_MAP[type];
  if (config) cleanupFns[config.key] = config.init();
};

// 合并监听 showParticle 和 currentParticle，避免重复触发
watch(
  [() => store.showParticle, () => store.currentParticle],
  ([show, particle]) => {
    if (show) applyParticle(particle);
    else stopAllEffects();
  },
  { immediate: true },
);

/* ==================== 主题切换 ==================== */

const changeThemeType = (val) => {
  document.querySelector("html")?.setAttribute("theme", val === "dark" ? "dark" : "light");
};

watch(
  () => store.themeType,
  (val) => {
    changeThemeType(val);
    // 默认壁纸模式下，跟随主题切换壁纸
    if (store.coverType === 0) {
      changeBg(0);
    }
  },
);

/* ==================== 壁纸监听 ==================== */

watch(() => store.coverType, changeBg);

watch(
  () => store.backgroundShow,
  (show) => {
    if (show) {
      store.savedBackgroundBlur = store.backgroundBlur;
      store.backgroundBlur = 0;
    } else {
      store.backgroundBlur = store.savedBackgroundBlur;
    }
  },
);

/* ==================== 窗口尺寸响应 ==================== */

const handleResize = () => {
  const mobile = window.innerWidth < 721;
  if (mobile !== isMobile.value) {
    isMobile.value = mobile;
    // 默认壁纸模式下，跨过 721px 阈值时切换壁纸源
    if (store.coverType === 0) changeBg(0);
  }
};

/* ==================== 生命周期 ==================== */

onMounted(() => {
  changeBg(store.coverType);
  changeThemeType(store.themeType);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  stopAllEffects();
  if (store.backgroundShow) store.backgroundBlur = store.savedBackgroundBlur;
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    top: calc(var(--blur) * -1);
    left: calc(var(--blur) * -1);
    width: calc(100% + var(--blur) * 2);
    height: calc(100% + var(--blur) * 2);
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(var(--blur)) brightness(0.3);
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }

  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);

    transition: 1.5s;

    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }

  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: var(--main-cards-bg-color);
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      text-decoration: none;
      transform: scale(1.05);
      background-color: var(--main-button-hover-bg-color);
    }

    &:active {
      transform: scale(1);
    }
  }
}
</style>
