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
            :clear-icon="Close"
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
                :clear-icon="Close"
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
        <!-- 捷径 -->
        <div class="shortcut__layout">
          <ShortCut />
        </div>
      </el-card>
    </div>
    <!-- 自定义搜索引擎对话框 -->
    <el-dialog
      v-model="customDialogVisible"
      title="自定义搜索引擎"
      width="500px"
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
            :clear-icon="Close"
            clearable
          />
        </el-form-item>
        <el-form-item label="搜索引擎地址">
          <el-input
            v-model="customEngineUrlInput"
            placeholder="例如：https://www.douban.com/search?q="
            :clear-icon="Close"
            clearable
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
} from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import ShortCut from "@/components/ShortCut.vue";
import searchEngineListRaw from "@/assets/searchEngineList.json";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const closeShow = ref(false);
const keyword = ref("");
const selectRef = ref(null);
const searchInput = ref(null);
const { searchEngine, customEngineUrl, customEngineName } = storeToRefs(store);

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

// 自定义引擎对话框
const customDialogVisible = ref(false);
const customEngineUrlInput = ref("");
const customEngineNameInput = ref("");

// 动态构建引擎列表
const computedEngineList = computed(() => {
  const list = JSON.parse(JSON.stringify(searchEngineListRaw));
  // 如果存在自定义引擎 URL，添加自定义分组
  if (customEngineUrl.value && customEngineUrl.value.trim() !== "") {
    list.push({
      label: "自定义",
      options: [
        {
          key: "custom",
          name: customEngineName.value || "自定义",
          icon: "Search", // 自定义图标
          searchUrl: customEngineUrl.value,
        },
      ],
    });
  }
  return list;
});

// 展平所有引擎（用于查找）
const allEngines = computed(() => computedEngineList.value.flatMap((g) => g.options));

// 当前选中的引擎对象（处理自定义）
const currentEngine = computed(() => {
  if (searchEngine.value === "custom") {
    // 自定义引擎
    if (customEngineUrl.value) {
      return {
        key: "custom",
        name: customEngineName.value || "自定义",
        icon: "Search",
        searchUrl: customEngineUrl.value,
      };
    } else {
      // 如果自定义 URL 为空，回退到第一个
      return allEngines.value.find((e) => e.key === "Baidu") || allEngines.value[0];
    }
  }
  return allEngines.value.find((e) => e.key === searchEngine.value) || allEngines.value[0];
});

// 当前分组图标
const currentGroupIcon = computed(() => {
  const groupLabel = getGroupLabelByEngineKey(searchEngine.value);
  return groupIconMap[groupLabel] || Find;
});

// 根据引擎 key 查找所属分组 label
const getGroupLabelByEngineKey = (key) => {
  for (const group of computedEngineList.value) {
    if (group.options.some((e) => e.key === key)) return group.label;
  }
  return null;
};

// 监听搜索界面打开状态
watch(
  () => store.searchOpenState,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (store.focusSearch) {
          selectRef.value?.focus();
          selectRef.value?.toggleMenu();
        }
      });
    }
  },
);

// 选中搜索引擎后聚焦到输入框
const handleSelectChange = (val) => {
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 取消后聚焦到搜索输入框，避免焦点残留
const handleCancel = () => {
  customDialogVisible.value = false;
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 打开自定义对话框
const openCustomDialog = () => {
  customEngineUrlInput.value = customEngineUrl.value || "";
  customEngineNameInput.value = customEngineName.value || "";
  customDialogVisible.value = true;
};

// 确认添加自定义引擎
const confirmCustomEngine = () => {
  const url = customEngineUrlInput.value.trim();
  const name = customEngineNameInput.value.trim() || "自定义";
  // 简单验证
  if (!url) {
    ElMessage({
      message: "请输入搜索引擎地址",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    ElMessage({
      message: "请输入以 http:// 或 https:// 开头的完整 URL",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    return;
  }
  if (url !== store.customEngineUrl || name !== store.customEngineName) {
    ElMessage({
      message: `已添加搜索引擎：${name}`,
      icon: h(Correct, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
  }

  // 保存到 store（会自动切换 searchEngine = 'custom'）
  store.setCustomEngine(url, name);
  customDialogVisible.value = false;
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 执行搜索（修改 URL 拼接逻辑，支持 {keyword}）
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
    url = text.startsWith("http") ? text : `https://${text}`;
  } else if (inputType === "email") {
    url = `mailto:${text}`;
  } else {
    const searchUrl = currentEngine.value.searchUrl;
    // 如果包含 {keyword} 则替换，否则直接拼接
    if (searchUrl.includes("{keyword}")) {
      url = searchUrl.replace(/\{keyword\}/g, encodeURIComponent(text));
    } else {
      url = searchUrl + encodeURIComponent(text);
    }
  }

  window.open(url, "_blank");
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
  background: var(--main-panel-bg-color);
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
      text-shadow: 0 0 5px #00000050;

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

      // 搜索框
      .input-search {
        --el-input-border-color: #ffffff;
        --el-input-placeholder-color: #efefef;
        --el-input-hover-border-color: #dcdfe6;
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
