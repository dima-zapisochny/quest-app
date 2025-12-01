import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

if (typeof window !== 'undefined') {
  const passiveEvents = new Set(['touchstart', 'touchmove', 'wheel'])
  const originalAddEventListener = EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (passiveEvents.has(type)) {
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true }
      } else if (options === undefined || options === null) {
        options = { passive: true }
      } else if (!('passive' in options)) {
        options = { ...options, passive: true }
      }
    }
    return originalAddEventListener.call(this, type, listener, options as any)
  }
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')



