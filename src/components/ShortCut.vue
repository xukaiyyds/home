<template>
  <div class="links" @click="closeContextMenu">
    <div class="line">
      <Icon size="16">
        <Link />
      </Icon>
      <span class="title">捷径列表</span>
      <div class="action-buttons">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索捷径..."
          size="small"
          :prefix-icon="Search"
          class="search-input"
          :clear-icon="CloseSmall"
          clearable
        />
        <el-button size="small" @click="openAddModal">
          <span
            ><Icon size="14"><Plus /></Icon
          ></span>
          <span class="buttons-text">添加</span>
        </el-button>
        <el-button size="small" @click="downloadHtmlFile">
          <span
            ><Icon size="12"><Download /></Icon
          ></span>
          <span class="buttons-text">下载</span>
        </el-button>
        <el-button size="small" @click="triggerFileInput">
          <span
            ><Icon size="12"><Upload /></Icon
          ></span>
          <span class="buttons-text">上传</span>
          <input
            type="file"
            ref="fileInputRef"
            accept=".html,.htm"
            style="display: none"
            @change="handleFileUpload"
          />
        </el-button>
      </div>
    </div>

    <!-- Swiper 分页网格 -->
    <Swiper
      v-if="pagedShortcuts.length"
      :modules="[Pagination, Mousewheel]"
      :slides-per-view="1"
      :space-between="40"
      :pagination="{ el: '.swiper-pagination', clickable: true, bulletElement: 'div' }"
      :mousewheel="true"
    >
      <SwiperSlide v-for="(page, pageIndex) in pagedShortcuts" :key="pageIndex">
        <el-row class="link-all" :gutter="20">
          <el-col
            v-for="item in page"
            :key="item.id"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
            :title="item.name"
            class="shortcut-item-wrapper"
            @contextmenu.prevent="openContextMenu($event, item)"
            @click="jumpLink(item.url)"
          >
            <div class="shortcut-item">
              <span class="name text-hidden">{{ item.name }}</span>
            </div>
          </el-col>
        </el-row>
      </SwiperSlide>
      <div class="swiper-pagination" />
    </Swiper>

    <!-- 空状态 -->
    <div v-else class="not-shortcut">
      <span class="tip">{{ searchKeyword ? "未找到匹配的捷径" : "暂无捷径，去添加吧" }}</span>
      <el-button @click="openAddModal">
        <span
          ><Icon size="14"><Plus /></Icon
        ></span>
        <span class="buttons-text">添加捷径</span>
      </el-button>
    </div>

    <!-- 自定义右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        ref="menuRef"
        class="custom-context-menu"
        :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }"
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

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑捷径' : '添加捷径'"
      :close-icon="Close"
      width="500px"
      align-center
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
        <el-text type="info" size="small"
          >批量添加操作：将浏览器的收藏夹导出，再将导出的收藏夹文件上传到这里。</el-text
        >
      </el-form>
      <template #footer>
        <el-button type="info" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">
          {{ dialogType === "edit" ? "更新" : "确认" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { Link, Plus, Download, Upload, Edit, TrashAlt } from "@vicons/fa";
import { Search, Close, CloseSmall } from "@icon-park/vue-next";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Mousewheel } from "swiper/modules";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const { shortcutData } = storeToRefs(store);

/* ==================== 静态配置 ==================== */

// 每页显示数量
const PAGE_SIZE = 18;

// 右键菜单尺寸（用于边界检测）
const MENU_WIDTH = 160;
const MENU_HEIGHT = 80;
const MENU_MARGIN = 5;

// 协议匹配正则
const PROTOCOL_REGEX = /^(https?:\/\/)/i;

// 书签导出文件配置
const BOOKMARK_FOLDER_NAME = "XKの主页捷径数据";
const BOOKMARK_FILE_NAME = "shortcut.html";

/* ==================== 本地状态 ==================== */

// 搜索关键词
const searchKeyword = ref("");

// 表单
const dialogVisible = ref(false);
const dialogType = ref("add");
const formRef = ref(null);
const formData = reactive({ id: null, name: "", url: "" });
const fileInputRef = ref(null);

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextItem = ref(null);
const menuRef = ref(null);

/* ==================== 表单校验规则 ==================== */

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

/* ==================== 分页与搜索 ==================== */

// 按关键词过滤
const filteredData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return shortcutData.value;
  return shortcutData.value.filter((item) => item.name.toLowerCase().includes(keyword));
});

// 分页
const pagedShortcuts = computed(() => {
  const list = filteredData.value;
  const pages = [];
  for (let i = 0; i < list.length; i += PAGE_SIZE) {
    pages.push(list.slice(i, i + PAGE_SIZE));
  }
  return pages;
});

/* ==================== 通用工具函数 ==================== */

// 计算下一个可用 id
const findNextId = () => shortcutData.value.reduce((max, item) => Math.max(max, item.id), -1) + 1;

// 检查名称或链接是否重复（可排除指定索引）
const isDuplicate = (name, url, excludeIndex = -1) =>
  shortcutData.value.some((d, idx) => idx !== excludeIndex && (d.name === name || d.url === url));

// 重新编号（删除后保持 id 连续）
const reindexShortcuts = () => {
  shortcutData.value.forEach((d, i) => (d.id = i));
};

// 将坐标限制在视口内
const clampPosition = (x, y) => {
  const maxX = window.innerWidth - MENU_WIDTH - MENU_MARGIN;
  const maxY = window.innerHeight - MENU_HEIGHT - MENU_MARGIN;
  return [Math.max(0, Math.min(x, maxX)), Math.max(0, Math.min(y, maxY))];
};

/* ==================== 添加/编辑 ==================== */

// 统一打开弹窗
const openDialog = (type, data = null) => {
  dialogType.value = type;
  if (type === "add") {
    formData.id = findNextId();
    formData.name = "";
    formData.url = "";
  } else {
    formData.id = data.id;
    formData.name = data.name;
    formData.url = data.url;
  }
  dialogVisible.value = true;
};

const openAddModal = () => openDialog("add");
const openEditModal = (item) => openDialog("edit", item);

// 提交表单
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
      shortcutData.value.push({
        id: formData.id,
        name: formData.name,
        url: formData.url,
      });
      ElMessage.success("添加成功");
    } else {
      const index = shortcutData.value.findIndex((d) => d.id === formData.id);
      if (index === -1) {
        ElMessage.error("数据不存在");
        return;
      }
      if (isDuplicate(formData.name, formData.url, index)) {
        ElMessage.error("名称或链接已存在");
        return;
      }
      shortcutData.value[index].name = formData.name;
      shortcutData.value[index].url = formData.url;
      ElMessage.success("编辑成功");
    }

    dialogVisible.value = false;
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
      const index = shortcutData.value.findIndex((d) => d.id === item.id);
      if (index === -1) return;
      shortcutData.value.splice(index, 1);
      reindexShortcuts();
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

/* ==================== 跳转 ==================== */

const jumpLink = (url) => {
  if (!url) return;
  const urlFormat = PROTOCOL_REGEX.test(url) ? url : `//${url}`;
  window.open(urlFormat, "_blank");
};

/* ==================== 右键菜单 ==================== */

const openContextMenu = (event, item) => {
  event.preventDefault();
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

// 点击菜单外部时关闭
const handleGlobalClick = (e) => {
  if (!contextMenuVisible.value) return;
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    closeContextMenu();
  }
};

/* ==================== 上传/下载 ==================== */

const triggerFileInput = () => fileInputRef.value?.click();

// 导出为 Netscape 书签格式
const downloadHtmlFile = () => {
  const items = shortcutData.value
    .map((item) => `<DT><A HREF="${item.url}">${item.name}</A>\n`)
    .join("");

  const htmlStr = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'"></meta>
<TITLE>Bookmarks</TITLE>
<DL><p>
    <DT><H3 ADD_DATE="1716991740" LAST_MODIFIED="1716991740">${BOOKMARK_FOLDER_NAME}</H3>
    <DL><p>
        ${items}
    </DL><p>
</DL>`;

  const blob = new Blob([htmlStr], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = BOOKMARK_FILE_NAME;
  a.click();
  URL.revokeObjectURL(url);
};

// 解析上传的书签文件
const parseBookmarks = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const aElements = doc.querySelectorAll("a");
  let nextId = findNextId();
  let addedCount = 0;

  aElements.forEach((a) => {
    const name = a.textContent.trim();
    const url = a.href;
    if (!name || !url) return;
    if (isDuplicate(name, url)) return;
    shortcutData.value.push({ id: nextId++, name, url });
    addedCount += 1;
  });

  if (addedCount > 0) {
    ElMessage.success(`成功导入 ${addedCount} 个捷径`);
  } else {
    ElMessage.info("没有新捷径可导入");
  }
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const content = await file.text();
    parseBookmarks(content);
  } finally {
    // 清空 input，允许重复选择同一个文件
    event.target.value = "";
  }
};

/* ==================== 监听 ==================== */

// 搜索页关闭时，同步关闭右键菜单和删除确认框
watch(
  () => store.searchOpenState,
  (isOpen) => {
    if (isOpen) return;
    closeContextMenu();
    ElMessageBox.close();
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
    margin: 0.5rem 0.25rem 1rem;
    display: flex;
    align-items: center;
    animation: fade 0.5s;

    .title {
      margin-left: 8px;
      font-size: 1rem;
      text-shadow: 0 0 5px #00000050;
      flex: 1;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;

      .search-input {
        width: 180px;
        margin-right: 10px;

        :deep(.el-input__wrapper) {
          --el-input-focus-border-color: #eeeeee;

          .el-input__inner {
            font-size: 11px;

            &::placeholder {
              color: rgba(255, 255, 255, 0.4);
            }
          }

          .el-input__prefix-inner {
            font-size: 10px;
          }
        }
      }

      .el-button {
        padding: 6px 12px;
        background-color: var(--main-cards-bg-color);

        &:hover {
          background-color: var(--main-button-hover-bg-color);
        }

        &:active {
          border-color: #fff;
        }

        .buttons-text {
          margin-left: 2px;
          font-size: 12px;
        }
      }
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
    height: 250px;

    .shortcut-item-wrapper {
      margin-bottom: 20px;
      height: 70px;

      .shortcut-item {
        height: 100%;
        display: flex;
        align-items: center;
        flex-direction: row;
        justify-content: center;
        border-radius: 6px;
        background-color: var(--main-cards-bg-color);
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .not-shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 270px;

    .tip {
      margin-bottom: 20px;
      font-size: 16px;
      letter-spacing: 2px;
      color: #eee;
    }

    .el-button {
      background-color: var(--main-cards-bg-color);

      &:hover {
        background-color: var(--main-button-hover-bg-color);
      }

      &:active {
        border-color: #fff;
      }

      .buttons-text {
        margin-left: 4px;
      }
    }
  }
}
</style>
