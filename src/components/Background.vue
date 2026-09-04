<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="store.bgUrl"
      class="bg"
      :style="{ '--blur': store.backgroundBlur + 'px' }"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
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
import initSnowfall from "@/utils/snow";

const store = mainStore();
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);

// 壁纸随机数
// 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字
const bgRandom = Math.floor(Math.random() * 4 + 1);
const bgRandoms = Math.floor(Math.random() * 12 + 1)
  .toString()
  .padStart(2, "0");

// 更换壁纸链接
const changeBg = (type) => {
  if (type == 0) {
    store.bgUrl = `/images/background${bgRandom}.jpg`;
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
  console.log("壁纸加载且动画完成");
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
  store.bgUrl = `/images/background${bgRandom}.jpg`;
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(value);
  },
);

// 星空特效&雪花特效
const cleanup = ref({
  universe: null, // 清理函数
  snowfall: null,
});

const toggleEffect = (type, show) => {
  // 销毁旧特效
  if (cleanup.value[type]) {
    cleanup.value[type]();
    cleanup.value[type] = null;
  }

  // 创建新特效
  if (show) {
    const initFn = type === "snowfall" ? initSnowfall : initUniverse;
    cleanup.value[type] = initFn();
  }
};

// 监听 store 状态变化
watch(
  () => store.darkstarShow,
  (val) => toggleEffect("universe", val),
);

watch(
  () => store.snowflakeShow,
  (val) => toggleEffect("snowfall", val),
);

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

// 监听颜色变化
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
  // 加载星空特效
  toggleEffect("universe", store.darkstarShow);
  // 加载雪花特效
  toggleEffect("snowfall", store.snowflakeShow);
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
