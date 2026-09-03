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
          clearable
        />
        <el-button size="small" @click="openAddModal">
          <span>
            <Icon size="14">
              <Plus />
            </Icon>
          </span>
          <span class="buttons-text">添加</span>
        </el-button>
        <el-button size="small" @click="downloadHtmlFile">
          <span>
            <Icon size="12">
              <Download />
            </Icon>
          </span>
          <span class="buttons-text">下载</span>
        </el-button>
        <el-button size="small" @click="triggerFileInput">
          <span>
            <Icon size="12">
              <Upload />
            </Icon>
          </span>
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

    <!-- Swiper分页网格 -->
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
        <span>
          <Icon size="14">
            <Plus />
          </Icon>
        </span>
        <span class="buttons-text">添加捷径</span>
      </el-button>
    </div>

    <!-- 自定义右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="custom-context-menu"
        :style="{
          left: contextMenuX + 'px',
          top: contextMenuY + 'px',
        }"
        @click.stop
        @contextmenu.prevent
      >
        <div class="menu-item" @click="handleContextAction('edit')">
          <span>
            <Icon size="12">
              <Edit />
            </Icon>
          </span>
          <span class="menu-text">编辑</span>
        </div>
        <div class="menu-item danger" @click="handleContextAction('delete')">
          <span>
            <Icon size="12">
              <TrashAlt />
            </Icon>
          </span>
          <span class="menu-text">删除</span>
        </div>
      </div>
    </Teleport>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑捷径' : '添加捷径'"
      width="500px"
      align-center
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="捷径名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="例如：百度"
            maxlength="10"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="站点链接" prop="url">
          <el-input v-model="formData.url" placeholder="例如：https://www.baidu.com" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="info" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { Link, Search, Plus, Download, Upload, Edit, TrashAlt } from "@vicons/fa";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Mousewheel } from "swiper/modules";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const { shortcutData } = storeToRefs(store);

// 搜索功能
const searchKeyword = ref("");
const filteredData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return shortcutData.value;
  return shortcutData.value.filter((item) => item.name.toLowerCase().includes(keyword));
});

// 分页
const pageSize = 18;
const pagedShortcuts = computed(() => {
  const arr = filteredData.value || [];
  const pages = [];
  for (let i = 0; i < arr.length; i += pageSize) {
    pages.push(arr.slice(i, i + pageSize));
  }
  return pages;
});

// 表单
const dialogVisible = ref(false);
const dialogType = ref("add");
const formRef = ref(null);
const formData = reactive({ id: null, name: "", url: "" });
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

// 打开添加/编辑
const openAddModal = () => {
  const maxId = shortcutData.value.reduce((max, item) => Math.max(max, item.id), -1);
  formData.id = maxId + 1;
  formData.name = "";
  formData.url = "";
  dialogType.value = "add";
  dialogVisible.value = true;
};

const openEditModal = (item) => {
  formData.id = item.id;
  formData.name = item.name;
  formData.url = item.url;
  dialogType.value = "edit";
  dialogVisible.value = true;
};

// 提交
const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("请检查输入");
      return;
    }
    if (dialogType.value === "add") {
      const duplicate = shortcutData.value.some(
        (item) => item.name === formData.name || item.url === formData.url,
      );
      if (duplicate) {
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
      const index = shortcutData.value.findIndex((item) => item.id === formData.id);
      if (index === -1) {
        ElMessage.error("数据不存在");
        return;
      }
      const duplicate = shortcutData.value.some(
        (item, idx) => idx !== index && (item.name === formData.name || item.url === formData.url),
      );
      if (duplicate) {
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

// 删除
const confirmDelete = (item) => {
  ElMessageBox.confirm(
    `确认删除 “<el-text style="color:#E6A23C">${item.name}</el-text>” 捷径？此操作无法恢复！`,
    "删除捷径",
    {
      confirmButtonClass: "warning",
      cancelButtonClass: "cancel-deletion",
      dangerouslyUseHTMLString: true,
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(() => {
      const index = shortcutData.value.findIndex((d) => d.id === item.id);
      if (index !== -1) {
        shortcutData.value.splice(index, 1);
        shortcutData.value.forEach((d, i) => (d.id = i));
        ElMessage.success("删除成功");
      }
    })
    .catch(() => {});
};

// 跳转
const jumpLink = (url) => {
  if (!url) return;
  const urlRegex = /^(https?:\/\/)/i;
  const urlFormat = urlRegex.test(url) ? url : `//${url}`;
  window.open(urlFormat, "_blank");
};

// 自定义右键菜单
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
let contextItem = null;

const openContextMenu = (event, item) => {
  event.preventDefault();
  if (contextMenuVisible.value) {
    contextMenuVisible.value = false;
    contextItem = null;
    nextTick(() => {
      openContextMenu(event, item);
    });
    return;
  }
  contextItem = { ...item };
  let x = event.clientX;
  let y = event.clientY;
  const menuWidth = 160;
  const menuHeight = 80;
  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 5;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 5;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  contextMenuX.value = x;
  contextMenuY.value = y;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextItem = null;
};

const handleContextAction = (action) => {
  if (!contextItem) return;
  const item = contextItem;
  closeContextMenu();
  if (action === "edit") {
    openEditModal(item);
  } else if (action === "delete") {
    confirmDelete(item);
  }
};

const handleGlobalClick = (e) => {
  if (!contextMenuVisible.value) return;
  const menu = document.querySelector(".custom-context-menu");
  if (menu && !menu.contains(e.target)) {
    closeContextMenu();
  }
};

// 上传下载
const fileInputRef = ref(null);
const triggerFileInput = () => fileInputRef.value?.click();

const downloadHtmlFile = () => {
  let innerStr = "";
  shortcutData.value.forEach((item) => {
    innerStr += `<DT><A HREF="${item.url}">${item.name}</A>\n`;
  });
  const htmlStr = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'"></meta>
<TITLE>Bookmarks</TITLE>
<DL><p>
    <DT><H3 ADD_DATE="1716991740" LAST_MODIFIED="1716991740">XKの主页捷径文件</H3>
    <DL><p>
        ${innerStr}
    </DL><p>
</DL>`;
  const blob = new Blob([htmlStr], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "XKの主页-捷径文件.html";
  a.click();
  URL.revokeObjectURL(url);
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    if (typeof content === "string") {
      parseBookmarks(content);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
};

const parseBookmarks = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const aElements = doc.querySelectorAll("a");
  let maxId = shortcutData.value.reduce((max, item) => Math.max(max, item.id), -1);
  let addedCount = 0;
  aElements.forEach((a) => {
    const name = a.textContent.trim();
    const url = a.href;
    if (!name || !url) return;
    const duplicate = shortcutData.value.some((item) => item.name === name || item.url === url);
    if (duplicate) return;
    maxId += 1;
    shortcutData.value.push({ id: maxId, name, url });
    addedCount++;
  });
  if (addedCount > 0) {
    ElMessage.success(`成功导入 ${addedCount} 个捷径`);
  } else {
    ElMessage.info("没有新捷径可导入");
  }
};

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
      text-shadow: 0 0 5px #00000025;
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
        background-color: var(--main-button-bg-color);

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
        box-shadow: var(--main-box-shadow);
        animation: fade 0.5s;

        &:hover {
          transform: scale(1.02);
          background: var(--main-links-hover-bg-color);
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
      background-color: var(--main-button-bg-color);

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

.custom-context-menu {
  position: fixed;
  z-index: 999;
  background: var(--main-panel-bg-color);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 6px 0;
  text-align: center;
  min-width: 140px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .menu-item {
    padding: 8px 20px;
    color: rgba(255, 255, 255, 0.9);
    transition: background 0.15s;

    .menu-text {
      margin-left: 4px;
      font-size: 14px;
    }

    &:hover {
      background: rgb(133, 206, 97);
    }

    &.danger {
      &:hover {
        background: rgb(247, 137, 137);
      }
    }
  }
}
</style>
