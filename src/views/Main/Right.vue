<template>
  <div :class="store.mobileOpenState ? 'right' : 'right hidden'">
    <!-- 移动端切换按钮 -->
    <Icon class="switch-button" size="24" @click="store.mobileFuncState = !store.mobileFuncState">
      <Switch />
    </Icon>
    <!-- 功能区 -->
    <Func />
    <!-- 网站链接 -->
    <Link />
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import { Switch } from "@icon-park/vue-next";
import Func from "@/views/Func/index.vue";
import Link from "@/components/Links.vue";
const store = mainStore();
</script>

<style lang="scss" scoped>
.right {
  // flex: 1 0 0%;
  width: 50%;
  margin-left: 0.75rem;

  .switch-button {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    bottom: 84%;
    left: calc(50% - 28px);
    width: 56px;
    height: 34px;
    background: var(--main-cards-bg-color);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    transition: transform 0.3s;
    animation: fade 0.5s;

    &:active {
      transform: scale(0.95);
    }

    @media (min-width: 721px) {
      display: none;
    }

    @media (max-height: 720px) {
      bottom: 605.64px; // 721px * 0.84
      left: 170.5px; // 391 * 0.5 - 25px
      @media (min-width: 391px) {
        left: calc(50% - 25px);
      }
    }

    @media (max-width: 390px) {
      left: 167.5px; // 391px * 0.5 - 28px
    }
  }

  @media (max-width: 720px) {
    margin-left: 0;
    width: 100%;

    &.hidden {
      display: none;
    }
  }
}
</style>
