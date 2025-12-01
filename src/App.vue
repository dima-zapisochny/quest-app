<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '@/store/quizStore'

const store = useQuizStore()
</script>

