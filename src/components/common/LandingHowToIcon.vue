<template>
  <span class="howto-bulb" aria-hidden="true">
    <svg class="howto-bulb__svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="howtoBulbGlass" x1="7.5" y1="3.5" x2="16.5" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef9c3" />
          <stop offset="50%" stop-color="#facc15" />
          <stop offset="100%" stop-color="#eab308" />
        </linearGradient>

        <path
          id="howtoBulbShape"
          d="M12 3.6c-3.35 0-6.1 2.55-6.1 5.85 0 1.65.68 2.85 1.38 3.75.33.42.58.82.68 1.3h8.08c.1-.48.35-.88.68-1.3.7-.9 1.38-2.1 1.38-3.75 0-3.3-2.75-5.85-6.1-5.85Z"
        />

        <filter id="howtoBulbAuraFar" x="-140%" y="-140%" width="380%" height="380%" color-interpolation-filters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.7" result="innerEdge" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.35" result="outerEdge" />
          <feComposite in="outerEdge" in2="innerEdge" operator="out" result="ring" />
          <feGaussianBlur in="ring" stdDeviation="1.15" result="blur" />
          <feFlood flood-color="#fbbf24" flood-opacity="0.16" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
        </filter>

        <filter id="howtoBulbAuraNear" x="-120%" y="-120%" width="340%" height="340%" color-interpolation-filters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.55" result="innerEdge" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.45" result="outerEdge" />
          <feComposite in="outerEdge" in2="innerEdge" operator="out" result="ring" />
          <feGaussianBlur in="ring" stdDeviation="0.75" result="blur" />
          <feFlood flood-color="#fef08a" flood-opacity="0.28" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
        </filter>
      </defs>

      <g class="howto-bulb__shine">
        <use href="#howtoBulbShape" fill="#000" filter="url(#howtoBulbAuraFar)" />
        <use href="#howtoBulbShape" fill="#000" filter="url(#howtoBulbAuraNear)" />
      </g>

      <use
        href="#howtoBulbShape"
        class="howto-bulb__glass"
        fill="url(#howtoBulbGlass)"
        stroke="#ca8a04"
        stroke-width="0.5"
        stroke-linejoin="round"
      />

      <ellipse cx="10.15" cy="8.35" rx="0.95" ry="1.55" fill="#fffbeb" opacity="0.5" />

      <path
        d="M11.15 8.6h1.7M12 7.55v2.1"
        stroke="#fef3c7"
        stroke-width="0.85"
        stroke-linecap="round"
        opacity="0.9"
      />

      <path
        stroke="#94a3b8"
        stroke-width="1.1"
        stroke-linecap="round"
        d="M9.3 14.85h5.4M9.65 16.45h4.7M10.15 17.95h3.7"
      />
    </svg>
  </span>
</template>

<style scoped>
.howto-bulb {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: rgb(var(--c-accent-sky) / 0.14);
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Soft wash of bulb light on the circle — strongest near the glass, fades to edges */
.howto-bulb::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    ellipse 72% 68% at 50% 38%,
    rgb(253 224 71 / 0.34) 0%,
    rgb(250 204 21 / 0.14) 42%,
    rgb(250 204 21 / 0) 72%
  );
  animation: howto-bulb-circle-lit 4.2s ease-in-out infinite;
}

.howto-bulb__svg {
  position: relative;
  z-index: 1;
  width: 1.5rem;
  height: 1.5rem;
}

.howto-bulb__shine {
  transform-box: fill-box;
  transform-origin: 50% 38%;
  animation: howto-bulb-shine 4.2s ease-in-out infinite;
}

.howto-bulb__glass {
  paint-order: stroke fill;
}

@keyframes howto-bulb-shine {
  0%,
  100% {
    opacity: 0.22;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.48;
    transform: scale(1.07);
  }
}

@keyframes howto-bulb-circle-lit {
  0%,
  100% {
    opacity: 0.28;
  }
  50% {
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .howto-bulb__shine {
    animation: none;
    opacity: 0.32;
    transform: none;
  }

  .howto-bulb::before {
    animation: none;
    opacity: 0.4;
  }
}

@media (max-width: 420px) {
  .howto-bulb {
    width: 2rem;
    height: 2rem;
  }

  .howto-bulb__svg {
    width: 1.4rem;
    height: 1.4rem;
  }
}
</style>
