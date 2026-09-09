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
      :pagination="{
        el: '.swiper-pagination',
        clickable: true,
        bulletElement: 'div',
      }"
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
              <span class="name text-hidden">
                {{ item.name === "网抑音乐" && store.musicClick ? "音乐列表" : item.name }}
              </span>
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
          />
        </el-form-item>
        <el-form-item label="站点链接" prop="url">
          <el-input v-model="formData.url" placeholder="例如：https://www.baidu.com" :clear-icon="CloseSmall" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="info" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{
          dialogType === "edit" ? "更新" : "确认"
        }}</el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
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
const editItem = ref(null);

// 计算分页，并在最后一页末尾添加添加项
const siteLinksList = computed(() => {
  const data = store.siteLinks;
  const result = [];
  const itemsPerPage = 6;
  for (let i = 0; i < data.length; i += itemsPerPage) {
    const page = data.slice(i, i + itemsPerPage);
    result.push(page);
  }

  // 仅在捷径模式下，在最后一页追加添加项
  if (store.shortcutHome) {
    const lastPage = result[result.length - 1];
    if (lastPage) {
      // 如果最后一页已经满6个，则新建一页放添加项
      if (lastPage.length === itemsPerPage) {
        result.push([{ id: -1, name: "添加捷径", url: "", isAdd: true }]);
      } else {
        lastPage.push({ id: -1, name: "添加捷径", url: "", isAdd: true });
      }
    } else {
      // 数据为空的情况，直接创建第一页并添加
      result.push([{ id: -1, name: "添加捷径", url: "", isAdd: true }]);
    }
  }

  return result;
});

// 网站链接图标
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

// 链接跳转
const jumpLink = (data) => {
  if (data.name === "网抑音乐" && store.musicClick) {
    if (typeof $openList === "function") $openList();
  } else {
    window.open(data.url, "_blank");
  }
};

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
let contextItem = null;

const openContextMenu = (event, item) => {
  if (item.isAdd) return; // 添加项不显示菜单
  event.stopPropagation();
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

// 点击外部关闭菜单
const handleGlobalClick = (e) => {
  if (!contextMenuVisible.value) return;
  const menu = document.querySelector(".custom-context-menu");
  if (menu && !menu.contains(e.target)) {
    closeContextMenu();
  }
};

// 添加/编辑弹窗
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

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("请检查输入");
      return;
    }
    if (dialogType.value === "add") {
      const duplicate = store.shortcutData.some(
        (item) => item.name === formData.name || item.url === formData.url,
      );
      if (duplicate) {
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
      const duplicate = store.shortcutData.some(
        (d, idx) => idx !== index && (d.name === formData.name || d.url === formData.url),
      );
      if (duplicate) {
        ElMessage.error("名称或链接已存在");
        return;
      }
      store.shortcutData[index].name = formData.name;
      store.shortcutData[index].url = formData.url;
      ElMessage.success("编辑成功");
    }
    dialogVisible.value = false;
    contextItem = null;
  });
};

// 删除
const confirmDelete = (item) => {
  ElMessageBox.confirm(
    `确认删除 <strong><el-text style="color:#409EFF">${item.name}</el-text></strong> 捷径？此操作无法恢复！`,
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
      if (index !== -1) {
        store.shortcutData.splice(index, 1);
        store.shortcutData.forEach((d, i) => (d.id = i));
        ElMessage.success("删除成功");
      }
    })
    .catch(() => {});
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
