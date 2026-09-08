<template>
  <div class="set" @mouseenter="closeShow = true" @mouseleave="closeShow = false" @click.stop>
    <transition name="el-fade-in-linear">
      <close-one
        class="close"
        theme="filled"
        size="28"
        fill="#ffffff60"
        v-show="closeShow"
        @click="store.setOpenState = false"
      />
    </transition>
    <el-row>
      <el-col class="settings">
        <div class="title">
          <setting-two theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全局设置</span>
        </div>
        <Set />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import Set from "@/components/Set.vue";

const store = mainStore();
const closeShow = ref(false);
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 40%;
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

  .el-row {
    // height: 100%;

    .settings {
      display: flex;
      flex-direction: column;
      justify-content: center;

      .title {
        display: flex;
        align-items: center;
        flex-direction: row;
        font-size: 18px;
        text-shadow: var(--main-big-text-shadow);
        margin-bottom: 16px;

        .i-icon {
          width: 28px;
          height: 28px;
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
