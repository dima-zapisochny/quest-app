<template>
  <div class="illu">
    <!-- ЗАПУСК ИГРЫ -->
    <div v-if="scene === 'start'" class="scene scene--start">
      <div class="panel panel--start">
        <div class="startcard__label">Name</div>
        <div class="startcard__idrow">
          <span class="startcard__field"><span class="startcard__name">Alex</span><span class="caret caret--name" aria-hidden="true"></span></span>
          <span class="startcard__ava">🦊</span>
        </div>
        <button class="startcard__create"><span>Create game</span><span class="cursor cursor--start" aria-hidden="true"></span></button>
        <div class="startcard__or"><span></span>or<span></span></div>
        <div class="startcard__join">
          <span class="startcard__code">CODE</span>
          <span class="startcard__joinbtn">Join</span>
        </div>
      </div>
      <div class="arrow">↓</div>
      <div class="codewrap">
        <span class="codewrap__label">Game code</span>
        <div class="code">
          <span v-for="(ch, i) in ['R','7','K','2']" :key="i" class="code__ch" :style="{ '--i': i }">{{ ch }}</span>
        </div>
      </div>
    </div>

    <!-- ИГРОКИ ПОДКЛЮЧАЮТСЯ -->
    <div v-else-if="scene === 'join'" class="scene scene--row">
      <div class="phone">
        <div class="phone__notch"></div>
        <div class="phone__title">Join game</div>
        <div class="phone__field"><span class="phone__code">R7K2</span><span class="caret"></span></div>
        <div class="phone__btn">Join</div>
      </div>
      <div class="players">
        <div class="players__head">Participants <span class="players__count">3</span></div>
        <div v-for="n in 3" :key="n" class="player" :style="{ '--i': n }">
          <span class="player__ava">{{ ['🦊','🐼','🐯'][n - 1] }}</span>
          <span class="player__name">{{ ['Alex', 'Max', 'Nina'][n - 1] }}</span>
        </div>
      </div>
    </div>

    <!-- ОТКРЫВАЙТЕ ВОПРОСЫ -->
    <div v-else-if="scene === 'open'" class="scene">
      <div class="board">
        <div class="board__heads">
          <span v-for="c in 4" :key="c" class="head" :style="{ '--c': c }"></span>
        </div>
        <div class="board__grid">
          <button
            v-for="n in 12"
            :key="n"
            class="tile"
            :class="{ 'tile--tap': n === 6 }"
          >{{ (Math.floor((n - 1) / 4) + 1) * 100 }}<span v-if="n === 6" class="cursor cursor--tile" aria-hidden="true"></span></button>
        </div>
      </div>
      <div class="qstrip">
        <span class="qstrip__q">?</span>
        <span class="qstrip__line"></span>
      </div>
    </div>

    <!-- КТО БЫСТРЕЕ -->
    <div v-else-if="scene === 'buzz'" class="scene scene--row scene--buzz">
      <div class="racer racer--win">
        <span class="racer__crown">👑</span>
        <span class="racer__ava">🦊</span>
        <span class="racer__name">Alex</span>
        <span class="racer__pts">300</span>
        <span class="racer__badge">1st</span>
      </div>
      <div class="buzzer">
        <span class="ring"></span><span class="ring ring--2"></span><span class="ring ring--3"></span>
        <span class="buzzer__bolt">⚡</span>
        <span class="cursor cursor--buzz" aria-hidden="true"></span>
      </div>
      <div class="racer racer--lose">
        <span class="racer__ava racer__ava--dim">🐼</span>
        <span class="racer__name racer__name--dim">Max</span>
        <span class="racer__pts racer__pts--dim">200</span>
      </div>
    </div>

    <!-- СЧИТАЙТЕ ОЧКИ -->
    <div v-else-if="scene === 'score'" class="scene scene--score">
      <div class="marks">
        <span class="mark mark--ok">✓</span>
        <span class="mark mark--no">✕</span>
      </div>
      <div class="lboard">
        <div
          v-for="(p, i) in [
            { medal: '🥇', ava: '🦊', name: 'Alex', score: 300, w: 100, lead: true },
            { medal: '🥈', ava: '🐼', name: 'Max', score: 200, w: 66, lead: false },
            { medal: '🥉', ava: '🐯', name: 'Nina', score: 100, w: 33, lead: false },
          ]"
          :key="p.name"
          class="lbrow"
          :class="{ 'lbrow--lead': p.lead }"
          :style="{ '--i': i }"
        >
          <span class="lbrow__rank">{{ p.medal }}</span>
          <span class="lbrow__ava">{{ p.ava }}</span>
          <span class="lbrow__name">{{ p.name }}</span>
          <span class="lbrow__bar"><span class="lbrow__fill" :style="{ width: p.w + '%' }"></span></span>
          <span class="lbrow__score">{{ p.score }}</span>
          <span v-if="p.lead" class="lbrow__plus">+100</span>
        </div>
      </div>
    </div>

    <!-- НОВЫЙ КВЕСТ -->
    <div v-else-if="scene === 'new'" class="scene">
      <div class="questlist">
        <div class="qcard qcard--saved">
          <span class="qcard__cover"><span class="qcard__emoji">🎬</span></span>
          <span class="qcard__title">Movie Night</span>
          <span class="qcard__sub">12 questions · 3 rounds</span>
        </div>
        <div class="qcard qcard--new">
          <span class="qcard__plus">+</span>
          <span class="qcard__newlabel">New quest</span>
        </div>
        <span class="cursor questcursor" aria-hidden="true"></span>
      </div>
    </div>

    <!-- ЗАДАЙТЕ ДОСКУ -->
    <div v-else-if="scene === 'board'" class="scene">
      <div class="gridhead">
        <span v-for="c in 5" :key="c" class="gridhead__h" :style="{ '--i': c }"></span>
      </div>
      <div class="grid">
        <span
          v-for="cell in gridCells"
          :key="cell.k"
          class="grid__c"
          :style="{ '--d': cell.c + cell.r }"
        ></span>
      </div>
      <div class="gridlabel">5 × 5 · 25</div>
    </div>

    <!-- ЗАПОЛНИТЕ ВОПРОСЫ -->
    <div v-else-if="scene === 'fill'" class="scene">
      <div class="qmodal">
        <div class="qmodal__head">
          <span class="qmodal__title">200 pts</span>
          <span class="qmodal__x">✕</span>
        </div>
        <div class="qmodal__field">
          <span class="qmodal__tag">Q</span>
          <span class="qmodal__input"><span class="type type--q"></span><span class="caret caret--q" aria-hidden="true"></span></span>
        </div>
        <div class="qmodal__field">
          <span class="qmodal__tag qmodal__tag--a">A</span>
          <span class="qmodal__input"><span class="type type--a"></span></span>
        </div>
        <div class="qmodal__media">
          <span class="mediachip"><span>🖼️</span>Image</span>
          <span class="mediachip"><span>🎵</span>Audio</span>
        </div>
      </div>
    </div>

    <!-- ГОТОВО -->
    <div v-else-if="scene === 'done'" class="scene">
      <div class="save">
        <span class="save__spin"></span>
        <span class="save__check">
          <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span class="save__spark save__spark--1">✦</span>
        <span class="save__spark save__spark--2">✦</span>
      </div>
      <div class="save__label">Saved</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ scene: string }>()
const gridCells = Array.from({ length: 25 }, (_, i) => ({ k: i, c: i % 5, r: Math.floor(i / 5) }))
</script>

<style scoped>
.illu { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.illu > .scene { transform: scale(1.15); }
.scene { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.1rem; width: 100%; }
.scene--row { flex-direction: row; gap: 2.2rem; }
.scene--start { gap: 0.6rem; }

.cursor {
  position: absolute; width: 1.05rem; height: 1.05rem; border-radius: 50% 50% 50% 2px;
  background: rgb(var(--c-white) / 0.92);
  box-shadow: 0 3px 8px rgb(var(--c-black) / 0.45);
}

/* панель-мокап */
.panel {
  border-radius: 16px; padding: 0.8rem;
  background: rgb(var(--c-bg) / 0.6);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  box-shadow: 0 14px 30px rgb(var(--c-bg-deep) / 0.4);
  display: flex; flex-direction: column; gap: 0.7rem; align-items: center;
}
/* START — мокап карточки лендинга (компактный) */
.panel--start { width: 246px; gap: 0.55rem; padding: 0.85rem; }
.startcard__label { align-self: flex-start; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(var(--c-text-muted) / 0.7); }
.startcard__idrow { display: flex; align-items: center; gap: 0.5rem; width: 100%; box-sizing: border-box; }
.startcard__field { flex: 1; height: 1.65rem; border-radius: 9px; background: rgb(var(--c-bg) / 0.55); border: 1px solid rgb(var(--c-accent-sky) / 0.22); display: flex; align-items: center; gap: 1px; padding: 0 0.55rem; overflow: hidden; box-sizing: border-box; }
.startcard__name { display: inline-block; max-width: 0; overflow: hidden; white-space: nowrap; font-size: 0.82rem; font-weight: 700; color: rgb(var(--c-text)); animation: typename 3.2s ease-in-out infinite; }
.caret--name { flex-shrink: 0; height: 0.9rem; background: rgb(var(--c-accent-soft)); }
@keyframes typename { 0%,4% { max-width: 0; } 40%,82% { max-width: 3.4ch; } 96%,100% { max-width: 0; } }
.startcard__ava { flex-shrink: 0; width: 1.65rem; height: 1.65rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; background: rgb(var(--c-accent-sky) / 0.14); border: 1px solid rgb(var(--c-accent-sky) / 0.4); }
.startcard__create {
  position: relative; width: 100%; padding: 0.42rem; border: none; border-radius: var(--radius-pill);
  background: radial-gradient(circle at 25% 25%, rgba(253, 224, 71, 0.6), transparent 55%),
    linear-gradient(135deg, rgb(var(--c-orange-500)), rgb(var(--c-gold)));
  color: rgb(var(--c-bg-deep)); font-weight: 800; font-size: 0.85rem;
  box-shadow: 0 6px 14px rgb(var(--c-orange-500) / 0.4);
  animation: press 2.8s ease-in-out infinite;
}
.cursor--start { right: 0.9rem; bottom: -0.25rem; animation: tap 2.8s ease-in-out infinite; }
.startcard__or { display: flex; align-items: center; gap: 0.5rem; width: 100%; font-size: 0.66rem; color: rgb(var(--c-text-soft) / 0.55); }
.startcard__or span { flex: 1; height: 1px; background: rgb(var(--c-text-soft) / 0.15); }
.startcard__join { display: flex; gap: 0.4rem; width: 100%; }
.startcard__code { flex: 1; padding: 0.35rem; border-radius: 10px; text-align: center; letter-spacing: 0.15em; font-size: 0.68rem; font-weight: 700; color: rgb(var(--c-text-soft) / 0.7); border: 1px solid rgb(var(--c-accent-sky) / 0.25); background: rgb(var(--c-bg) / 0.4); }
.startcard__joinbtn { padding: 0.35rem 0.85rem; border-radius: 10px; font-size: 0.74rem; font-weight: 700; color: rgb(var(--c-bg-deep)); background: linear-gradient(135deg, rgb(244 114 182), rgb(var(--c-violet))); }
.arrow { color: rgb(var(--c-accent-soft)); font-size: 1.15rem; animation: bob 2.8s ease-in-out infinite; }
.codewrap { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
.codewrap__label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(var(--c-text-muted) / 0.7); }
.code { display: flex; gap: 0.4rem; }
.code__ch {
  width: 2rem; height: 2.4rem; display: flex; align-items: center; justify-content: center;
  border-radius: 9px; font-size: 1.25rem; font-weight: 800; color: rgb(var(--c-accent-soft));
  background: rgb(var(--c-accent-sky) / 0.14); border: 1px solid rgb(var(--c-accent-sky) / 0.4);
  box-shadow: inset 0 1px 2px rgb(var(--c-white) / 0.08);
  opacity: 0; transform: translateY(8px) scale(0.7);
  animation: pop 2.8s ease-in-out infinite; animation-delay: calc(1.2s + var(--i) * 0.12s);
}

/* JOIN */
.phone {
  width: 96px; height: 176px; border-radius: 22px;
  border: 2px solid rgb(var(--c-accent-sky) / 0.4); background: rgb(var(--c-bg) / 0.75);
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.1rem 0.55rem 0.7rem;
  box-shadow: 0 14px 30px rgb(var(--c-bg-deep) / 0.5); position: relative;
}
.phone__notch { width: 32px; height: 5px; border-radius: 3px; background: rgb(var(--c-accent-sky) / 0.35); }
.phone__title { font-size: 0.72rem; color: rgb(var(--c-text-soft) / 0.8); margin-top: 0.2rem; font-weight: 600; }
.phone__field { display: flex; align-items: center; gap: 2px; border-bottom: 2px solid rgb(var(--c-accent-sky) / 0.5); padding-bottom: 0.25rem; margin-top: 0.5rem; }
.phone__code { font-size: 0.95rem; font-weight: 800; letter-spacing: 0.16em; color: rgb(var(--c-text)); overflow: hidden; white-space: nowrap; animation: typecode 3s steps(4) infinite; }
.caret { width: 2px; height: 1.1rem; background: rgb(var(--c-accent-sky)); animation: blink 0.8s step-end infinite; }
.phone__btn { margin-top: auto; padding: 0.35rem 1.1rem; border-radius: var(--radius-pill); background: linear-gradient(135deg, rgb(var(--c-violet)), rgb(var(--c-accent-sky))); color: rgb(var(--c-bg)); font-size: 0.78rem; font-weight: 700; animation: press 3s ease-in-out infinite; }
.players { display: flex; flex-direction: column; gap: 0.5rem; }
.players__head { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgb(var(--c-text-muted) / 0.7); display: flex; align-items: center; gap: 0.4rem; }
.players__count { display: inline-flex; align-items: center; justify-content: center; min-width: 1.1rem; height: 1.1rem; padding: 0 0.3rem; border-radius: 999px; background: rgb(var(--c-accent-sky) / 0.2); color: rgb(var(--c-accent-soft)); font-size: 0.66rem; }
.player { display: flex; align-items: center; gap: 0.5rem; opacity: 0; transform: translateX(18px); animation: slidein 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.35s); }
.player__ava { width: 2rem; height: 2rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; background: rgb(var(--c-accent-sky) / 0.16); border: 1px solid rgb(var(--c-accent-sky) / 0.4); }
.player__name { font-size: 0.85rem; font-weight: 700; color: rgb(var(--c-text-soft) / 0.95); }

/* OPEN */
.board { border-radius: 14px; padding: 0.6rem; background: rgb(var(--c-bg-deep) / 0.4); border: 1px solid rgb(var(--c-accent-sky) / 0.15); }
.board__heads { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6px; }
.head { height: 12px; border-radius: 4px; background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.6), rgb(var(--c-blue) / 0.5)); }
.head:nth-child(2) { background: linear-gradient(135deg, rgb(var(--c-violet) / 0.6), rgb(var(--c-indigo-500) / 0.5)); }
.head:nth-child(3) { background: linear-gradient(135deg, rgb(var(--c-accent) / 0.6), rgb(var(--c-accent-sky) / 0.5)); }
.head:nth-child(4) { background: linear-gradient(135deg, rgb(var(--c-blue) / 0.6), rgb(var(--c-violet) / 0.5)); }
.board__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.tile {
  position: relative; width: 54px; height: 36px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-weight: 700; font-size: 0.85rem; color: rgb(var(--c-indigo-100));
  background: linear-gradient(135deg, rgb(var(--c-blue) / 0.32), rgb(var(--c-violet) / 0.28));
  border: 1px solid rgb(var(--c-indigo) / 0.45);
}
.tile--tap { z-index: 2; animation: tilepop 2.8s ease-in-out infinite; }
.cursor--tile { right: -0.3rem; bottom: -0.3rem; animation: tap 2.8s ease-in-out infinite; }
.qstrip { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.9rem; border-radius: 12px; background: rgb(var(--c-accent-sky) / 0.12); border: 1px solid rgb(var(--c-accent-sky) / 0.35); width: 220px; opacity: 0; transform: translateY(6px); animation: revealstrip 2.8s ease-in-out infinite; }
.qstrip__q { font-size: 1.2rem; font-weight: 800; color: rgb(var(--c-accent-soft)); }
.qstrip__line { flex: 1; height: 0.7rem; border-radius: 5px; background: rgb(var(--c-text-soft) / 0.35); }

/* BUZZ */
.scene--buzz { align-items: center; gap: 2.6rem; }
.racer { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; position: relative; }
.racer__crown { font-size: 1.1rem; animation: bob 2.4s ease-in-out infinite; }
.racer__ava { width: 2.6rem; height: 2.6rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1.3rem; background: rgb(var(--c-bg) / 0.6); border: 2px solid rgb(var(--c-accent-sky) / 0.4); }
.racer__name { font-size: 0.72rem; font-weight: 700; color: rgb(var(--c-text-soft) / 0.9); }
.racer__name--dim { color: rgb(var(--c-text-muted) / 0.6); }
.racer__pts { font-size: 0.82rem; font-weight: 800; color: rgb(var(--c-text)); }
.racer--win .racer__pts { color: rgb(var(--c-success)); }
.racer__pts--dim { color: rgb(var(--c-text-muted) / 0.6); }
.racer--win .racer__ava { border-color: rgb(var(--c-success) / 0.7); box-shadow: 0 0 16px rgb(var(--c-success) / 0.5); animation: winpulse 2.4s ease-in-out infinite; }
.racer--win .racer__name { color: rgb(var(--c-success)); }
.racer__badge { position: absolute; top: 1.3rem; right: -0.9rem; padding: 0.05rem 0.4rem; border-radius: 999px; font-size: 0.6rem; font-weight: 800; color: rgb(var(--c-bg-deep)); background: rgb(var(--c-success)); opacity: 0; animation: badgein 2.4s ease-in-out infinite; }
.racer--lose .racer__ava { border-color: rgb(var(--c-text-muted) / 0.3); }
.racer__ava--dim { opacity: 0.5; }
.buzzer {
  position: relative; width: 92px; height: 92px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 38% 32%, rgb(var(--c-violet) / 0.95), rgb(var(--c-indigo-500)));
  box-shadow: inset 0 2px 6px rgb(var(--c-white) / 0.18), 0 10px 24px rgb(var(--c-indigo-500) / 0.4);
  border: 1px solid rgb(var(--c-violet) / 0.5);
  animation: press 2.4s ease-in-out infinite;
}
.buzzer__bolt { font-size: 2rem; filter: drop-shadow(0 2px 4px rgb(var(--c-bg-deep) / 0.4)); animation: boltflash 2.4s ease-in-out infinite; }
.ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgb(var(--c-violet) / 0.6); animation: ripple 2.4s ease-out infinite; }
.ring--2 { animation-delay: 0.35s; }
.ring--3 { animation-delay: 0.7s; }
.cursor--buzz { right: 12%; bottom: 8%; animation: tap 2.4s ease-in-out infinite; }
@keyframes badgein { 0%,50%{opacity:0;transform:scale(0.4)} 60%{opacity:1;transform:scale(1.15)} 70%,92%{opacity:1;transform:scale(1)} 100%{opacity:0} }
@keyframes boltflash { 0%,40%{transform:scale(1)} 48%{transform:scale(1.2)} 56%,100%{transform:scale(1)} }

/* SCORE */
.marks { display: flex; gap: 0.7rem; }
.mark { width: 2.8rem; height: 2.8rem; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 800; }
.mark--ok { color: rgb(var(--c-success)); background: rgb(var(--c-success) / 0.16); border: 1px solid rgb(var(--c-success) / 0.5); animation: press 2.4s ease-in-out infinite; }
.mark--no { color: rgb(var(--c-danger-soft)); background: rgb(var(--c-danger) / 0.12); border: 1px solid rgb(var(--c-danger) / 0.4); }
.scene--score { gap: 1rem; }
.lboard { display: flex; flex-direction: column; gap: 0.45rem; }
.lbrow { position: relative; display: flex; align-items: center; gap: 0.55rem; padding: 0.42rem 0.7rem; border-radius: 12px; width: 300px; box-sizing: border-box; background: rgb(var(--c-bg) / 0.55); border: 1px solid rgb(var(--c-accent-sky) / 0.16); opacity: 0; transform: translateY(8px); animation: rowin 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.3s); }
.lbrow--lead { background: rgb(var(--c-gold) / 0.1); border-color: rgb(var(--c-gold) / 0.4); }
.lbrow__rank { width: 1.3rem; flex-shrink: 0; text-align: center; font-size: 1rem; }
.lbrow__ava { width: 1.75rem; height: 1.75rem; flex-shrink: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; background: rgb(var(--c-accent-sky) / 0.16); border: 1px solid rgb(var(--c-accent-sky) / 0.4); }
.lbrow__name { width: 3rem; flex-shrink: 0; font-size: 0.8rem; font-weight: 700; color: rgb(var(--c-text-soft) / 0.95); white-space: nowrap; overflow: hidden; }
.lbrow__bar { flex: 1; height: 0.5rem; border-radius: 999px; background: rgb(var(--c-text-soft) / 0.14); overflow: hidden; }
.lbrow__fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent))); transform-origin: left; animation: growbar 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.3s + 0.2s); }
.lbrow--lead .lbrow__fill { background: linear-gradient(90deg, rgb(var(--c-orange-500)), rgb(var(--c-gold))); }
.lbrow__score { min-width: 2.1rem; flex-shrink: 0; text-align: right; font-size: 1rem; font-weight: 800; color: rgb(var(--c-text)); }
.lbrow--lead .lbrow__score { animation: bump 2.4s ease-in-out infinite; }
.lbrow__plus { position: absolute; top: -0.5rem; right: 0.7rem; color: rgb(var(--c-success)); font-weight: 800; font-size: 0.82rem; opacity: 0; animation: floatup 2.4s ease-in-out infinite; }
@keyframes rowin { 0%{opacity:0;transform:translateY(8px)} 18%,94%{opacity:1;transform:translateY(0)} 100%{opacity:0} }
@keyframes growbar { 0%,15%{transform:scaleX(0)} 45%,100%{transform:scaleX(1)} }

/* NEW */
.questlist { position: relative; display: flex; align-items: stretch; gap: 0.8rem; }
.qcard { width: 132px; height: 158px; border-radius: 16px; display: flex; flex-direction: column; box-sizing: border-box; }
.qcard--saved { padding: 0.7rem; gap: 0.4rem; background: rgb(var(--c-surface) / 0.7); border: 1px solid rgb(var(--c-accent-sky) / 0.18); animation: savedhi 4.4s ease-in-out infinite; }
.qcard__cover { flex: 1; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; background: linear-gradient(135deg, rgb(var(--c-violet) / 0.35), rgb(var(--c-blue) / 0.35)); }
.qcard__title { font-size: 0.75rem; font-weight: 800; color: rgb(var(--c-text)); white-space: nowrap; overflow: hidden; opacity: 0; animation: qtextin 4.4s ease-in-out infinite; }
.qcard__sub { font-size: 0.56rem; color: rgb(var(--c-text-muted) / 0.85); white-space: nowrap; overflow: hidden; opacity: 0; animation: qtextin 4.4s ease-in-out infinite 0.15s; }
.qcard--new { position: relative; align-items: center; justify-content: center; gap: 0.6rem; border: 2px dashed rgb(var(--c-accent-sky) / 0.5); background: rgb(var(--c-accent-sky) / 0.06); animation: newhi 4.4s ease-in-out infinite; }
.qcard__plus { width: 2.9rem; height: 2.9rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.7rem; color: rgb(var(--c-accent-soft)); border: 1px dashed rgb(var(--c-accent-sky) / 0.6); background: rgb(var(--c-bg) / 0.5); animation: spinplus 4.4s ease-in-out infinite; }
.qcard__newlabel { color: rgb(var(--c-text-soft) / 0.9); font-weight: 700; font-size: 0.9rem; }
.questcursor { left: 50%; top: 50%; animation: questcursor 4.4s ease-in-out infinite; }
@keyframes qtextin { 0%,4%{opacity:0;transform:translateY(4px)} 14%,94%{opacity:1;transform:translateY(0)} 100%{opacity:0} }
@keyframes savedhi { 0%,8%{transform:translateY(0);border-color:rgb(var(--c-accent-sky)/0.18);box-shadow:none} 22%,36%{transform:translateY(-4px);border-color:rgb(var(--c-accent-sky)/0.5);box-shadow:0 10px 22px rgb(var(--c-bg-deep)/0.4)} 48%,100%{transform:translateY(0);border-color:rgb(var(--c-accent-sky)/0.18);box-shadow:none} }
@keyframes newhi { 0%,52%{border-color:rgb(var(--c-accent-sky)/0.5);box-shadow:none} 64%,80%{border-color:rgb(var(--c-accent-sky)/0.9);box-shadow:0 0 0 3px rgb(var(--c-accent-sky)/0.12),0 12px 26px rgb(var(--c-accent-sky)/0.22)} 92%,100%{border-color:rgb(var(--c-accent-sky)/0.5);box-shadow:none} }
@keyframes questcursor {
  0%{transform:translate(-46px,34px) scale(1);opacity:0}
  7%{opacity:1}
  20%{transform:translate(-74px,-4px) scale(1)}
  28%{transform:translate(-74px,2px) scale(0.85)}
  36%{transform:translate(-74px,-4px) scale(1)}
  56%{transform:translate(74px,2px) scale(1)}
  66%{transform:translate(74px,8px) scale(0.82)}
  76%{transform:translate(74px,2px) scale(1)}
  93%{transform:translate(74px,2px) scale(1);opacity:1}
  100%{transform:translate(74px,2px) scale(1);opacity:0}
}

/* BOARD */
.gridhead { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 200px; }
.gridhead__h { height: 11px; border-radius: 4px; background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent))); opacity: 0.35; animation: hl 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.1s); }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 200px; }
.grid__c { aspect-ratio: 1; border-radius: 6px; background: rgb(var(--c-bg) / 0.5); border: 1px solid rgb(var(--c-accent-sky) / 0.25); animation: fillcell 3s ease-in-out infinite; animation-delay: calc(var(--d) * 0.12s); }
.gridlabel { color: rgb(var(--c-accent-soft)); font-weight: 800; font-size: 1.05rem; }

/* FILL */
.qmodal { width: 250px; border-radius: 16px; background: rgb(var(--c-bg) / 0.7); border: 1px solid rgb(var(--c-accent-sky) / 0.25); box-shadow: 0 16px 34px rgb(var(--c-bg-deep) / 0.45); overflow: hidden; }
.qmodal__head { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgb(var(--c-accent-sky) / 0.15); }
.qmodal__title { font-weight: 700; color: rgb(var(--c-text)); font-size: 0.85rem; }
.qmodal__x { color: rgb(var(--c-text-soft) / 0.5); font-size: 0.75rem; }
.qmodal__field { display: flex; align-items: center; gap: 0.55rem; padding: 0.5rem 0.8rem; }
.qmodal__tag { width: 1.5rem; height: 1.5rem; border-radius: 8px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: rgb(var(--c-accent-soft)); background: rgb(var(--c-accent-sky) / 0.16); }
.qmodal__tag--a { color: rgb(var(--c-success)); background: rgb(var(--c-success) / 0.16); }
.qmodal__input { flex: 1; height: 1.6rem; display: flex; align-items: center; gap: 2px; padding: 0 0.55rem; border-radius: 8px; background: rgb(var(--c-bg) / 0.5); border: 1px solid rgb(var(--c-accent-sky) / 0.2); overflow: hidden; }
.type { height: 0.6rem; border-radius: 4px; background: rgb(var(--c-text-soft) / 0.55); width: 0; }
.type--q { animation: typing 3s ease-in-out infinite; }
.type--a { animation: typing 3s ease-in-out infinite 1.1s; background: rgb(var(--c-success) / 0.6); }
.caret--q { flex-shrink: 0; height: 0.85rem; background: rgb(var(--c-accent-soft)); }
.mediachip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; color: rgb(var(--c-text-soft) / 0.85); background: rgb(var(--c-accent-sky) / 0.1); border: 1px solid rgb(var(--c-accent-sky) / 0.22); }
.mediachip span { font-size: 0.85rem; }
.qmodal__media { display: flex; gap: 0.5rem; padding: 0.35rem 0.8rem 0.75rem; }

/* DONE */
.save { position: relative; width: 76px; height: 76px; }
.save__spin { position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgb(var(--c-text-muted) / 0.3); border-top-color: rgb(var(--c-accent-sky)); animation: rot 0.8s linear infinite, hidespin 2.8s ease-in-out infinite; }
.save__check { position: absolute; inset: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgb(var(--c-success)); color: rgb(var(--c-white)); box-shadow: 0 8px 22px rgb(var(--c-success) / 0.5); opacity: 0; transform: scale(0.5); animation: showcheck 2.8s ease-in-out infinite; }
.save__check svg { width: 40px; height: 40px; }
.save__label { color: rgb(var(--c-success)); font-weight: 700; opacity: 0; animation: showcheck 2.8s ease-in-out infinite; }
.save__spark { position: absolute; color: rgb(var(--c-success)); opacity: 0; font-size: 0.9rem; }
.save__spark--1 { top: -0.3rem; right: -0.2rem; animation: sparkle 2.8s ease-in-out infinite 0.6s; }
.save__spark--2 { bottom: 0; left: -0.4rem; animation: sparkle 2.8s ease-in-out infinite 0.75s; }

/* keyframes */
@keyframes press { 0%,40%,100%{transform:scale(1)} 46%{transform:scale(0.94)} 52%{transform:scale(1)} }
@keyframes tap { 0%,40%,100%{transform:translate(0,0);opacity:1} 46%{transform:translate(-0.2rem,-0.3rem)} 62%,99%{opacity:0} }
@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
@keyframes pop { 0%,40%{opacity:0;transform:translateY(8px) scale(0.7)} 55%,92%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:scale(0.9)} }
@keyframes typecode { 0%{width:0} 60%,100%{width:4ch} }
@keyframes blink { 50%{opacity:0} }
@keyframes slidein { 0%,20%{opacity:0;transform:translateX(18px)} 45%,92%{opacity:1;transform:translateX(0)} 100%{opacity:0} }
@keyframes tilepop { 0%,40%,100%{transform:translateY(0) scale(1); box-shadow:none} 52%{transform:translateY(-4px) scale(1.1); box-shadow:0 10px 20px rgb(var(--c-blue)/0.5)} 62%{transform:translateY(-2px) scale(1.05)} }
@keyframes revealstrip { 0%,45%{opacity:0;transform:translateY(6px)} 60%,92%{opacity:1;transform:translateY(0)} 100%{opacity:0} }
@keyframes ripple { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.7);opacity:0} }
@keyframes winpulse { 0%,40%,100%{box-shadow:0 0 16px rgb(var(--c-success)/0.5)} 55%{box-shadow:0 0 26px rgb(var(--c-success)/0.8)} }
@keyframes bump { 0%,45%,100%{transform:scale(1)} 55%{transform:scale(1.28)} 65%{transform:scale(1)} }
@keyframes floatup { 0%,45%{opacity:0;transform:translateY(0.4rem)} 55%{opacity:1} 85%{opacity:0;transform:translateY(-1.3rem)} 100%{opacity:0} }
@keyframes sparkle { 0%,50%{opacity:0;transform:scale(0.4)} 60%{opacity:1;transform:scale(1.2)} 78%,100%{opacity:0;transform:scale(0.6)} }
@keyframes glow { 0%,40%,100%{border-color:rgb(var(--c-accent-sky)/0.5);background:rgb(var(--c-accent-sky)/0.05)} 55%{border-color:rgb(var(--c-accent-sky)/0.85);background:rgb(var(--c-accent-sky)/0.13)} }
@keyframes spinplus { 0%,40%,100%{transform:scale(1)} 55%{transform:scale(1.14)} }
@keyframes hl { 0%,30%{opacity:0.35} 55%,92%{opacity:1} 100%{opacity:0.35} }
@keyframes fillcell { 0%,25%{background:rgb(var(--c-bg)/0.5);border-color:rgb(var(--c-accent-sky)/0.25)} 55%,92%{background:linear-gradient(135deg,rgb(var(--c-accent-sky)/0.7),rgb(var(--c-accent)/0.6));border-color:rgb(var(--c-accent)/0.6)} 100%{background:rgb(var(--c-bg)/0.5)} }
@keyframes typing { 0%,10%{width:0} 45%,92%{width:150px} 100%{width:150px} }
@keyframes rot { to{transform:rotate(360deg)} }
@keyframes hidespin { 0%,45%{opacity:1} 55%,100%{opacity:0} }
@keyframes showcheck { 0%,50%{opacity:0;transform:scale(0.5)} 62%,92%{opacity:1;transform:scale(1)} 100%{opacity:0} }

@media (max-width: 560px) {
  .scene--row { flex-direction: column; gap: 1.2rem; }
  .scene--buzz { flex-direction: row; gap: 1rem; }
}
</style>
