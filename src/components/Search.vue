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
      <el-card class="nav" shadow="never">
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
            :clear-icon="Close"
            clearable
          >
            <template #prepend>
              <!-- 切换搜索引擎 -->
              <el-select
                ref="selectRef"
                v-model="searchEngine"
                @visible-change="handleSelectVisibleChange"
                class="engine-select"
                size="large"
                placeholder="搜索引擎"
                :teleported="false"
                popper-class="engine-popper"
                filterable
                default-first-option
                no-match-text="没有匹配的数据"
                fit-input-width
                :clear-icon="CloseSmall"
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
                  v-for="group in computedEngineList"
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
                <!-- 自定义搜索引擎按钮 -->
                <template #footer>
                  <div class="custom-footer" @click.stop="openCustomDialog">
                    <span class="custom-icon">
                      <SettingConfig theme="outline" size="16" fill="#909399" />
                    </span>
                    <span class="custom-text">自定义配置</span>
                  </div>
                </template>
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
        <!-- 捷径插槽：由父组件注入 <ShortCut /> -->
        <div class="shortcut__layout">
          <slot />
        </div>
      </el-card>
    </div>

    <!-- 自定义搜索引擎对话框 -->
    <el-dialog
      v-model="customDialogVisible"
      title="自定义搜索引擎"
      width="500px"
      :close-icon="Close"
      align-center
      destroy-on-close
    >
      <el-form>
        <el-form-item label="搜索引擎名称">
          <el-input
            v-model="customEngineNameInput"
            placeholder="例如：豆瓣"
            maxlength="10"
            show-word-limit
            word-limit-position="outside"
            :clear-icon="CloseSmall"
            clearable
            @keyup.enter="confirmCustomEngine"
          />
        </el-form-item>
        <el-form-item label="搜索引擎地址">
          <el-input
            v-model="customEngineUrlInput"
            placeholder="例如：https://www.douban.com/search?q="
            :clear-icon="CloseSmall"
            clearable
            @keyup.enter="confirmCustomEngine"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="info" @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="confirmCustomEngine">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  CloseOne,
  Error,
  Correct,
  Search,
  Seo,
  Find,
  SettingConfig,
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
  Close,
  CloseSmall,
} from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import searchEngineListRaw from "@/assets/searchEngineList.json";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const { searchEngine, customEngineUrl, customEngineName } = storeToRefs(store);

/* ==================== 静态配置 ==================== */

// 聚焦延迟（等待 el-select 内部状态就绪）
const FOCUS_DELAY = 100;

// 自定义引擎默认名
const DEFAULT_ENGINE_NAME = "自定义";

// 自定义引擎回退 key
const FALLBACK_ENGINE_KEY = "Baidu";

// 协议校验正则
const PROTOCOL_REGEX = /^https?:\/\//i;

// URL 关键词占位符
const KEYWORD_PLACEHOLDER = "{keyword}";
const KEYWORD_REGEX = /\{keyword\}/g;

// 引擎图标映射
const iconMap = {
  Search,
  Seo,
  Find,
  SettingConfig,
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
  自定义: SettingConfig,
};

/* ==================== 本地状态 ==================== */

const closeShow = ref(false);
const keyword = ref("");
const selectRef = ref(null);
const searchInput = ref(null);

// 自定义引擎对话框
const customDialogVisible = ref(false);
const customEngineUrlInput = ref("");
const customEngineNameInput = ref("");

/* ==================== 引擎列表 ==================== */

// 动态构建引擎列表（有自定义引擎时追加到末尾）
const computedEngineList = computed(() => {
  const list = [...searchEngineListRaw];
  if (customEngineUrl.value?.trim()) {
    list.push({
      label: "自定义",
      options: [
        {
          key: "custom",
          name: customEngineName.value || DEFAULT_ENGINE_NAME,
          icon: "Search",
          searchUrl: customEngineUrl.value,
        },
      ],
    });
  }
  return list;
});

// 展平所有引擎（用于查找）
const allEngines = computed(() => computedEngineList.value.flatMap((g) => g.options));

// 当前选中的引擎对象（自定义为空时回退到默认）
const currentEngine = computed(() => {
  if (searchEngine.value === "custom" && customEngineUrl.value) {
    return {
      key: "custom",
      name: customEngineName.value || DEFAULT_ENGINE_NAME,
      icon: "Search",
      searchUrl: customEngineUrl.value,
    };
  }
  const key = searchEngine.value === "custom" ? FALLBACK_ENGINE_KEY : searchEngine.value;
  return allEngines.value.find((e) => e.key === key) || allEngines.value[0];
});

// 当前所属分组图标
const currentGroupIcon = computed(() => {
  const label = getGroupLabelByEngineKey(searchEngine.value);
  return groupIconMap[label] || Find;
});

// 根据引擎 key 查找所属分组 label
const getGroupLabelByEngineKey = (key) => {
  for (const group of computedEngineList.value) {
    if (group.options.some((e) => e.key === key)) return group.label;
  }
  return null;
};

/* ==================== 工具函数 ==================== */

// 聚焦搜索输入框（支持延迟，等待 el-select 内部状态就绪）
const focusSearchInput = (delay = 0) => {
  const doFocus = () => searchInput.value?.focus();
  if (delay > 0) setTimeout(doFocus, delay);
  else nextTick(doFocus);
};

// 自动聚焦搜索引擎下拉（打开搜索界面时调用）
const focusSearchEngine = () => {
  if (!store.focusSearch) return;
  setTimeout(() => {
    selectRef.value?.focus();
    selectRef.value?.toggleMenu();
  }, FOCUS_DELAY);
};

// 自定义引擎校验（返回错误信息，通过返回 null）
const validateCustomEngine = (url) => {
  if (!url) return "请输入搜索引擎地址";
  if (!PROTOCOL_REGEX.test(url)) return "请输入以 http:// 或 https:// 开头的完整 URL";
  return null;
};

// 根据输入内容生成跳转 URL
const buildSearchUrl = (text) => {
  const inputType = identifyInput(text);
  if (inputType === "url") {
    return PROTOCOL_REGEX.test(text) ? text : `https://${text}`;
  }
  if (inputType === "email") {
    return `mailto:${text}`;
  }
  const searchUrl = currentEngine.value.searchUrl;
  return searchUrl.includes(KEYWORD_PLACEHOLDER)
    ? searchUrl.replace(KEYWORD_REGEX, encodeURIComponent(text))
    : searchUrl + encodeURIComponent(text);
};

/* ==================== 事件处理 ==================== */

// 下拉关闭后聚焦到搜索输入框
const handleSelectVisibleChange = (visible) => {
  if (!visible && !customDialogVisible.value) {
    focusSearchInput(FOCUS_DELAY);
  }
};

// 打开自定义引擎对话框
const openCustomDialog = () => {
  customEngineUrlInput.value = customEngineUrl.value || "";
  customEngineNameInput.value = customEngineName.value || "";
  customDialogVisible.value = true;
};

// 取消对话框
const handleCancel = () => {
  customDialogVisible.value = false;
  focusSearchInput();
};

// 确认添加自定义引擎
const confirmCustomEngine = () => {
  const url = customEngineUrlInput.value.trim();
  const name = customEngineNameInput.value.trim() || DEFAULT_ENGINE_NAME;

  const errorMsg = validateCustomEngine(url);
  if (errorMsg) {
    ElMessage({
      message: errorMsg,
      icon: h(Error, { theme: "filled", fill: "#efefef" }),
    });
    return;
  }

  // 内容有变化才提示成功
  if (url !== store.customEngineUrl || name !== store.customEngineName) {
    ElMessage({
      message: `已添加搜索引擎：${name}`,
      icon: h(Correct, { theme: "filled", fill: "#efefef" }),
    });
  }

  store.setCustomEngine(url, name);
  customDialogVisible.value = false;
  focusSearchInput();
};

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

  window.open(buildSearchUrl(text), "_blank");
  if (store.clearContent) keyword.value = "";
};

/* ==================== 监听 ==================== */

// 搜索界面打开时自动聚焦
watch(
  () => store.searchOpenState,
  (newVal) => {
    if (newVal) nextTick(focusSearchEngine);
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 80%;
  background: var(--main-panel-bg-color);
  border-radius: 6px;
  padding: 40px;
  box-shadow: var(--main-big-box-shadow);

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
      text-shadow: var(--main-big-text-shadow);

      .i-icon {
        width: 28px;
        height: 28px;
        margin-right: 6px;
      }
    }

    .nav {
      margin-top: 20px;
      height: 100%;
      box-shadow: var(--main-small-box-shadow);

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

        .custom-footer {
          padding: 6px 10px;
          transition: background 0.2s;
          .custom-icon {
            vertical-align: middle;
          }
          .custom-text {
            margin-left: 4px;
            color: #909399;
          }
          &:hover {
            background-color: #fff;
          }
        }
      }

      :deep(.engine-select) {
        --el-select-multiple-input-color: #ffffff;

        .el-popper__arrow::before {
          background: var(--main-select-bg-color);
        }
      }

      :global(.engine-popper) {
        background: var(--main-select-bg-color);
      }

      .input-search {
        --el-input-border-color: #efefef;
        --el-input-hover-border-color: #dcdfe6;
        --el-input-placeholder-color: #efefef;
        --el-input-focus-border-color: #eeeeee;
      }

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
