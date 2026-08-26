<template>
  <div class="set" @mouseenter="closeShow = true" @mouseleave="closeShow = false" @click.stop>
    <transition name="el-fade-in-linear">
      <close-one class="close" theme="filled" size="28" fill="#ffffff60" v-show="closeShow"
        @click="store.searchOpenState = false" />
    </transition>
    <el-row>
      <el-col class="search">
        <div class="title">
          <Search theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全网搜索</span>
        </div>
        <el-card class="shortcut">
          <template #header>
            <!-- 搜索框 -->
            <el-input ref="searchInput" v-model="keyword" size="large" autocomplete="false" placeholder="想搜点什么"
              @keydown.enter.prevent="handleSearch" clearable>
              <template #prepend>
                <!-- 切换搜索引擎 -->
                <el-select ref="selectRef" v-model="searchEngine" class="engine-select" size="large" placeholder="搜索引擎"
                  :teleported="false" popper-class="engine-popper" filterable default-first-option
                  no-match-text="没有匹配的数据" fit-input-width clearable>
                  <template #prefix>
                    <component v-if="currentGroupIcon" :is="currentGroupIcon" class="icon-prefix" theme="outline"
                      size="16" fill="#ffffff" />
                  </template>
                  <el-option-group v-for="group in searchEngineList" :key="group.label" :label="group.label">
                    <el-option v-for="engine in group.options" :label="`${engine.name} ${engine.key}`" :key="engine.key"
                      :value="engine.key">
                      <span class="option-icon">
                        <component :is="iconMap[engine.icon]" theme="outline" size="16" fill="#909399" />
                      </span>
                      <span class="option-text">{{ engine.name }}</span>
                    </el-option>
                  </el-option-group>
                </el-select>
              </template>
              <template #append>
                <el-button @click="handleSearch" class="search-btn" size="large" :icon="Search"></el-button>
              </template>
            </el-input>
          </template>
          <div class="upnote">
            <!-- <div v-for="item in upData.new" :key="item" class="uptext">
              <add-one theme="outline" size="22" />
              {{ item }}
            </div>
            <div v-for="item in upData.fix" :key="item" class="uptext">
              <bug theme="outline" size="22" />
              {{ item }}
            </div> -->
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo, Search, Seo, Find, World, Translate, Translation, Tiktok, Weibo, Taobao, Google, Duck, Github, AddOne, Bug } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from 'pinia';
import searchEngineList from "@/assets/searchEngineList.json";

const store = mainStore();
const closeShow = ref(false);
const keyword = ref('');
const selectRef = ref(null);
const searchInput = ref(null);
const { searchEngine } = storeToRefs(store);

const iconMap = {
  Search,
  Seo,
  Find,
  World,
  Translate,
  Translation,
  Tiktok,
  Weibo,
  Taobao,
  Google,
  Duck,
  Github,
};

// 分组图标映射
const groupIconMap = {
  '搜索': Find,
  '翻译': Translate,
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
  }
);

// 展平所有引擎
const allEngines = computed(() => searchEngineList.flatMap(group => group.options));

// 当前选中的引擎对象
const currentEngine = computed(() => {
  return allEngines.value.find(engine => engine.key === searchEngine.value) || allEngines.value[0];
});

// 根据引擎 key 查找所属分组 label
const getGroupLabelByEngineKey = (key) => {
  for (const group of searchEngineList) {
    if (group.options.some(engine => engine.key === key)) {
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

// 当前引擎对应的图标
const currentEngineIcon = computed(() => {
  return currentEngine.value ? iconMap[currentEngine.value.icon] : null;
});

// 当前搜索引擎完整对象
const getcurrentEngine = computed(() => store.getCurrentEngine);

// 辅助函数：检测是否为网址或邮箱
const isUrl = (str) => /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(str);
const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

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

  let url = '';
  if (isUrl(text)) {
    // 直接访问网址
    url = text.startsWith('http') ? text : `https://${text}`;
  } else if (isEmail(text)) {
    // 发送邮件
    url = `mailto:${text}`;
  } else {
    url = currentEngine.value.searchUrl + encodeURIComponent(text);
  }

  // 在新窗口打开
  window.open(url, '_blank');
  // 清空输入框
  if(store.clearContent) {
    keyword.value = '';
  }
};

const upData = reactive({
  new: [
    "采用 Vue 进行重构",
    "音乐歌单支持快速自定义",
    "壁纸支持个性化设置",
    "音乐播放器支持音量控制",
  ],
  fix: ["修复天气 API", "时光胶囊显示错误", "移动端动画及细节", "图标更换为 IconPark"],
});
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: rgb(255 255 255 / 40%);
  border-radius: 6px;
  padding: 40px;

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

  .el-row {
    height: 100%;
    flex-wrap: nowrap;

    .search {
      height: 100%;
      //   padding-left: 40px;
      //   padding-right: 40px;
      //   padding-bottom: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .title {
        display: flex;
        align-items: center;
        flex-direction: row;
        font-size: 18px;
        // margin-bottom: 16px;

        .i-icon {
          width: 28px;
          height: 28px;
          margin-right: 6px;
        }
      }

      .shortcut {
        margin-top: 30px;
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
          --el-select-multiple-input-color: #FFFFFF;

          .el-popper__arrow::before {
            background: var(--main-input-background-color);
          }
        }

        :global(.engine-popper) {
          background: var(--main-input-background-color);
        }

        // 搜索框
        :deep(.el-input) {
          --el-input-text-color: #FFFFFF;
          --el-input-bg-color: var(--main-more-background-color);
          --el-input-placeholder-color: #CFD3DC;
          backdrop-filter: blur(10px);

          .el-input-group__prepend,
          .el-input-group__append {
            background-color: var(--main-cards-background-color);
          }
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

        :deep(.el-card__body) {
          height: 100%;

          .upnote {
            padding: 20px;
            height: calc(100% - 56px);
            overflow-y: auto;

            .uptext {
              display: flex;
              flex-direction: row;
              align-items: center;
              padding-bottom: 16px;

              &:nth-last-of-type(1) {
                padding: 0;
              }

              .i-icon {
                width: 22px;
                height: 22px;
                margin-right: 8px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
