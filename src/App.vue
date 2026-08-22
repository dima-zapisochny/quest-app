<template>
  <div id="app" class="min-h-screen">
    <AppToast />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '@/store/quizStore'
import AppToast from '@/components/common/AppToast.vue'

// Инициализируем store на старте приложения (watch на профиль → загрузка квестов)
useQuizStore()
</script>

