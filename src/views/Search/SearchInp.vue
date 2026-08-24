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
    <el-row>
      <el-col class="search">
        <div class="title">
          <Search theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全网搜索</span>
        </div>
        <el-card class="shortcut">
          <template #header>
            <div class="card-header">
              <!-- 搜索框 -->
              <el-input class="input" v-model="input" size="large" autocomplete="false" placeholder="请输入搜索内容" clearable>
                <template #prepend>
                    <el-select v-model="select" size="large" placeholder="Select" style="width: 115px;">
                      <el-option label="Restaurant" value="1" />
                      <el-option label="Order No." value="2" />
                      <el-option label="Tel" value="3" />
                    </el-select>
                </template>
                <template #append>
                    <el-button :icon="Search" />
                </template>
              </el-input>
            </div>
          </template>
          <div class="upnote">
            <div v-for="item in upData.new" :key="item" class="uptext">
              <add-one theme="outline" size="22" />
              {{ item }}
            </div>
            <div v-for="item in upData.fix" :key="item" class="uptext">
              <bug theme="outline" size="22" />
              {{ item }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo, Search, GithubOne, AddOne, Bug } from "@icon-park/vue-next";
import { mainStore } from "@/store";
const store = mainStore();
const closeShow = ref(false);

const select = ref("");
const input = ref("");

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

        :deep(.el-input) {
          --el-input-text-color: #FFFFFF;
          --el-input-bg-color: rgba(255, 255, 255, 0.1);
          --el-input-placeholder-color: #CFD3DC;
          backdrop-filter: blur(10px);
          .el-input-group__prepend,
          .el-input-group__append {
            background-color: rgba(255, 255, 255, 0.2);
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
