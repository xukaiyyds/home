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
import { SpeechLocal } from "@/utils/speech";

const store = mainStore();
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);

// 壁纸随机数
// 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字
const bgRandom = Math.floor(Math.random() * 6 + 1);
const bgRandoms = Math.floor(Math.random() * 12 + 1)
  .toString()
  .padStart(2, "0");

// 判断是否为移动端
const isMobile = ref(window.innerWidth < 721);

// 获取当前主题对应的默认壁纸路径
const getDefaultBg = () => {
  // 移动端优先使用专用壁纸
  if (isMobile.value) {
    return "/images/photo/bg1.png";
  }
  // 浅色模式专用壁纸 / 深色模式专用壁纸
  const theme = store.themeType === "dark" ? "dark" : "light";
  return `/images/${theme}/bg${bgRandom}.png`;
};

// 更换壁纸链接
const changeBg = (type) => {
  if (type == 0) {
    store.bgUrl = getDefaultBg();
  } else if (type == 1) {
    store.bgUrl = "https://api.xinyew.cn/api/bing";
  } else if (type == 2) {
    store.bgUrl = `https://plog.xukaiyyds.cn/img/wallpaper/淡雅/${bgRandoms}.jpg`;
  } else if (type == 3) {
    store.bgUrl = `https://plog.xukaiyyds.cn/img/wallpaper/星空/${bgRandoms}.jpg`;
  } else if (type == 4) {
    store.bgUrl = "https://tu.ltyuanfang.cn/api/fengjing.php";
  } else if (type == 5) {
    store.bgUrl = "https://t.alcy.cc/ycy";
  } else if (type == 6) {
    store.bgUrl = store.backgroundCustom;
  }
};

// 图片加载完成
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", store.bgUrl);
  ElMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  store.bgUrl = getDefaultBg();
  if (store.webSpeech) {
    setTimeout(() => {
      SpeechLocal("壁纸加载失败.mp3");
    }, 2000);
  }
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(value);
  },
);

// 特效管理
const cleanup = ref({
  universe: null,
  firefly: null,
  snowfall: null,
  bubble: null,
});

// 根据当前粒子类型切换特效
const switchParticle = (type) => {
  // 先关闭所有特效
  Object.keys(cleanup.value).forEach((key) => {
    if (cleanup.value[key]) {
      cleanup.value[key]();
      cleanup.value[key] = null;
    }
  });
  // 再开启选中的
  if (type) {
    const typeMap = {
      star: "universe",
      snow: "snowfall",
      firefly: "firefly",
      bubble: "bubble",
    };
    const effectType = typeMap[type];
    if (effectType) {
      let initFn = null;
      if (effectType === "snowfall") initFn = initSnowfall;
      else if (effectType === "universe") initFn = initUniverse;
      else if (effectType === "firefly") initFn = initFirefly;
      else if (effectType === "bubble") initFn = initBubble;
      if (initFn) {
        cleanup.value[effectType] = initFn();
      }
    }
  }
};

watch(
  () => store.showParticle,
  (val) => {
    if (!val) {
      // 关闭所有特效
      Object.keys(cleanup.value).forEach((key) => {
        if (cleanup.value[key]) {
          cleanup.value[key]();
          cleanup.value[key] = null;
        }
      });
    } else {
      switchParticle(store.currentParticle);
    }
  },
  { immediate: true },
);

// 监听粒子类型变化
watch(
  () => store.currentParticle,
  (newVal) => {
    if (store.showParticle) {
      switchParticle(newVal);
    }
  },
);

// 组件销毁时清理
onUnmounted(() => {
  Object.keys(cleanup.value).forEach((key) => {
    if (cleanup.value[key]) {
      cleanup.value[key]();
      cleanup.value[key] = null;
    }
  });
});

// 切换主题
const changeThemeType = (val) => {
  const htmlElement = document.querySelector("html");
  const themeType = val === "dark" ? "dark" : "light";
  htmlElement.setAttribute("theme", themeType);
};

// 监听主题变化
watch(
  () => store.themeType,
  (val) => changeThemeType(val),
);

// 监听壁纸模糊变化
watch(
  () => store.backgroundShow,
  (newVal) => {
    if (newVal) {
      store.savedBackgroundBlur = store.backgroundBlur;
      store.backgroundBlur = 0;
    } else {
      store.backgroundBlur = store.savedBackgroundBlur;
    }
  },
  { immediate: true },
);

onMounted(() => {
  // 加载壁纸
  changeBg(store.coverType);
  // 加载主题
  changeThemeType(store.themeType);
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  if (store.backgroundShow) {
    store.backgroundBlur = store.savedBackgroundBlur;
  }
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
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
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
