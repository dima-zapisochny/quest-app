<template>
  <div class="illu">
    <!-- ЗАПУСК ИГРЫ: кнопка «Создать игру» → появляется код -->
    <div v-if="scene === 'start'" class="scene scene--start">
      <div class="s-btn"><span class="s-btn__cursor" aria-hidden="true"></span>Create game</div>
      <div class="s-arrow" aria-hidden="true">↓</div>
      <div class="s-code">
        <span v-for="(ch, i) in ['R','7','K','2']" :key="i" class="s-code__ch" :style="{ '--i': i }">{{ ch }}</span>
      </div>
    </div>

    <!-- ИГРОКИ ПОДКЛЮЧАЮТСЯ: телефон вводит код → аватар влетает в список -->
    <div v-else-if="scene === 'join'" class="scene scene--join">
      <div class="s-phone">
        <div class="s-phone__notch"></div>
        <div class="s-phone__code">R7K2</div>
        <div class="s-phone__btn">Join</div>
      </div>
      <div class="s-players">
        <div v-for="n in 3" :key="n" class="s-player" :style="{ '--i': n }">
          <span class="s-player__ava">{{ ['🦊','🐼','🐯'][n - 1] }}</span>
          <span class="s-player__bar"></span>
        </div>
      </div>
    </div>

    <!-- ОТКРЫВАЙТЕ ВОПРОСЫ: тап по плитке → раскрытие -->
    <div v-else-if="scene === 'open'" class="scene scene--open">
      <div class="s-board">
        <div v-for="n in 9" :key="n" class="s-cell" :class="{ 's-cell--tap': n === 5 }">
          {{ (((n - 1) % 3) + 1) * 100 }}
          <span v-if="n === 5" class="s-cell__cursor" aria-hidden="true"></span>
        </div>
      </div>
      <div class="s-reveal">?</div>
    </div>

    <!-- КТО БЫСТРЕЕ: баззер с волнами + бейдж «1st» -->
    <div v-else-if="scene === 'buzz'" class="scene scene--buzz">
      <div class="s-buzzer">
        <span class="s-ring"></span>
        <span class="s-ring s-ring--2"></span>
        <span class="s-buzzer__bolt">⚡</span>
      </div>
      <div class="s-first">1st!</div>
    </div>

    <!-- СЧИТАЙТЕ ОЧКИ: ✓ нажимается, +100 всплывает -->
    <div v-else-if="scene === 'score'" class="scene scene--score">
      <div class="s-marks">
        <span class="s-mark s-mark--ok">✓</span>
        <span class="s-mark s-mark--no">✕</span>
      </div>
      <div class="s-score">
        <span class="s-score__val">100</span>
        <span class="s-score__plus">+100</span>
      </div>
    </div>

    <!-- НОВЫЙ КВЕСТ: пунктирная карточка с «+» -->
    <div v-else-if="scene === 'new'" class="scene scene--new">
      <div class="s-newcard">
        <span class="s-newcard__plus">+</span>
        <span class="s-newcard__label">New quest</span>
        <span class="s-newcard__cursor" aria-hidden="true"></span>
      </div>
    </div>

    <!-- ЗАДАЙТЕ ДОСКУ: сетка заполняется по диагонали -->
    <div v-else-if="scene === 'board'" class="scene scene--board">
      <div class="s-grid-head">
        <span v-for="c in 5" :key="c" class="s-grid-h" :style="{ '--i': c }"></span>
      </div>
      <div class="s-grid">
        <span
          v-for="cell in gridCells"
          :key="cell.k"
          class="s-grid-c"
          :style="{ '--d': cell.c + cell.r }"
        ></span>
      </div>
      <div class="s-grid-label">5 × 5</div>
    </div>

    <!-- ЗАПОЛНИТЕ ВОПРОСЫ: карточка с «печатающимися» строками -->
    <div v-else-if="scene === 'fill'" class="scene scene--fill">
      <div class="s-qcard">
        <div class="s-qcard__row">
          <span class="s-qcard__tag">Q</span>
          <span class="s-qcard__type s-qcard__type--q"></span>
        </div>
        <div class="s-qcard__row">
          <span class="s-qcard__tag s-qcard__tag--a">A</span>
          <span class="s-qcard__type s-qcard__type--a"></span>
        </div>
        <div class="s-qcard__media">
          <span>🖼️</span><span>🎵</span>
        </div>
      </div>
    </div>

    <!-- ГОТОВО: спиннер → зелёная галочка -->
    <div v-else-if="scene === 'done'" class="scene scene--done">
      <div class="s-save">
        <span class="s-save__spin"></span>
        <span class="s-save__check">
          <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
      </div>
      <div class="s-save__label">Saved</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ scene: string }>()

const gridCells = Array.from({ length: 25 }, (_, i) => ({
  k: i,
  c: i % 5,
  r: Math.floor(i / 5)
}))
</script>

<style scoped>
.illu {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

/* ===== START ===== */
.s-btn {
  position: relative;
  padding: 0.85rem 2.2rem;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
  font-weight: 700;
  font-size: 1.05rem;
  animation: s-press 2.6s ease-in-out infinite;
}
.s-btn__cursor {
  position: absolute;
  right: 0.7rem;
  bottom: -0.4rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: rgb(var(--c-white) / 0.9);
  box-shadow: 0 2px 6px rgb(var(--c-black) / 0.4);
  animation: s-tap 2.6s ease-in-out infinite;
}
.s-arrow {
  color: rgb(var(--c-accent-soft));
  font-size: 1.6rem;
  animation: s-bob 2.6s ease-in-out infinite;
}
.s-code {
  display: flex;
  gap: 0.5rem;
}
.s-code__ch {
  width: 2.6rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.6rem;
  font-weight: 800;
  color: rgb(var(--c-accent-soft));
  background: rgb(var(--c-accent-sky) / 0.14);
  border: 1px solid rgb(var(--c-accent-sky) / 0.4);
  opacity: 0;
  transform: translateY(10px) scale(0.7);
  animation: s-pop 2.6s ease-in-out infinite;
  animation-delay: calc(1.1s + var(--i) * 0.12s);
}
@keyframes s-press { 0%,40%,100%{transform:scale(1)} 46%{transform:scale(0.94)} 52%{transform:scale(1)} }
@keyframes s-tap { 0%,40%,100%{transform:translate(0,0);opacity:1} 46%{transform:translate(-0.2rem,-0.3rem)} 60%,99%{opacity:0} }
@keyframes s-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
@keyframes s-pop { 0%,40%{opacity:0;transform:translateY(10px) scale(0.7)} 55%,92%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:scale(0.9)} }

/* ===== JOIN ===== */
.scene--join { flex-direction: row; gap: 2rem; }
.s-phone {
  width: 92px;
  height: 170px;
  border-radius: 20px;
  border: 2px solid rgb(var(--c-accent-sky) / 0.4);
  background: rgb(var(--c-bg) / 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 1.1rem 0.5rem 0.7rem;
  position: relative;
}
.s-phone__notch { width: 34px; height: 5px; border-radius: 3px; background: rgb(var(--c-accent-sky) / 0.35); }
.s-phone__code {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: rgb(var(--c-text));
  border-bottom: 2px solid rgb(var(--c-accent-sky) / 0.5);
  padding-bottom: 0.2rem;
  overflow: hidden;
  white-space: nowrap;
  animation: s-typecode 3s steps(4) infinite;
}
.s-phone__btn {
  margin-top: auto;
  padding: 0.35rem 1.1rem;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, rgb(var(--c-violet)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
  font-size: 0.8rem;
  font-weight: 700;
  animation: s-press 3s ease-in-out infinite;
}
.s-players { display: flex; flex-direction: column; gap: 0.55rem; }
.s-player {
  display: flex; align-items: center; gap: 0.5rem;
  opacity: 0;
  transform: translateX(20px);
  animation: s-slidein 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.35s);
}
.s-player__ava {
  width: 2rem; height: 2rem; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1rem;
  background: rgb(var(--c-accent-sky) / 0.16);
  border: 1px solid rgb(var(--c-accent-sky) / 0.4);
}
.s-player__bar { width: 70px; height: 0.7rem; border-radius: 6px; background: rgb(var(--c-text-soft) / 0.2); }
@keyframes s-typecode { 0%{width:0} 60%,100%{width:4ch} }
@keyframes s-slidein { 0%,20%{opacity:0;transform:translateX(20px)} 45%,92%{opacity:1;transform:translateX(0)} 100%{opacity:0} }

/* ===== OPEN ===== */
.s-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.s-cell {
  position: relative;
  width: 62px; height: 46px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  color: rgb(var(--c-indigo-100));
  background: linear-gradient(135deg, rgb(var(--c-blue) / 0.35), rgb(var(--c-violet) / 0.3));
  border: 1px solid rgb(var(--c-indigo) / 0.5);
}
.s-cell--tap { animation: s-cellpop 2.8s ease-in-out infinite; z-index: 2; }
.s-cell__cursor {
  position: absolute; right: -0.3rem; bottom: -0.3rem;
  width: 1rem; height: 1rem; border-radius: 50%;
  background: rgb(var(--c-white) / 0.9);
  box-shadow: 0 2px 6px rgb(var(--c-black) / 0.4);
  animation: s-tap 2.8s ease-in-out infinite;
}
.s-reveal {
  width: 200px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  font-size: 1.4rem; font-weight: 800;
  color: rgb(var(--c-accent-soft));
  background: rgb(var(--c-accent-sky) / 0.14);
  border: 1px solid rgb(var(--c-accent-sky) / 0.4);
  opacity: 0; transform: scaleX(0.4);
  animation: s-reveal 2.8s ease-in-out infinite;
}
@keyframes s-cellpop { 0%,40%,100%{transform:scale(1)} 50%{transform:scale(1.12)} 60%{transform:scale(1.05)} }
@keyframes s-reveal { 0%,45%{opacity:0;transform:scaleX(0.4)} 60%,92%{opacity:1;transform:scaleX(1)} 100%{opacity:0} }

/* ===== BUZZ ===== */
.s-buzzer {
  position: relative;
  width: 110px; height: 110px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 40% 35%, rgb(var(--c-accent-sky)), rgb(var(--c-blue)));
  box-shadow: 0 12px 30px rgb(var(--c-blue) / 0.5);
  animation: s-press 2.4s ease-in-out infinite;
}
.s-buzzer__bolt { font-size: 2.4rem; }
.s-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid rgb(var(--c-accent-sky) / 0.6);
  animation: s-ripple 2.4s ease-out infinite;
}
.s-ring--2 { animation-delay: 0.5s; }
.s-first {
  padding: 0.35rem 1rem; border-radius: var(--radius-pill);
  background: rgb(var(--c-success) / 0.9); color: rgb(var(--c-white));
  font-weight: 800;
  opacity: 0; transform: scale(0.4);
  animation: s-pop2 2.4s ease-in-out infinite;
}
@keyframes s-ripple { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.7);opacity:0} }
@keyframes s-pop2 { 0%,45%{opacity:0;transform:scale(0.4)} 58%,92%{opacity:1;transform:scale(1)} 100%{opacity:0} }

/* ===== SCORE ===== */
.scene--score { flex-direction: row; gap: 2.5rem; }
.s-marks { display: flex; gap: 0.75rem; }
.s-mark {
  width: 3rem; height: 3rem; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 800;
}
.s-mark--ok { color: rgb(var(--c-success)); background: rgb(var(--c-success) / 0.16); border: 1px solid rgb(var(--c-success) / 0.5); animation: s-press 2.4s ease-in-out infinite; }
.s-mark--no { color: rgb(var(--c-danger-soft)); background: rgb(var(--c-danger) / 0.12); border: 1px solid rgb(var(--c-danger) / 0.4); }
.s-score { position: relative; }
.s-score__val {
  font-size: 2.6rem; font-weight: 800; color: rgb(var(--c-text));
  animation: s-bump 2.4s ease-in-out infinite;
}
.s-score__plus {
  position: absolute; top: -0.2rem; right: -2.4rem;
  color: rgb(var(--c-success)); font-weight: 800;
  opacity: 0;
  animation: s-float 2.4s ease-in-out infinite;
}
@keyframes s-bump { 0%,45%,100%{transform:scale(1)} 55%{transform:scale(1.25)} 65%{transform:scale(1)} }
@keyframes s-float { 0%,45%{opacity:0;transform:translateY(0.4rem)} 55%{opacity:1} 85%{opacity:0;transform:translateY(-1.2rem)} 100%{opacity:0} }

/* ===== NEW ===== */
.s-newcard {
  position: relative;
  width: 220px; height: 130px;
  border-radius: 18px;
  border: 2px dashed rgb(var(--c-accent-sky) / 0.5);
  background: rgb(var(--c-accent-sky) / 0.06);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
  animation: s-glow 2.6s ease-in-out infinite;
}
.s-newcard__plus {
  width: 3rem; height: 3rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; color: rgb(var(--c-accent-soft));
  border: 1px dashed rgb(var(--c-accent-sky) / 0.5);
  animation: s-spin-plus 2.6s ease-in-out infinite;
}
.s-newcard__label { color: rgb(var(--c-text-soft) / 0.8); font-weight: 600; }
.s-newcard__cursor {
  position: absolute; right: 40%; bottom: 20%;
  width: 1.1rem; height: 1.1rem; border-radius: 50%;
  background: rgb(var(--c-white) / 0.9); box-shadow: 0 2px 6px rgb(var(--c-black) / 0.4);
  animation: s-tap 2.6s ease-in-out infinite;
}
@keyframes s-glow { 0%,40%,100%{border-color:rgb(var(--c-accent-sky) / 0.5);background:rgb(var(--c-accent-sky) / 0.06)} 55%{border-color:rgb(var(--c-accent-sky) / 0.8);background:rgb(var(--c-accent-sky) / 0.14)} }
@keyframes s-spin-plus { 0%,40%,100%{transform:rotate(0)} 55%{transform:rotate(90deg)} }

/* ===== BOARD ===== */
.s-grid-head { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 190px; }
.s-grid-h { height: 10px; border-radius: 3px; background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent))); opacity: 0.35; animation: s-hl 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.1s); }
.s-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 190px; }
.s-grid-c {
  aspect-ratio: 1; border-radius: 5px;
  background: rgb(var(--c-bg) / 0.5); border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  animation: s-fillcell 3s ease-in-out infinite;
  animation-delay: calc(var(--d) * 0.12s);
}
.s-grid-label { color: rgb(var(--c-accent-soft)); font-weight: 800; font-size: 1.1rem; }
@keyframes s-hl { 0%,30%{opacity:0.35} 55%,92%{opacity:1} 100%{opacity:0.35} }
@keyframes s-fillcell { 0%,25%{background:rgb(var(--c-bg) / 0.5);border-color:rgb(var(--c-accent-sky) / 0.25)} 55%,92%{background:linear-gradient(135deg,rgb(var(--c-accent-sky) / 0.7),rgb(var(--c-accent) / 0.6));border-color:rgb(var(--c-accent) / 0.6)} 100%{background:rgb(var(--c-bg) / 0.5)} }

/* ===== FILL ===== */
.s-qcard {
  width: 240px; padding: 1rem; border-radius: 16px;
  background: rgb(var(--c-bg) / 0.6); border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  display: flex; flex-direction: column; gap: 0.7rem;
}
.s-qcard__row { display: flex; align-items: center; gap: 0.6rem; }
.s-qcard__tag {
  width: 1.6rem; height: 1.6rem; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.85rem;
  color: rgb(var(--c-accent-soft)); background: rgb(var(--c-accent-sky) / 0.16);
}
.s-qcard__tag--a { color: rgb(var(--c-success)); background: rgb(var(--c-success) / 0.16); }
.s-qcard__type { height: 0.8rem; border-radius: 6px; background: rgb(var(--c-text-soft) / 0.6); width: 0; }
.s-qcard__type--q { animation: s-typing 3s ease-in-out infinite; }
.s-qcard__type--a { animation: s-typing 3s ease-in-out infinite; animation-delay: 1.1s; background: rgb(var(--c-success) / 0.7); }
.s-qcard__media { display: flex; gap: 0.5rem; font-size: 1.1rem; opacity: 0.7; }
@keyframes s-typing { 0%,10%{width:0} 45%,92%{width:150px} 100%{width:150px} }

/* ===== DONE ===== */
.s-save {
  position: relative; width: 76px; height: 76px;
}
.s-save__spin {
  position: absolute; inset: 0; border-radius: 50%;
  border: 4px solid rgb(var(--c-text-muted) / 0.3);
  border-top-color: rgb(var(--c-accent-sky));
  animation: s-rot 0.8s linear infinite, s-hidespin 2.8s ease-in-out infinite;
}
.s-save__check {
  position: absolute; inset: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--c-success)); color: rgb(var(--c-white));
  opacity: 0; transform: scale(0.5);
  animation: s-showcheck 2.8s ease-in-out infinite;
}
.s-save__check svg { width: 40px; height: 40px; }
.s-save__label {
  color: rgb(var(--c-success)); font-weight: 700;
  opacity: 0; animation: s-showcheck 2.8s ease-in-out infinite;
}
@keyframes s-rot { to { transform: rotate(360deg); } }
@keyframes s-hidespin { 0%,45%{opacity:1} 55%,100%{opacity:0} }
@keyframes s-showcheck { 0%,50%{opacity:0;transform:scale(0.5)} 62%,92%{opacity:1;transform:scale(1)} 100%{opacity:0} }

@media (max-width: 560px) {
  .scene--join, .scene--score { flex-direction: column; gap: 1.2rem; }
}
</style>
