<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 悬浮音乐 -->
  <FloatingMusic v-if="store.useFloatingPlayer" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <div class="container" v-show="!store.backgroundShow">
        <section class="all" v-show="!store.setOpenState">
          <MainLeft />
          <MainRight v-show="!store.boxOpenState" />
          <Box v-show="store.boxOpenState" />
        </section>
        <section
          class="more more-set"
          :style="{ zIndex: settingsZIndex }"
          v-show="store.setOpenState"
          @click="store.setOpenState = false"
        >
          <MoreSet />
        </section>
        <section
          class="more more-search"
          :style="{ zIndex: searchZIndex }"
          v-show="store.searchOpenState"
          @click="store.searchOpenState = false"
        >
          <SearchInp />
        </section>
      </div>

      <!-- 移动端菜单按钮 -->
      <Icon
        class="menu"
        size="24"
        v-show="!store.backgroundShow"
        @click="store.mobileOpenState = !store.mobileOpenState"
      >
        <component :is="store.mobileOpenState ? CloseSmall : HamburgerButton" />
      </Icon>

      <!-- 页脚 -->
      <Transition name="fade" mode="out-in">
        <Footer class="f-ter" v-show="!store.backgroundShow && !store.setOpenState" />
      </Transition>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, speechHelloInit, checkDays } from "@/utils/getTime.js";
import {
  HamburgerButton,
  CloseSmall,
  Setting,
  Search,
  HourglassFull,
  HourglassNull,
  Brightness,
  PreviewOpen,
  PreviewClose,
} from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import FloatingMusic from "@/components/FloatingMusic.vue";
import Box from "@/views/Box/index.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import SearchInp from "@/views/SearchInp/index.vue";
import cursorInit from "@/utils/cursor.js";
import { SpeechLocal } from "@/utils/speech";
import { toggleHelp } from "@/utils/help";
import * as live2d from "live2d-render";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 移动端宽度阈值
const MOBILE_WIDTH = 721;

// Live2D 模型入口路径映射
const LIVE2D_BASE_PATH = import.meta.env.MODE === "production" ? "" : ".";
const LIVE2D_MODEL_PATHS = {
  Mao: `${LIVE2D_BASE_PATH}/live2d/Mao/Mao.model3.json`,
  Hiyori: `${LIVE2D_BASE_PATH}/live2d/Hiyori/Hiyori.model3.json`,
  Mark: `${LIVE2D_BASE_PATH}/live2d/Mark/Mark.model3.json`,
  Wanko: `${LIVE2D_BASE_PATH}/live2d/Wanko/Wanko.model3.json`,
};
const LIVE2D_DEFAULT_MODEL = "Mao";

// Live2D 显示控制的重试延迟（等待 DOM 渲染完成）
const LIVE2D_DISPLAY_RETRY = [0, 300, 600];

/* ==================== 计算属性 ==================== */

const settingsZIndex = computed(() => store.getZIndex("settings"));
const searchZIndex = computed(() => store.getZIndex("search"));

/* ==================== 页面宽度 ==================== */

const getWidth = () => store.setInnerWidth(window.innerWidth);

// 窄屏时关闭所有浮层
watch(
  () => store.innerWidth,
  (value) => {
    if (value < MOBILE_WIDTH) {
      store.boxOpenState = false;
      store.setOpenState = false;
      store.searchOpenState = false;
    }
  },
);

/* ==================== 页面层级注册 ==================== */

// 通用：注册/注销页面层级 + 打开时语音提示
const registerPage = (key, speechFile) => {
  store.registerPage(key);
  if (store.webSpeech) SpeechLocal(speechFile);
};

watch(
  () => store.setOpenState,
  (val) => {
    if (val) registerPage("settings", "果咩纳塞.mp3");
    else store.unregisterPage("settings");
  },
  { immediate: true },
);

watch(
  () => store.searchOpenState,
  (val) => {
    if (val) registerPage("search", "找东西.mp3");
    else store.unregisterPage("search");
  },
  { immediate: true },
);

/* ==================== 页面加载完成 ==================== */

const loadComplete = () => {
  nextTick(() => {
    helloInit();
    if (store.webSpeech) speechHelloInit();
    checkDays();
  });
};

/* ==================== Live2D ==================== */

// 控制 Live2D 模型和工具箱的显隐
const toggleLive2dDisplay = (show) => {
  const applyDisplay = () => {
    // 模型本体
    const live2dEl = document.getElementById("live2d");
    if (live2dEl) live2dEl.style.display = show ? "" : "none";

    // 工具箱（向上找最近的 fixed 容器）
    const toolItem = document.querySelector(".__live2d-toolbox-item");
    if (!toolItem) return;
    let container = toolItem.parentElement;
    while (container && getComputedStyle(container).position !== "fixed") {
      container = container.parentElement;
    }
    if (container) container.style.display = show ? "" : "none";
  };

  // 立即执行 + 延迟重试（初始化阶段元素可能尚未渲染）
  LIVE2D_DISPLAY_RETRY.forEach((delay) => {
    if (delay === 0) applyDisplay();
    else setTimeout(applyDisplay, delay);
  });
};

watch(() => store.live2dShow, toggleLive2dDisplay, { immediate: true });

// 初始化 Live2D
const initLive2D = async (type) => {
  store.modelPath = LIVE2D_MODEL_PATHS[type] ?? LIVE2D_MODEL_PATHS[LIVE2D_DEFAULT_MODEL];

  await live2d.initializeLive2D({
    ResourcesPath: store.modelPath,
    BackgroundRGBA: [0.0, 0.0, 0.0, 0.0],
    CanvasSize: { height: 250, width: 200 },
    ShowToolBox: true,
    LoadFromCache: true,
  });
  toggleLive2dDisplay(store.live2dShow);
};

/* ==================== 键盘事件处理 ==================== */

// 判断当前焦点是否在输入框内
const isInputFocused = () => {
  const el = document.activeElement;
  return el && (el.tagName === "INPUT" || el.isContentEditable);
};

// 显示操作消息
const showMessage = (message, icon) => {
  if (store.messageShow) {
    ElMessage({ duration: 2000, message, icon: h(icon, { fill: "#efefef" }) });
  }
};

// Tab：切换时光胶囊
const handleGlobalKeydown = (event) => {
  if (event.key !== "Tab" || isInputFocused()) return;
  event.preventDefault();
  store.boxOpenState = !store.boxOpenState;
  showMessage(
    `已${store.boxOpenState ? "打开" : "关闭"}时光胶囊`,
    store.boxOpenState ? HourglassFull : HourglassNull,
  );
};

// Alt + D：切换主题
const handleThemeSwitch = (event) => {
  if (!event.altKey || event.key.toLowerCase() !== "d") return;
  event.preventDefault();
  removeSystemThemeListener();
  store.themeType = store.themeType === "dark" ? "light" : "dark";
  showMessage(`已切换至${store.themeType === "dark" ? "深色" : "浅色"}模式`, Brightness);
};

// Alt + S：切换全网搜索
const handleSearchToggle = (event) => {
  if (!event.altKey || event.key.toLowerCase() !== "s") return;
  event.preventDefault();
  if (!store.prioritizeFirst && store.setOpenState) store.setOpenState = false;
  store.searchOpenState = !store.searchOpenState;
  showMessage(`已${store.searchOpenState ? "打开" : "关闭"}全网搜索`, Search);
};

// 右键：切换全局设置（移动端禁用）
const handleContextMenu = (event) => {
  // 捷径项上的右键放行（交给 ShortCut 组件处理）
  const target = event.target;
  if (
    target.closest?.(".item") ||
    target.closest?.(".shortcut-item-wrapper") ||
    target.closest?.(".shortcut-item")
  ) {
    return true;
  }

  // 移动端禁用右键
  if (store.innerWidth < MOBILE_WIDTH) {
    ElMessage({ message: "为了浏览体验，已禁用右键", grouping: true, duration: 2000 });
    if (store.webSpeech) SpeechLocal("鼠标右键.mp3");
    event.preventDefault();
    return false;
  }

  // 非多页面模式下，打开设置前先关闭搜索
  if (!store.prioritizeFirst && store.searchOpenState) store.searchOpenState = false;

  store.setOpenState = !store.setOpenState;
  showMessage(`已${store.setOpenState ? "打开" : "关闭"}全局设置`, Setting);
  event.preventDefault();
  return false;
};

// 中键：切换壁纸预览
const handleMiddleClick = (event) => {
  if (event.button !== 1) return;
  store.backgroundShow = !store.backgroundShow;
  showMessage(
    `已${store.backgroundShow ? "启用" : "退出"}壁纸预览状态`,
    store.backgroundShow ? PreviewOpen : PreviewClose,
  );
  if (store.webSpeech) {
    SpeechLocal(store.backgroundShow ? "壁纸预览已启用.mp3" : "壁纸预览已退出.mp3");
  }
};

// Alt + A：打开帮助
const handleHelpToggle = (event) => {
  if (!event.altKey || event.key.toLowerCase() !== "a") return;
  event.preventDefault();
  toggleHelp();
};

/* ==================== 系统主题监听 ==================== */

let systemThemeListener = null;

// 移除系统主题监听（如果存在）
const removeSystemThemeListener = () => {
  if (!systemThemeListener) return;
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .removeEventListener("change", systemThemeListener);
  systemThemeListener = null;
};

// 首次启动时跟随系统主题（仅在用户从未设置过主题时）
const initSystemTheme = () => {
  if (store.themeType !== null) return;

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  store.themeType = media.matches ? "dark" : "light";
  systemThemeListener = (e) => {
    store.themeType = e.matches ? "dark" : "light";
  };
  media.addEventListener("change", systemThemeListener);
};

/* ==================== 生命周期 ==================== */

onMounted(async () => {
  // 自定义鼠标
  cursorInit();

  // 键盘 / 鼠标快捷键
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("keydown", handleThemeSwitch);
  document.addEventListener("keydown", handleSearchToggle);
  document.addEventListener("keydown", handleHelpToggle);
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("mousedown", handleMiddleClick);

  // 页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);

  // 系统主题
  initSystemTheme();

  // Live2D
  await initLive2D(store.modelType);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
  document.removeEventListener("keydown", handleThemeSwitch);
  document.removeEventListener("keydown", handleSearchToggle);
  document.removeEventListener("keydown", handleHelpToggle);
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("mousedown", handleMiddleClick);
  window.removeEventListener("resize", getWidth);

  removeSystemThemeListener();

  // 关闭可能打开的帮助弹窗
  ElMessageBox.close();
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transition: transform 0.3s;
  animation: fade-blur-main-in 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.5s;
  .container {
    width: 100%;
    height: 100vh;
    margin: 0 auto;
    padding: 0 0.5vw;
    .all {
      width: 100%;
      height: 100%;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
    .more {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--main-mores-bg-color);
      backdrop-filter: blur(20px);
      animation: fade 0.5s;
    }
    .more-set {
      z-index: 3;
    }
    .more-search {
      z-index: 2;
    }
    @media (max-width: 1200px) {
      padding: 0 2vw;
    }
  }
  .menu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 84%;
    left: calc(50% - 28px);
    width: 56px;
    height: 34px;
    background-color: var(--main-cards-bg-color);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    transition: transform 0.3s;
    animation: fade 0.5s;
    &:active {
      transform: scale(0.95);
    }
    .i-icon {
      transform: translateY(2px);
    }
    @media (min-width: 721px) {
      display: none;
    }
  }
  @media (max-height: 720px) {
    overflow-y: auto;
    overflow-x: hidden;
    .container {
      height: 721px;
      .more {
        height: 721px;
        width: calc(100% + 6px);
      }
      @media (min-width: 371px) {
        // w 1201px ~ max
        padding-left: 0.7vw;
        padding-right: 0.25vw;
        @media (max-width: 1200px) {
          // w 1101px ~ 1280px
          padding-left: 2.3vw;
          padding-right: 1.75vw;
        }
        @media (max-width: 1100px) {
          // w 993px ~ 1100px
          padding-left: 2vw;
          padding-right: calc(2vw - 6px);
        }
        @media (max-width: 992px) {
          // w 901px ~ 992px
          padding-left: 2.3vw;
          padding-right: 1.7vw;
        }
        @media (max-width: 900px) {
          // w 371px ~ 900px
          padding-left: 2vw;
          padding-right: calc(2vw - 6px);
        }
      }
    }
    .menu {
      top: 605.64px; // 721px * 0.84
      left: calc(371px * 0.5 - 25px);
      @media (min-width: 371px) {
        left: calc(50% - 25px);
      }
    }
    .f-ter {
      top: 675px; // 721px - 46px
      @media (min-width: 371px) {
        padding-left: 6px;
      }
    }
  }
  @media (max-width: 370px) {
    overflow-x: auto;
    .container {
      width: 371px;
    }
    .menu {
      left: calc(370px * 0.5 - 28px);
    }
    .f-ter {
      width: 371px;
    }
    @media (min-height: 721px) {
      overflow-y: hidden;
    }
  }
}
</style>
