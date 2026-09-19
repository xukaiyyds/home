<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo -->
    <div class="logo">
      <el-tooltip content="xukai" placement="top" :show-arrow="false">
        <img class="logo-img" :src="siteLogo" alt="logo" @click="jumpTo(config.me)" />
      </el-tooltip>
      <div :class="{ name: true, 'text-hidden': true, long: siteUrl[0].length >= 6 }">
        <span class="bg">{{ siteUrl[0] }}</span>
        <span class="sm">.{{ siteUrl[1] }}</span>
      </div>
    </div>

    <!-- 简介 -->
    <div class="description cards" @click="changeBox">
      <div class="content">
        <Icon size="16"><QuoteLeft /></Icon>
        <div class="text">
          <p>{{ descriptionText.hello }}</p>
          <p ref="textRef"></p>
        </div>
        <Icon size="16"><QuoteRight /></Icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { QuoteLeft, QuoteRight } from "@vicons/fa";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";
import TypeIt from "typeit";
import { SpeechLocal } from "@/utils/speech";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 移动端宽度阈值
const MOBILE_WIDTH = 721;

// 站点 logo
const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO;

// 站点域名（写死，拆成 [主域, 后缀] 便于模板分别展示）
const siteUrl = ["yyds", "cn"];

// 简介文案：盒子关闭 / 打开两种状态
const DESC_DEFAULT = {
  hello: import.meta.env.VITE_DESC_HELLO,
  text: import.meta.env.VITE_DESC_TEXT,
};
const DESC_OTHER = {
  hello: import.meta.env.VITE_DESC_HELLO_OTHER,
  text: import.meta.env.VITE_DESC_TEXT_OTHER,
};

/* ==================== 本地状态 ==================== */

// 简介区域文字（响应式，随盒子状态切换）
const descriptionText = reactive({ ...DESC_DEFAULT });
const textRef = ref(null);
let typeitInstance = null;
const typedSet = new Set();

/* ==================== 打字机 ==================== */

// 直接显示文字（无打字效果）
const showTextDirectly = (text) => {
  nextTick(() => {
    typeitInstance?.destroy();
    typeitInstance = null;
    if (textRef.value) textRef.value.textContent = text;
  });
};

// 播放文字：该文案首次出现时打字，之后直接显示
const playText = (text) => {
  // 窄屏不做打字效果，直接显示（不标记 typedSet，拉宽后首次出现仍会打字）
  if (window.innerWidth < MOBILE_WIDTH) {
    showTextDirectly(text);
    return;
  }

  if (typedSet.has(text)) {
    showTextDirectly(text);
    return;
  }
  typedSet.add(text);

  nextTick(() => {
    if (!textRef.value) return;
    typeitInstance?.destroy();
    typeitInstance = null;
    textRef.value.textContent = "";
    typeitInstance = new TypeIt(textRef.value, {
      speed: 90,
      lifeLike: true,
      cursor: true,
    });
    typeitInstance.type(text).go();
  });
};

/* ==================== 事件处理 ==================== */

// 点击 logo 跳转
const jumpTo = (url) => window.open(url);

// 窄屏提示
const showMobileTip = () => {
  ElMessage({
    message: "当前页面宽度不足以开启盒子",
    grouping: true,
    icon: h(Error, { theme: "filled", fill: "#efefef" }),
  });
  if (store.webSpeech) SpeechLocal("分辨率不足.mp3");
};

// 点击简介：桌面端切换时光胶囊，移动端给出提示
const changeBox = () => {
  if (store.innerWidth >= MOBILE_WIDTH) {
    store.boxOpenState = !store.boxOpenState;
  } else {
    showMobileTip();
  }
};

/* ==================== 监听 ==================== */

// 盒子状态变化时切换简介文案
watch(
  () => store.boxOpenState,
  (isOpen) => {
    const target = isOpen ? DESC_OTHER : DESC_DEFAULT;
    descriptionText.hello = target.hello;
    descriptionText.text = target.text;
    playText(target.text); // ← 统一入口

    if (isOpen && store.webSpeech) SpeechLocal("惊讶.mp3");
  },
);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  playText(descriptionText.text);
});

onBeforeUnmount(() => {
  typeitInstance?.destroy();
  typeitInstance = null;
});
</script>

<style lang="scss" scoped>
.message {
  .logo {
    display: flex;
    flex-direction: row;
    align-items: center;
    animation: fade 0.5s;
    max-width: 460px;

    .logo-img {
      width: 120px;
    }

    .logo-img:hover {
      transform: rotate(666turn);
      transition: transform 59s 1s cubic-bezier(0.3, 0, 0.8, 1);
    }

    .name {
      width: 100%;
      padding-left: 22px;
      transform: translateY(-8px);
      font-family: "Pacifico-Regular";

      .bg {
        font-size: 5rem;
      }

      .sm {
        margin-left: 6px;
        font-size: 2.5rem;

        @media (min-width: 721px) and (max-width: 789px) {
          display: none;
        }
      }
    }

    @media (max-width: 768px) {
      .logo-img {
        width: 100px;
      }

      .name {
        height: 128px;

        .bg {
          font-size: 4.5rem;
        }
      }
    }

    @media (max-width: 720px) {
      max-width: 100%;
    }
  }

  .description {
    padding: 1rem;
    margin-top: 3.5rem;
    max-width: 460px;
    animation: fade 0.5s;

    .content {
      display: flex;
      justify-content: space-between;

      .text {
        margin: 0.75rem 1rem;
        line-height: 2rem;
        margin-right: auto;
        transition: opacity 0.2s;

        p {
          &:nth-of-type(1) {
            font-family: "Pacifico-Regular";
          }
        }
      }

      .xicon:nth-of-type(2) {
        align-self: flex-end;
      }
    }

    @media (max-width: 720px) {
      max-width: 100%;
      pointer-events: none;
    }
  }
}
</style>
