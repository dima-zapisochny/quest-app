<template>
  <teleport to="body">
    <transition name="app-toast">
      <div
        v-if="toastVisible"
        class="app-toast"
        role="status"
        aria-live="polite"
      >
        {{ toastMessage }}
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { toastMessage, toastVisible } from '@/utils/toast'
</script>

<style scoped>
.app-toast {
  position: fixed;
  top: 1.15rem;
  left: 50%;
  z-index: 3000;
  transform: translateX(-50%);
  max-width: min(92vw, 22rem);
  padding: 0.7rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-bg) / 0.92);
  color: rgb(var(--c-text));
  font-size: 0.92rem;
  font-weight: 650;
  text-align: center;
  box-shadow: 0 12px 32px rgb(var(--c-bg-deep) / 0.55);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
