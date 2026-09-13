<template>
  <!-- 搜索页 -->
  <Transition name="fade">
    <Search v-show="store.searchOpenState">
      <ShortCut />
    </Search>
  </Transition>
</template>

<script setup>
import Search from "@/components/Search.vue";
import ShortCut from "@/components/ShortCut.vue";
import { mainStore } from "@/store";

const store = mainStore();
</script>
