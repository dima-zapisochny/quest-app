<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '@/store/quizStore'

// Инициализируем store на старте приложения (watch на профиль → загрузка квестов)
useQuizStore()
</script>

