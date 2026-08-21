<template>
  <router-link :to="to" class="back-link">
    <slot />
  </router-link>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
}>()
</script>

<style scoped>
.back-link {
  color: rgb(var(--c-accent-sky));
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.back-link:hover {
  text-decoration: underline;
}

.back-link__arrow {
  font-weight: 900;
}
</style>
