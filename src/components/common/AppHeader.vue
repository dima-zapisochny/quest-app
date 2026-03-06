<template>
  <header class="app-header">
    <div class="app-header-left">
      <NavigationButton 
        :variant="buttonVariant" 
        :label="buttonLabel" 
        :disabled="buttonDisabled"
        @click="$emit('button-click')" 
      />
    </div>
    <div class="app-header-right">
      <div v-if="showSessionCode && sessionCode" class="session-chip">
        Код игры: <strong>{{ sessionCode }}</strong>
      </div>
      <UserPill v-if="userName || userAvatar" :name="userName" :avatar="userAvatar" />
    </div>
  </header>
</template>

<script setup lang="ts">
import NavigationButton from './NavigationButton.vue'
import UserPill from './UserPill.vue'

interface Props {
  buttonVariant?: 'back' | 'exit'
  buttonLabel?: string
  buttonDisabled?: boolean
  showSessionCode?: boolean
  sessionCode?: string | null
  userName?: string | null
  userAvatar?: string | null
}

withDefaults(defineProps<Props>(), {
  buttonVariant: 'back',
  buttonLabel: 'Назад',
  buttonDisabled: false,
  showSessionCode: false,
  sessionCode: null,
  userName: null,
  userAvatar: null
})

defineEmits<{
  'button-click': []
}>()
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.2rem 1.5rem 0.75rem;
  margin: 0;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  box-sizing: border-box;
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.app-header-right {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.session-chip {
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.4);
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  color: #f8fafc;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem 1rem 0.5rem;
    gap: 0.5rem;
  }

  .app-header-right {
    gap: 0.5rem;
  }

  .session-chip {
    padding: 0.4rem 0.85rem;
    font-size: 0.78rem;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.85rem 0.75rem 0.4rem;
    gap: 0.4rem;
  }

  .session-chip {
    padding: 0.35rem 0.7rem;
    font-size: 0.72rem;
  }
}

@media (max-width: 360px) {
  .app-header {
    padding: 0.75rem 0.5rem 0.35rem;
    gap: 0.35rem;
  }

  .session-chip {
    padding: 0.3rem 0.6rem;
    font-size: 0.68rem;
  }
}
</style>


