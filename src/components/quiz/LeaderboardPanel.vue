<template>
  <section v-if="leaderboardEntries.length" class="quest-leaderboard">
    <div class="leaderboard-card">
      <header class="leaderboard-header">
        <span class="leaderboard-label">Участники</span>
      </header>
      <TransitionGroup name="leaderboard" tag="ul" class="leaderboard-list">
        <li
          v-for="(player, index) in leaderboardEntries"
          :key="player.id"
          class="leaderboard-item-wrap"
          @mouseenter="(e) => setPopoverAnchor(player.id, e.currentTarget as HTMLElement)"
          @mouseleave="clearPopoverAnchor()"
        >
          <div
            :class="[
              'leaderboard-item',
              {
                'leaderboard-item--first': index === 0 && player.score > 0,
                'leaderboard-item--second': index === 1 && player.score > 0,
                'leaderboard-item--third': index === 2 && player.score > 0,
                'leaderboard-item--answered': isPlayerAnswered(player.id)
              }
            ]"
          >
            <span v-if="index === 0 && player.score > 0" class="leaderboard-medal leaderboard-medal--gold">🥇</span>
            <span v-else-if="index === 1 && player.score > 0" class="leaderboard-medal leaderboard-medal--silver">🥈</span>
            <span v-else-if="index === 2 && player.score > 0" class="leaderboard-medal leaderboard-medal--bronze">🥉</span>
            <span class="leaderboard-rank">{{ index + 1 }}</span>
            <span class="leaderboard-avatar" :class="{ 'leaderboard-avatar--placeholder': !player.avatar }">
              <span>{{ player.avatar || player.name.charAt(0).toUpperCase() }}</span>
            </span>
            <div class="leaderboard-info">
              <span class="leaderboard-name">{{ player.name }}</span>
              <span class="leaderboard-score">
                <strong>{{ player.score.toLocaleString('ru-RU') }}</strong>
                <span>баллов</span>
              </span>
            </div>
          </div>
        </li>
      </TransitionGroup>
    </div>
  </section>

  <!-- Мини-окно участника поверх полосы с участниками -->
  <teleport to="body">
    <Transition name="popover">
      <div
        v-if="hoveredPlayer && popoverAnchor"
        class="participant-popover participant-popover--fixed"
        :style="{ left: `${popoverAnchor.left}px`, top: `${popoverAnchor.top}px` }"
        @mouseenter="cancelClearPopoverAnchor()"
        @mouseleave="clearPopoverAnchor()"
      >
        <div class="participant-popover__header">
          <span class="participant-popover__avatar">{{ hoveredPlayer.avatar || hoveredPlayer.name.charAt(0).toUpperCase() }}</span>
          <div class="participant-popover__info">
            <span class="participant-popover__name">{{ hoveredPlayer.name }}</span>
            <span class="participant-popover__score">{{ hoveredPlayer.score.toLocaleString('ru-RU') }} баллов</span>
          </div>
        </div>
        <div class="participant-popover__actions">
          <p class="participant-popover__label">Шаг (кратно 5):</p>
          <div class="participant-popover__step-select">
            <button
              v-for="step in STEP_OPTIONS"
              :key="step"
              type="button"
              class="participant-popover__btn participant-popover__btn--step"
              :class="{ 'participant-popover__btn--step-active': selectedStep === step }"
              :disabled="hoveredPlayer.score < step"
              @click.stop="selectedStep = step"
            >{{ step }}</button>
          </div>
          <p class="participant-popover__sublabel participant-popover__sublabel--minus">Отнять баллы</p>
          <button
            type="button"
            class="participant-popover__btn participant-popover__btn--subtract"
            :disabled="hoveredPlayer.score < selectedStep"
            @click.stop="subtractScore(hoveredPlayer.id)"
          >
            <span class="participant-popover__btn-icon">−</span> Отнять {{ selectedStep }} баллов
          </button>
          <p class="participant-popover__sublabel participant-popover__sublabel--plus">Прибавить баллы</p>
          <button
            type="button"
            class="participant-popover__btn participant-popover__btn--add"
            @click.stop="addScore(hoveredPlayer.id)"
          >
            <span class="participant-popover__btn-icon">+</span> Прибавить {{ selectedStep }} баллов
          </button>
          <p class="participant-popover__label">Задать баллы вручную:</p>
          <div class="participant-popover__manual">
            <input
              v-model.number="manualScoreInput"
              type="number"
              min="0"
              step="5"
              class="participant-popover__input"
              placeholder="0"
              @keydown.enter="handleApplyClick()"
            />
            <button type="button" class="participant-popover__btn participant-popover__btn--apply" @click.stop="handleApplyClick()">Применить</button>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { useLeaderboard } from '@/composables/useLeaderboard'
import type { GameSession } from '@/types'

const props = defineProps<{
  session: GameSession | undefined
}>()

const {
  leaderboardEntries,
  hoveredPlayer,
  popoverAnchor,
  manualScoreInput,
  selectedStep,
  STEP_OPTIONS,
  setPopoverAnchor,
  clearPopoverAnchor,
  cancelClearPopoverAnchor,
  subtractScore,
  addScore,
  handleApplyClick
} = useLeaderboard(() => props.session)

/** Игрок «ответил» — подсветка карточки (нажал кнопку/в очереди/текущий отвечающий). */
function isPlayerAnswered(playerId: string): boolean {
  const s = props.session
  if (!s) return false
  const player = s.players.find(p => p.id === playerId)
  if (!player) return false
  if (player.status === 'buzzed' || player.status === 'queued' || player.status === 'locked') return true
  if (s.activeQuestion?.buzzedOrder?.includes(playerId)) return true
  if (s.activeQuestion?.currentResponderId === playerId) return true
  return false
}
</script>

<style scoped>
.quest-leaderboard {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.leaderboard-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgb(var(--c-text-muted) / 0.8);
}

.leaderboard-card {
  background: rgb(var(--c-bg) / 0.3);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  box-shadow:
    0 8px 32px rgb(var(--c-bg-deep) / 0.3),
    0 4px 16px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.1),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.leaderboard-list {
  margin: 0;
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0.25rem 1rem 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-accent-sky) / 0.4) transparent;
  width: 100%;
  max-width: 100%;
  max-height: none;
  flex-wrap: nowrap;
  box-sizing: border-box;
}

.leaderboard-list::after {
  content: '';
  flex: 0 0 auto;
  width: 0;
}

.leaderboard-list::-webkit-scrollbar {
  height: 6px;
}

.leaderboard-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.45), rgb(var(--c-indigo) / 0.45));
  border-radius: 999px;
}

.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.6), rgb(var(--c-indigo) / 0.55));
}

.leaderboard-list::-webkit-scrollbar-track {
  background: transparent;
}

.leaderboard-item-wrap {
  position: relative;
  flex: 0 0 calc((100% - 9 * 0.5rem) / 10);
  width: calc((100% - 9 * 0.5rem) / 10);
  max-width: calc((100% - 9 * 0.5rem) / 10);
  min-width: 0;
  flex-shrink: 0;
  list-style: none;
}

.leaderboard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.65rem 0.4rem;
  border-radius: 16px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg) / 0.7);
  box-shadow:
    0 3px 6px rgb(var(--c-bg-deep) / 0.2),
    0 2px 3px rgb(var(--c-bg-deep) / 0.15),
    inset 0 2px 4px rgb(var(--c-white) / 0.1),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  /* без transform і backdrop-filter — усуває фіолетовий артефакт при скролі */
}

.leaderboard-item::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgb(var(--c-white) / 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.leaderboard-item:hover::before {
  opacity: 1;
}

.leaderboard-item--answered:hover::before {
  opacity: 0;
}

.leaderboard-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgb(var(--c-white) / 0.08) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.04) 100%
  );
  border-radius: 16px;
  pointer-events: none;
  opacity: 0.5;
}

.leaderboard-medal {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  font-size: 1.6rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgb(var(--c-black) / 0.3));
  z-index: 2;
  animation: medalGlow 2s ease-in-out infinite;
}

@keyframes medalGlow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 1px 2px rgb(var(--c-black) / 0.3));
  }
  50% {
    transform: scale(1.02);
    filter: drop-shadow(0 1px 3px rgb(var(--c-black) / 0.4));
  }
}

.leaderboard-medal--gold {
  filter: drop-shadow(0 1px 2px rgb(var(--c-gold) / 0.3)) drop-shadow(0 0 2px rgb(var(--c-gold) / 0.15));
  animation: medalGlowGold 2s ease-in-out infinite;
}

@keyframes medalGlowGold {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 1px 2px rgb(var(--c-gold) / 0.3)) drop-shadow(0 0 2px rgb(var(--c-gold) / 0.15));
  }
  50% {
    transform: scale(1.01);
    filter: drop-shadow(0 1px 2px rgb(var(--c-gold) / 0.35)) drop-shadow(0 0 3px rgb(var(--c-gold) / 0.2));
  }
}

.leaderboard-medal--silver {
  filter: drop-shadow(0 1px 2px rgb(var(--c-slate-300) / 0.3)) drop-shadow(0 0 2px rgb(var(--c-slate-300) / 0.15));
}

.leaderboard-medal--bronze {
  filter: drop-shadow(0 1px 2px rgb(var(--c-bronze) / 0.3)) drop-shadow(0 0 2px rgb(var(--c-bronze) / 0.15));
}

.leaderboard-item--first {
  border-color: rgb(var(--c-gold) / 0.7);
  background: linear-gradient(135deg, rgb(var(--c-gold) / 0.15), rgb(var(--c-bg) / 0.85));
  box-shadow:
    0 3px 6px rgb(var(--c-gold) / 0.12),
    0 2px 3px rgb(var(--c-gold) / 0.1),
    0 1px 2px rgb(var(--c-gold) / 0.06),
    0 0 3px rgb(var(--c-gold) / 0.08),
    inset 0 3px 6px rgb(var(--c-white) / 0.25),
    inset 0 -3px 6px rgb(var(--c-black) / 0.25),
    inset 0 1px 0 rgb(var(--c-white) / 0.3);
}

.leaderboard-item--first::after {
  background: linear-gradient(
    135deg,
    rgb(var(--c-gold) / 0.12) 0%,
    transparent 50%,
    rgb(var(--c-gold) / 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-item--second {
  border-color: rgb(var(--c-slate-300) / 0.6);
  background: linear-gradient(135deg, rgb(var(--c-slate-300) / 0.12), rgb(var(--c-bg) / 0.8));
  box-shadow:
    0 3px 6px rgb(var(--c-slate-300) / 0.12),
    0 2px 3px rgb(var(--c-slate-300) / 0.1),
    0 1px 2px rgb(var(--c-slate-300) / 0.06),
    0 0 3px rgb(var(--c-slate-300) / 0.08),
    inset 0 2px 4px rgb(var(--c-white) / 0.2),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.25);
}

.leaderboard-item--second::after {
  background: linear-gradient(
    135deg,
    rgb(var(--c-slate-300) / 0.12) 0%,
    transparent 50%,
    rgb(var(--c-slate-300) / 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-item--third {
  border-color: rgb(var(--c-bronze) / 0.6);
  background: linear-gradient(135deg, rgb(var(--c-bronze) / 0.12), rgb(var(--c-bg) / 0.8));
  box-shadow:
    0 3px 6px rgb(var(--c-bronze) / 0.12),
    0 2px 3px rgb(var(--c-bronze) / 0.1),
    0 1px 2px rgb(var(--c-bronze) / 0.06),
    0 0 3px rgb(var(--c-bronze) / 0.08),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.2);
}

.leaderboard-item--third::after {
  background: linear-gradient(
    135deg,
    rgb(var(--c-bronze) / 0.12) 0%,
    transparent 50%,
    rgb(var(--c-bronze) / 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-rank {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--c-text-soft) / 0.8);
}

.leaderboard-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgb(var(--c-accent-sky) / 0.4);
  background: rgb(var(--c-bg-deep) / 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: rgb(var(--c-text));
  position: relative;
  z-index: 1;
  box-shadow:
    inset 0 1px 2px rgb(var(--c-white) / 0.1),
    0 2px 4px rgb(var(--c-black) / 0.3);
}

.leaderboard-avatar--placeholder {
  border-style: dashed;
  color: rgb(var(--c-text-muted) / 0.8);
}

.leaderboard-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  z-index: 1;
}

.leaderboard-name {
  font-size: 0.82rem;
  font-weight: 600;
}

.leaderboard-score {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: rgb(var(--c-text-muted) / 0.85);
  letter-spacing: 0.02em;
}

.leaderboard-score strong {
  font-size: 0.95rem;
  color: rgb(var(--c-text));
  letter-spacing: 0.03em;
}

.leaderboard-enter-active,
.leaderboard-leave-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.leaderboard-enter-from,
.leaderboard-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.leaderboard-move {
  transition: transform 0.6s ease;
}

/* Мини-окно при наведении на участника — поверх полосы с участниками */
.participant-popover {
  min-width: 220px;
  z-index: 500;
  background: linear-gradient(165deg, rgb(var(--c-surface) / 0.98), rgb(var(--c-bg) / 0.98));
  border: 1px solid rgb(var(--c-accent-sky) / 0.35);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow:
    0 12px 40px rgb(var(--c-black) / 0.4),
    0 4px 16px rgb(var(--c-accent-sky) / 0.15),
    inset 0 1px 0 rgb(var(--c-white) / 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
}

.participant-popover--fixed {
  position: fixed;
  transform: translate(-50%, calc(-100% - 10px));
  left: 0;
  top: 0;
}

.participant-popover__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgb(var(--c-text-muted) / 0.2);
}

.participant-popover__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(var(--c-bg) / 0.9);
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.participant-popover__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.participant-popover__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-popover__score {
  font-size: 0.8rem;
  color: rgb(var(--c-accent));
  font-weight: 600;
}

.participant-popover__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.participant-popover__label {
  margin: 0;
  font-size: 0.7rem;
  color: rgb(var(--c-text-muted) / 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.participant-popover__sublabel {
  margin: 0.25rem 0 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.participant-popover__sublabel--minus {
  color: rgb(var(--c-danger-light));
}

.participant-popover__sublabel--plus {
  color: rgb(var(--c-success-mid));
}

.participant-popover__btn-icon {
  display: inline-block;
  min-width: 1.1em;
  font-weight: 800;
  opacity: 0.95;
}

.participant-popover__step-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.participant-popover__btn--step {
  min-width: 2.5rem;
}

.participant-popover__btn--step-active {
  background: rgb(var(--c-accent-sky) / 0.35);
  border-color: rgb(var(--c-accent-sky) / 0.85);
  color: rgb(var(--c-accent));
  box-shadow: 0 0 0 2px rgb(var(--c-accent-sky) / 0.35);
  font-weight: 700;
}

.participant-popover__btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-bg) / 0.8);
  color: rgb(var(--c-text-soft));
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.participant-popover__btn:hover:not(:disabled) {
  background: rgb(var(--c-accent-sky) / 0.2);
  border-color: rgb(var(--c-accent-sky) / 0.5);
}

.participant-popover__btn--subtract {
  width: 100%;
  margin-top: 0.15rem;
  background: rgb(var(--c-danger) / 0.25);
  border-color: rgb(var(--c-danger) / 0.6);
  color: #fecaca;
}

.participant-popover__btn--subtract:hover:not(:disabled) {
  background: rgb(var(--c-danger) / 0.35);
  border-color: rgb(var(--c-danger) / 0.8);
}

.participant-popover__btn--add {
  width: 100%;
  margin-top: 0.15rem;
  background: rgb(var(--c-success) / 0.25);
  border-color: rgb(var(--c-success) / 0.6);
  color: rgb(var(--c-success-light));
}

.participant-popover__btn--add:hover:not(:disabled) {
  background: rgb(var(--c-success) / 0.4);
  border-color: rgb(var(--c-success) / 0.85);
}

.participant-popover__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.participant-popover__btn--apply {
  background: rgb(var(--c-accent) / 0.2);
  color: rgb(var(--c-accent));
}

.participant-popover__btn--apply:hover {
  background: rgb(var(--c-accent) / 0.3);
}

.participant-popover__manual {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.participant-popover__input {
  width: 72px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  border-radius: 8px;
  background: rgb(var(--c-bg) / 0.8);
  color: rgb(var(--c-text));
  -moz-appearance: textfield;
  box-sizing: border-box;
}

.participant-popover__input:focus {
  outline: none;
  border-color: rgb(var(--c-accent-sky) / 0.6);
  box-shadow: 0 0 0 2px rgb(var(--c-accent-sky) / 0.2);
}

.participant-popover__input::-webkit-inner-spin-button,
.participant-popover__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-100% - 14px));
}
</style>
