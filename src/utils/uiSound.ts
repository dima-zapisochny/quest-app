import { isUiSoundEnabled } from '@/composables/useUiSound'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new AC()
    } catch {
      return null
    }
  }
  return audioCtx
}

async function ensureRunning(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return false
    }
  }
  return ctx.state === 'running'
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.connect(gain)
  osc.start(start)
  osc.stop(start + duration)
}

/** Короткий звук при виборі квесту на Host Setup */
export async function playQuestSelectSound(options?: { force?: boolean }): Promise<void> {
  if (!options?.force && !isUiSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx || !(await ensureRunning(ctx))) return

  const t = ctx.currentTime
  playTone(ctx, 523.25, t, 0.07, 0.1, 'triangle')
  playTone(ctx, 659.25, t + 0.06, 0.11, 0.09, 'triangle')
}

/** М’який звук при знятті вибору */
export async function playQuestDeselectSound(): Promise<void> {
  if (!isUiSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx || !(await ensureRunning(ctx))) return

  const t = ctx.currentTime
  playTone(ctx, 440, t, 0.06, 0.06, 'sine')
}

/** Приглушений звук при наведенні на плитку сітки розміру */
export async function playGridTileHoverSound(): Promise<void> {
  if (!isUiSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx || !(await ensureRunning(ctx))) return

  const t = ctx.currentTime
  playTone(ctx, 196, t, 0.045, 0.028, 'sine')
  playTone(ctx, 130, t + 0.01, 0.055, 0.018, 'triangle')
}

/** Інший, трохи чіткіший звук при кліку на плитку сітки */
export async function playGridTileClickSound(): Promise<void> {
  if (!isUiSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx || !(await ensureRunning(ctx))) return

  const t = ctx.currentTime
  playTone(ctx, 311, t, 0.055, 0.05, 'triangle')
  playTone(ctx, 466, t + 0.035, 0.07, 0.038, 'sine')
}

/** Короткий «хтось» при видаленні */
export async function playDeleteSound(): Promise<void> {
  if (!isUiSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx || !(await ensureRunning(ctx))) return

  const t = ctx.currentTime
  playTone(ctx, 392, t, 0.06, 0.07, 'triangle')
  playTone(ctx, 277, t + 0.05, 0.08, 0.06, 'sine')
  playTone(ctx, 196, t + 0.11, 0.1, 0.045, 'sine')
}
