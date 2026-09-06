<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
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
import { HamburgerButton, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import Box from "@/views/Box/index.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import SearchInp from "@/views/SearchInp/index.vue";
import cursorInit from "@/utils/cursor.js";
import { SpeechLocal } from "@/utils/speech";
import { toggleHelp } from "@/utils/help";
import config from "@/../package.json";
import * as live2d from "live2d-render";

const store = mainStore();

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    // 欢迎提示
    helloInit();
    if (store.webSpeech) {
      speechHelloInit();
    }
    // 节日提醒
    checkDays();
  });
};

// 监听宽度变化
const monitorWidthChanges = (value) => {
  if (value < 721) {
    store.boxOpenState = false;
    store.setOpenState = false;
    store.searchOpenState = false;
    store.live2dShow = false;
  }
};

watch(
  () => store.innerWidth,
  (value) => monitorWidthChanges(value),
);

// 监听页面层级
const settingsZIndex = computed(() => store.getZIndex("settings"));
const searchZIndex = computed(() => store.getZIndex("search"));

watch(
  () => store.setOpenState,
  (val) => {
    if (val) {
      store.registerPage("settings");
      if (store.webSpeech) {
        SpeechLocal("鼠标右键.mp3");
      }
    } else {
      store.unregisterPage("settings");
    }
  },
  { immediate: true },
);

watch(
  () => store.searchOpenState,
  (val) => {
    if (val) {
      store.registerPage("search");
      if (store.webSpeech) {
        SpeechLocal("找东西.mp3");
      }
    } else {
      store.unregisterPage("search");
    }
  },
  { immediate: true },
);

// 初始化Live2D
const initLive2D = async (type) => {
  // 路由配置
  const basePath = import.meta.env.MODE === "production" ? "" : ".";
  // 根据 type 设置入口文件
  if (type === "Mao") {
    store.modelPath = `${basePath}/live2d/Mao/Mao.model3.json`;
  } else if (type === "Hiyori") {
    store.modelPath = `${basePath}/live2d/Hiyori/Hiyori.model3.json`;
  } else if (type === "Mark") {
    store.modelPath = `${basePath}/live2d/Mark/Mark.model3.json`;
  } else if (type === "Wanko") {
    store.modelPath = `${basePath}/live2d/Wanko/Wanko.model3.json`;
  } else {
    store.modelPath = `${basePath}/live2d/Mao/Mao.model3.json`;
  }

  await live2d.initializeLive2D({
    ResourcesPath: store.modelPath, // 入口文件
    BackgroundRGBA: [0.0, 0.0, 0.0, 0.0], // 背景颜色
    CanvasSize: { height: 250, width: 200 }, // 调整大小
    ShowToolBox: store.live2dShow, // 是否显示模型
    LoadFromCache: true, // 是否使用 indexDB 进行缓存优化
  });
};

// 全局键盘事件
const handleGlobalKeydown = (event) => {
  const activeEl = document.activeElement;
  const isInputFocused = activeEl && (activeEl.tagName === "INPUT" || activeEl.isContentEditable);
  if (event.key === "Tab") {
    if (isInputFocused) {
      return;
    }
    event.preventDefault();
    store.boxOpenState = !store.boxOpenState;
    if (store.messageShow) {
      ElMessage({
        message: `已${store.boxOpenState ? "打开" : "关闭"}时光胶囊`,
        grouping: true,
        duration: 2000,
      });
    }
    return;
  }
};

const handleThemeSwitch = (event) => {
  if (event.altKey && (event.key === "d" || event.key === "D")) {
    event.preventDefault();
    store.themeType = store.themeType === "dark" ? "light" : "dark";
    if (store.messageShow) {
      ElMessage({
        message: `已切换至${store.themeType === "dark" ? "深色" : "浅色"}模式`,
        grouping: true,
        duration: 2000,
      });
    }
  }
};

const handleSearchToggle = (event) => {
  if (event.altKey && event.key.toLowerCase() === "s") {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.isContentEditable)) {
      return;
    }
    event.preventDefault();
    store.searchOpenState = !store.searchOpenState;
    if (store.messageShow) {
      ElMessage({
        message: `已${store.searchOpenState ? "打开" : "关闭"}全网搜索`,
        grouping: true,
        duration: 2000,
      });
      if (store.searchOpenState) {
        ElMessage({
          message: "右键链接可编辑或删除捷径哦",
          grouping: true,
        });
      }
    }
  }
};

const handleContextMenu = (event) => {
  const target = event.target;
  const isShortcutItem =
    target.closest?.(".shortcut-item-wrapper") || target.closest?.(".shortcut-item");
  // 点击在捷径链接上，允许组件内部处理
  if (isShortcutItem) {
    return true;
  }
  // 如果有 monitorWidthChanges 函数则调用
  if (typeof monitorWidthChanges === "function") {
    monitorWidthChanges(store.innerWidth);
  }
  // 移动端禁用右键
  if (store.innerWidth < 721) {
    ElMessage({
      message: "为了浏览体验，已禁用右键",
      grouping: true,
      duration: 2000,
    });
    event.preventDefault();
    return false;
  }
  // 切换全局设置面板
  store.setOpenState = !store.setOpenState;
  if (store.messageShow) {
    ElMessage({
      message: `已${store.setOpenState ? "打开" : "关闭"}全局设置`,
      grouping: true,
      duration: 2000,
    });
  }
  event.preventDefault();
  return false;
};

const handleMiddleClick = (event) => {
  if (event.button !== 1) return;
  store.backgroundShow = !store.backgroundShow;
  if (store.messageShow) {
    ElMessage({
      message: `已${store.backgroundShow ? "启用" : "退出"}壁纸预览状态`,
      grouping: true,
      duration: 2000,
    });
  }
  if (store.webSpeech) {
    SpeechLocal(store.backgroundShow ? "壁纸预览已启用.mp3" : "壁纸预览已退出.mp3");
  }
};

const handleHelpToggle = (event) => {
  if (event.altKey && (event.key === "a" || event.key === "A")) {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.isContentEditable)) {
      return;
    }
    event.preventDefault();
    toggleHelp();
  }
};

onMounted(() => {
  // 自定义鼠标
  cursorInit();

  // live2d模型
  initLive2D(store.modelType);

  // 时光胶囊
  document.addEventListener("keydown", handleGlobalKeydown);

  // 主题模式
  document.addEventListener("keydown", handleThemeSwitch);

  // 全网搜索
  document.addEventListener("keydown", handleSearchToggle);

  // 全局设置
  document.addEventListener("contextmenu", handleContextMenu);

  // 预览壁纸
  document.addEventListener("mousedown", handleMiddleClick);

  // 获取帮助
  document.addEventListener("keydown", handleHelpToggle);

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);

  // 控制台输出
  const styleTitle1 = "font-size: 20px;font-weight: 600;color: rgb(244,167,89);";
  const styleTitle2 = "font-size:12px;color: rgb(244,167,89);";
  const styleContent = "color: rgb(30,152,255);";
  const title1 = "無名の主页";
  const title2 = `
 _____ __  __  _______     ____     __
|_   _|  \\/  |/ ____\\ \\   / /\\ \\   / /
  | | | \\  / | (___  \\ \\_/ /  \\ \\_/ /
  | | | |\\/| |\\___ \\  \\   /    \\   /
 _| |_| |  | |____) |  | |      | |
|_____|_|  |_|_____/   |_|      |_|`;
  const content = `\n\n版本: ${config.version}\n主页: ${config.home}\nGithub: ${config.github}`;
  console.info(`%c${title1} %c${title2} %c${content}`, styleTitle1, styleTitle2, styleContent);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", getWidth);
  document.removeEventListener("keydown", handleGlobalKeydown);
  document.removeEventListener("keydown", handleThemeSwitch);
  document.removeEventListener("keydown", handleSearchToggle);
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("mousedown", handleMiddleClick);
  document.removeEventListener("keydown", handleHelpToggle);
  if (isHelpOpen) {
    ElMessageBox.close();
    isHelpOpen = false;
  }
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
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
    background: var(--main-cards-bg-color);
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
      @media (min-width: 391px) {
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
          // w 391px ~ 900px
          padding-left: 2vw;
          padding-right: calc(2vw - 6px);
        }
      }
    }
    .menu {
      top: 605.64px; // 721px * 0.84
      left: 170.5px; // 391 * 0.5 - 25px
      @media (min-width: 391px) {
        left: calc(50% - 25px);
      }
    }
    .f-ter {
      top: 675px; // 721px - 46px
      @media (min-width: 391px) {
        padding-left: 6px;
      }
    }
  }
  @media (max-width: 390px) {
    overflow-x: auto;
    .container {
      width: 391px;
    }
    .menu {
      left: 167.5px; // 391px * 0.5 - 28px
    }
    .f-ter {
      width: 391px;
    }
    @media (min-height: 721px) {
      overflow-y: hidden;
    }
  }
}
</style>
