<template>
  <div class="base-card"><slot /></div>
</template>

<script setup lang="ts">
/**
 * Стеклянная карточка (glassmorphism) — единый «корпус» повторяющихся панелей
 * (sidebar, leaderboard и т.п.). Специфику (flex:1, overflow, иные отступы)
 * консюмер добавляет своим классом: <BaseCard class="my-card"> — класс попадает
 * на корневой .base-card и стилизуется scoped-правилами родителя.
 */
</script>

<style scoped>
.base-card {
  background: rgb(var(--c-bg) / 0.3);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  box-sizing: border-box;
  box-shadow:
    0 8px 32px rgb(var(--c-bg-deep) / 0.3),
    0 4px 16px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.1),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
}
</style>
