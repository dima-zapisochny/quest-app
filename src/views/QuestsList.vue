<template>
  <div class="quests-view">
    <header class="quests-header">
      <h1 class="page-title">Выберите квест</h1>
      <router-link to="/host/setup" class="admin-link">
        ⚙️ Управление квестами
      </router-link>
    </header>

    <section v-if="quests.length === 0" class="empty-state">
      <p>Пока нет доступных квестов.</p>
      <router-link to="/host/setup" class="create-link">Создать первый квест →</router-link>
    </section>

    <section v-else class="quests-grid">
      <article
        v-for="quest in quests"
        :key="quest.id"
        class="quest-card"
        @click="goToQuest(quest.id)"
      >
        <header class="quest-card__header">
          <h2>{{ quest.title }}</h2>
          <p v-if="quest.description" class="quest-description">{{ quest.description }}</p>
        </header>
        <dl class="quest-stats">
          <div>
            <dt>Раундов</dt>
            <dd>{{ quest.rounds.length }}</dd>
          </div>
          <div>
            <dt>Вопросов</dt>
            <dd>{{ getQuestProgress(quest.id).totalQuestions }}</dd>
          </div>
          <div>
            <dt>Пройдено</dt>
            <dd>
              {{ getQuestProgress(quest.id).playedQuestions }} /
              {{ getQuestProgress(quest.id).totalQuestions }}
            </dd>
          </div>
        </dl>
        <footer class="quest-footer">
          <span class="quest-action">Открыть квест →</span>
        </footer>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'

const router = useRouter()
const store = useQuizStore()

const quests = computed(() => store.quests)

function getQuestProgress(questId: string) {
  return store.getQuestProgress(questId)
}

function goToQuest(questId: string) {
  const quest = store.getQuestById(questId)
  if (!quest || quest.rounds.length === 0) {
    router.push({ name: 'quest-root', params: { questId } })
    return
  }
  router.push({ name: 'quest', params: { questId, roundId: quest.rounds[0].id } })
}
</script>

<style scoped>
.quests-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 2rem;
  color: #fff;
}

.quests-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: clamp(2.5rem, 4vw, 3.25rem);
  margin: 0;
  color: #22d3ee;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
}

.admin-link {
  background: #475569;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: background 0.2s ease;
}

.admin-link:hover {
  background: #64748b;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #94a3b8;
}

.create-link {
  display: inline-block;
  margin-top: 1rem;
  color: #22d3ee;
  text-decoration: none;
  font-size: 1.125rem;
}

.create-link:hover {
  text-decoration: underline;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.quest-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.quest-card:hover {
  transform: translateY(-4px);
  border-color: #22d3ee;
  box-shadow: 0 12px 32px rgba(34, 211, 238, 0.2);
}

.quest-card__header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #22d3ee;
}

.quest-description {
  margin: 0.5rem 0 0;
  color: #cbd5f5;
  font-size: 0.95rem;
}

.quest-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.quest-stats div {
  background: rgba(36, 54, 84, 0.7);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: center;
}

.quest-stats dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.quest-stats dd {
  margin: 0.25rem 0 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e8f0;
}

.quest-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 0.95rem;
  color: #22d3ee;
}

.quest-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .quests-view {
    padding: 1rem;
  }

  .quests-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .quests-grid {
    grid-template-columns: 1fr;
  }
}
</style>
