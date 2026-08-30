<template>
  <div class="set" @mouseenter="closeShow = true" @mouseleave="closeShow = false" @click.stop>
    <transition name="el-fade-in-linear">
      <close-one
        class="close"
        theme="filled"
        size="28"
        fill="#ffffff60"
        v-show="closeShow"
        @click="store.searchOpenState = false"
      />
    </transition>
    <div class="search">
      <div class="title">
        <Search theme="filled" size="28" fill="#ffffff60" />
        <span class="name">全网搜索</span>
      </div>
      <el-card class="nav">
        <template #header>
          <!-- 搜索框 -->
          <el-input
            ref="searchInput"
            v-model="keyword"
            class="input-search"
            size="large"
            autocomplete="false"
            placeholder="想搜点什么"
            @keydown.enter.prevent="handleSearch"
            clearable
          >
            <template #prepend>
              <!-- 切换搜索引擎 -->
              <el-select
                ref="selectRef"
                v-model="searchEngine"
                @change="handleSelectChange"
                class="engine-select"
                size="large"
                placeholder="搜索引擎"
                :teleported="false"
                popper-class="engine-popper"
                filterable
                default-first-option
                no-match-text="没有匹配的数据"
                fit-input-width
                clearable
              >
                <template #prefix>
                  <component
                    v-if="currentGroupIcon"
                    :is="currentGroupIcon"
                    class="icon-prefix"
                    theme="outline"
                    size="16"
                    fill="#ffffff"
                  />
                </template>
                <el-option-group
                  v-for="group in searchEngineList"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="engine in group.options"
                    :label="`${engine.name} ${engine.key}`"
                    :key="engine.key"
                    :value="engine.key"
                  >
                    <span class="option-icon">
                      <component
                        :is="iconMap[engine.icon]"
                        theme="outline"
                        size="16"
                        fill="#909399"
                      />
                    </span>
                    <span class="option-text">{{ engine.name }}</span>
                  </el-option>
                </el-option-group>
              </el-select>
            </template>
            <template #append>
              <el-button
                @click="handleSearch"
                class="search-btn"
                size="large"
                :icon="Search"
              ></el-button>
            </template>
          </el-input>
        </template>
        <!-- 捷径 -->
        <div class="shortcut__layout">
          <ShortCut />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import {
  CloseOne,
  Search,
  Seo,
  Find,
  World,
  Robot,
  Translate,
  Translation,
  Tiktok,
  Jinritoutiao,
  Weibo,
  Taobao,
  Google,
  Duck,
  Github,
} from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import ShortCut from "@/components/ShortCut.vue";
import searchEngineList from "@/assets/searchEngineList.json";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const closeShow = ref(false);
const keyword = ref("");
const selectRef = ref(null);
const searchInput = ref(null);
const { searchEngine } = storeToRefs(store);

const iconMap = {
  Search,
  Seo,
  Find,
  World,
  Robot,
  Translate,
  Translation,
  Tiktok,
  Jinritoutiao,
  Weibo,
  Taobao,
  Google,
  Duck,
  Github,
};

// 分组图标映射
const groupIconMap = {
  搜索: Find,
  翻译: Translate,
};

// 监听搜索界面打开状态
watch(
  () => store.searchOpenState,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        selectRef.value?.focus();
        selectRef.value?.toggleMenu();
      });
    }
  },
);

// 选中搜索引擎后，焦点移到输入框内
const handleSelectChange = (val) => {
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 展平所有引擎
const allEngines = computed(() => searchEngineList.flatMap((group) => group.options));

// 当前选中的引擎对象
const currentEngine = computed(() => {
  return (
    allEngines.value.find((engine) => engine.key === searchEngine.value) || allEngines.value[0]
  );
});

// 根据引擎 key 查找所属分组 label
const getGroupLabelByEngineKey = (key) => {
  for (const group of searchEngineList) {
    if (group.options.some((engine) => engine.key === key)) {
      return group.label;
    }
  }
  return null;
};

// 当前分组对应的图标
const currentGroupIcon = computed(() => {
  const groupLabel = getGroupLabelByEngineKey(searchEngine.value);
  return groupIconMap[groupLabel] || Find; // 默认显示
});

// 执行搜索
const handleSearch = () => {
  const text = keyword.value.trim();
  if (!text) {
    ElMessage({
      message: "请输入搜索内容",
      grouping: true,
      duration: 2000,
    });
    return;
  }

  let url = "";
  const inputType = identifyInput(text);
  if (inputType === "url") {
    // 直接访问网址
    url = text.startsWith("http") ? text : `https://${text}`;
  } else if (inputType === "email") {
    // 发送邮件
    url = `mailto:${text}`;
  } else {
    // 使用搜索引擎
    url = currentEngine.value.searchUrl + encodeURIComponent(text);
  }

  // 在新窗口打开
  window.open(url, "_blank");
  // 清空输入框
  if (store.clearContent) {
    keyword.value = "";
  }
};
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 80%;
  background: #ffffff60;
  border-radius: 6px;
  padding: 40px;
  box-shadow: var(--main-box-shadow);

  .close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(1);
    }
  }

  .search {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .title {
      display: flex;
      align-items: center;
      flex-direction: row;
      font-size: 18px;

      .i-icon {
        width: 28px;
        height: 28px;
        margin-right: 6px;
      }
    }

    .nav {
      margin-top: 20px;
      height: 100%;

      // 下拉菜单
      .engine-select {
        width: 200px;

        .icon-prefix {
          display: inline-flex;
          align-items: center;
        }

        .option-icon {
          vertical-align: middle;
        }

        .option-text {
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
          color: #909399;
        }
      }

      :deep(.engine-select) {
        --el-select-multiple-input-color: #ffffff;

        .el-popper__arrow::before {
          background: var(--main-input-background-color);
        }
      }

      :global(.engine-popper) {
        background: var(--main-input-background-color);
      }

      // 搜索框
      .input-search {
        --el-input-placeholder-color: rgba(255, 255, 255, 0.4);
        --el-input-focus-border-color: #eeeeee;
      }

      // 搜索按钮
      .search-btn {
        width: 100px;
        transition: 0.3s;

        &:hover {
          transform: scale(1.2);
        }

        &:active {
          transform: scale(1);
        }
      }

      .shortcut__layout {
        display: flex;
        flex-direction: column;
        padding: 20px;
      }
    }
  }
}
</style>
