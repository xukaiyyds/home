<template>
  <div v-if="siteLinksList.length" class="links">
    <div class="line">
      <Icon size="20">
        <Link />
      </Icon>
      <span class="title">{{ store.shortcutHome ? "捷径列表" : "网站列表" }}</span>
    </div>

    <Swiper
      :key="store.shortcutHome ? 'shortcut' : 'site'"
      :modules="[Pagination, Mousewheel]"
      :slides-per-view="1"
      :space-between="40"
      :pagination="{ el: '.swiper-pagination', clickable: true, bulletElement: 'div' }"
      :mousewheel="true"
      :observer="true"
      :observeParents="true"
    >
      <SwiperSlide v-for="(page, pageIndex) in siteLinksList" :key="pageIndex">
        <el-row class="link-all" :gutter="20">
          <el-col v-for="item in page" :key="item.id || item.name" :span="8">
            <!-- 普通项 -->
            <div
              v-if="!item.isAdd"
              class="item cards"
              @click="jumpLink(item)"
              @contextmenu.stop.prevent="openContextMenu($event, item)"
            >
              <Icon size="26">
                <component :is="siteIcon[item.icon] || Compass" />
              </Icon>
              <span class="name text-hidden">{{ getItemName(item) }}</span>
            </div>
            <!-- 添加项 -->
            <div v-else class="item cards" @click="openAddModal">
              <Icon size="26">
                <PlusCircle />
              </Icon>
              <span class="name">添加捷径</span>
            </div>
          </el-col>
        </el-row>
      </SwiperSlide>
      <div class="swiper-pagination" />
    </Swiper>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑捷径' : '添加捷径'"
      width="500px"
      align-center
      :close-icon="Close"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="捷径名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="例如：百度"
            maxlength="20"
            show-word-limit
            word-limit-position="outside"
            :clear-icon="CloseSmall"
            clearable
            @keyup.enter="submitForm"
          />
        </el-form-item>
        <el-form-item label="站点链接" prop="url">
          <el-input
            v-model="formData.url"
            placeholder="例如：https://www.baidu.com"
            :clear-icon="CloseSmall"
            clearable
            @keyup.enter="submitForm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="info" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">
          {{ dialogType === "edit" ? "更新" : "确认" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="custom-context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
        @click.stop
        @contextmenu.prevent
      >
        <div class="menu-item" @click="handleContextAction('edit')">
          <span
            ><Icon size="12"><Edit /></Icon
          ></span>
          <span class="menu-text">编辑</span>
        </div>
        <div class="menu-item danger" @click="handleContextAction('delete')">
          <span
            ><Icon size="12"><TrashAlt /></Icon
          ></span>
          <span class="menu-text">删除</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
// 可前往 https://www.xicons.org 自行挑选并在此处引入
import {
  Link,
  Book,
  Image,
  CompactDisc,
  Blog,
  Code,
  Dragon,
  Eye,
  Cloud,
  LaptopCode,
  Compass,
  PlusCircle,
  Edit,
  TrashAlt,
} from "@vicons/fa"; // 注意使用正确的类别
import { Close, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Mousewheel } from "swiper/modules";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 每页显示数量
const ITEMS_PER_PAGE = 6;

// 右键菜单尺寸（用于边界检测）
const MENU_WIDTH = 160;
const MENU_HEIGHT = 80;
const MENU_MARGIN = 5;

// 特殊的"音乐列表"捷径名（与 store.musicClick 联动）
const MUSIC_ITEM_NAME = "网抑音乐";

// 添加项模板
const ADD_ITEM = { id: -1, name: "添加捷径", url: "", isAdd: true };

// 网站链接图标映射
const siteIcon = {
  Book,
  Image,
  CompactDisc,
  Blog,
  Code,
  Dragon,
  Eye,
  Cloud,
  LaptopCode,
  Compass,
};

/* ==================== 本地状态 ==================== */

const editItem = ref(null);
const contextItem = ref(null); // 改为 ref，避免散落的裸变量

/* ==================== 分页列表 ==================== */

const siteLinksList = computed(() => {
  const data = store.siteLinks;
  const result = [];

  for (let i = 0; i < data.length; i += ITEMS_PER_PAGE) {
    result.push(data.slice(i, i + ITEMS_PER_PAGE));
  }

  // 仅在捷径模式下，在最后一页追加"添加项"
  if (!store.shortcutHome) return result;

  const lastPage = result[result.length - 1];
  if (!lastPage || lastPage.length === ITEMS_PER_PAGE) {
    result.push([{ ...ADD_ITEM }]);
  } else {
    lastPage.push({ ...ADD_ITEM });
  }
  return result;
});

/* ==================== 展示逻辑 ==================== */

// 显示名称（音乐项在开启"点击打开列表"时改名）
const getItemName = (item) => {
  if (item.name === MUSIC_ITEM_NAME && store.musicClick) return "音乐列表";
  return item.name;
};

/* ==================== 链接跳转 ==================== */

const jumpLink = (data) => {
  if (data.name === MUSIC_ITEM_NAME && store.musicClick) {
    if (typeof $openList === "function") $openList();
    return;
  }
  window.open(data.url, "_blank");
};

/* ==================== 右键菜单 ==================== */

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// 把坐标限制在视口内
const clampPosition = (x, y) => {
  const maxX = window.innerWidth - MENU_WIDTH - MENU_MARGIN;
  const maxY = window.innerHeight - MENU_HEIGHT - MENU_MARGIN;
  return [Math.max(0, Math.min(x, maxX)), Math.max(0, Math.min(y, maxY))];
};

const openContextMenu = (event, item) => {
  if (!store.shortcutHome || item.isAdd) return;
  event.stopPropagation();
  contextItem.value = { ...item };
  const [x, y] = clampPosition(event.clientX, event.clientY);
  contextMenuX.value = x;
  contextMenuY.value = y;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextItem.value = null;
};

const handleContextAction = (action) => {
  if (!contextItem.value) return;
  const item = contextItem.value;
  closeContextMenu();
  if (action === "edit") openEditModal(item);
  else if (action === "delete") confirmDelete(item);
};

// 点击外部关闭菜单
const handleGlobalClick = (e) => {
  if (!contextMenuVisible.value) return;
  const menu = document.querySelector(".custom-context-menu");
  if (menu && !menu.contains(e.target)) closeContextMenu();
};

// 设置页/搜索页打开时，自动关闭右键菜单
watch([() => store.setOpenState, () => store.searchOpenState], ([setOpen, searchOpen]) => {
  if ((setOpen || searchOpen) && contextMenuVisible.value) {
    closeContextMenu();
  }
});

/* ==================== 添加/编辑弹窗 ==================== */

const dialogVisible = ref(false);
const dialogType = ref("add");
const formRef = ref(null);
const formData = reactive({ name: "", url: "" });

const formRules = {
  name: [{ required: true, message: "请输入捷径名称", trigger: "blur" }],
  url: [
    { required: true, message: "请输入站点链接", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value && identifyInput(value) !== "url") {
          callback(new Error("请检查是否为正确的网址"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const openAddModal = () => {
  dialogType.value = "add";
  formData.name = "";
  formData.url = "";
  dialogVisible.value = true;
};

const openEditModal = (item) => {
  dialogType.value = "edit";
  editItem.value = item;
  formData.name = item.name;
  formData.url = item.url;
  dialogVisible.value = true;
};

// 校验捷径是否重复（排除 excludeIndex 自身）
const isDuplicate = (name, url, excludeIndex = -1) => {
  return store.shortcutData.some(
    (d, idx) => idx !== excludeIndex && (d.name === name || d.url === url),
  );
};

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("请检查输入");
      return;
    }

    if (dialogType.value === "add") {
      if (isDuplicate(formData.name, formData.url)) {
        ElMessage.error("名称或链接已存在");
        return;
      }
      const maxId = store.shortcutData.reduce((max, item) => Math.max(max, item.id), -1);
      store.shortcutData.push({
        id: maxId + 1,
        name: formData.name,
        url: formData.url,
      });
      ElMessage.success("添加成功");
    } else {
      const item = editItem.value;
      if (!item) {
        ElMessage.error("数据不存在");
        return;
      }
      const index = store.shortcutData.findIndex((d) => d.id === item.id);
      if (index === -1) {
        ElMessage.error("数据不存在");
        return;
      }
      if (isDuplicate(formData.name, formData.url, index)) {
        ElMessage.error("名称或链接已存在");
        return;
      }
      store.shortcutData[index].name = formData.name;
      store.shortcutData[index].url = formData.url;
      ElMessage.success("编辑成功");
    }

    dialogVisible.value = false;
    contextItem.value = null;
  });
};

/* ==================== 删除 ==================== */

const confirmDelete = (item) => {
  ElMessageBox.confirm(
    `确认删除 <el-text style="color:#409EFF">${item.name}</el-text> 捷径？此操作<el-text style="color:#E6A23C">无法恢复</el-text>！`,
    "删除捷径",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonClass: "danger",
      cancelButtonClass: "cancel-deletion",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(() => {
      const index = store.shortcutData.findIndex((d) => d.id === item.id);
      if (index === -1) return;
      store.shortcutData.splice(index, 1);
      // 重新编号，保证 id 连续
      store.shortcutData.forEach((d, i) => (d.id = i));
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

/* ==================== 监听 ==================== */

// 启用壁纸预览时，关闭右键菜单
watch(
  () => store.backgroundShow,
  (show) => {
    if (show) closeContextMenu();
  },
);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  document.addEventListener("click", handleGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleGlobalClick);
});
</script>

<style lang="scss" scoped>
.links {
  .line {
    margin: 2rem 0.25rem 1rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    animation: fade 0.5s;

    .title {
      margin-left: 8px;
      font-size: 1.15rem;
      text-shadow: 0 0 5px #00000050;
    }
  }

  .swiper {
    left: -10px;
    width: calc(100% + 20px);
    padding: 5px 10px 0;
    z-index: 0;

    .swiper-slide {
      height: 100%;
    }

    .swiper-pagination {
      margin-top: 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;

      :deep(.swiper-pagination-bullet) {
        background-color: #fff;
        width: 20px;
        height: 4px;
        margin: 0 4px;
        border-radius: 4px;
        opacity: 0.2;
        transition: opacity 0.3s;

        &.swiper-pagination-bullet-active {
          opacity: 1;
        }

        &:hover {
          opacity: 1;
        }
      }
    }
  }

  .link-all {
    height: 220px;

    .item {
      height: 100px;
      width: 100%;
      display: flex;
      align-items: center;
      flex-direction: row;
      justify-content: center;
      padding: 0 10px;
      animation: fade 0.5s;

      &:hover {
        transform: scale(1.02);
        background: var(--main-links-hover-bg-color);
        box-shadow: var(--main-small-box-shadow);
        transition: 0.3s;
      }

      &:active {
        transform: scale(1);
      }

      .name {
        font-size: 1.1rem;
        margin-left: 8px;
      }

      @media (min-width: 720px) and (max-width: 820px) {
        .name {
          display: none;
        }
      }

      @media (max-width: 720px) {
        height: 80px;
      }

      @media (max-width: 460px) {
        flex-direction: column;

        .name {
          font-size: 1rem;
          margin-left: 0;
          margin-top: 8px;
        }
      }
    }

    @media (max-width: 720px) {
      height: 180px;
    }
  }
}
</style>
