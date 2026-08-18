import { describe, it, expect } from 'vitest'
import { isPlayableAudioUrl, isPlayableAudioMedia } from './mediaUrl'
import type { MediaAsset } from '@/types'

describe('isPlayableAudioUrl', () => {
  it('принимает валидный data:base64', () => {
    expect(isPlayableAudioUrl('data:audio/mpeg;base64,QUJD')).toBe(true)
  })

  it('отклоняет пустые/битые data URL', () => {
    expect(isPlayableAudioUrl('data:')).toBe(false)
    expect(isPlayableAudioUrl('data:,')).toBe(false)
    expect(isPlayableAudioUrl('data:audio/')).toBe(false)
    expect(isPlayableAudioUrl('data:audio/mpeg;base64,')).toBe(false)
    expect(isPlayableAudioUrl('data:audio/mpeg;base64,   ')).toBe(false)
  })

  it('принимает относительные пути (импортированные квесты)', () => {
    expect(isPlayableAudioUrl('audio/track.mp3')).toBe(true)
    expect(isPlayableAudioUrl('/storage/v1/object/public/quest-media/x.mp3')).toBe(true)
  })

  it('принимает обычные http(s) URL', () => {
    expect(isPlayableAudioUrl('https://cdn.example-real.com/a.mp3')).toBe(true)
  })

  it('отклоняет плейсхолдеры', () => {
    expect(isPlayableAudioUrl('https://example.com/a.mp3')).toBe(false)
    expect(isPlayableAudioUrl('http://example.org/a.mp3')).toBe(false)
    expect(isPlayableAudioUrl('https://placeholder.io/a.mp3')).toBe(false)
    expect(isPlayableAudioUrl('https://dummy.net/a.mp3')).toBe(false)
    expect(isPlayableAudioUrl('https://fake.host/a.mp3')).toBe(false)
  })

  it('отклоняет пустое/невалидное', () => {
    expect(isPlayableAudioUrl('')).toBe(false)
    expect(isPlayableAudioUrl('   ')).toBe(false)
    expect(isPlayableAudioUrl(null)).toBe(false)
    expect(isPlayableAudioUrl(undefined)).toBe(false)
  })
})

describe('isPlayableAudioMedia', () => {
  const media = (over: Partial<MediaAsset>): MediaAsset =>
    ({ id: 'm', type: 'audio', name: 'a', url: 'audio/x.mp3', ...over })

  it('true только для audio с воспроизводимым URL', () => {
    expect(isPlayableAudioMedia(media({}))).toBe(true)
    expect(isPlayableAudioMedia(media({ type: 'image' }))).toBe(false)
    expect(isPlayableAudioMedia(media({ url: 'data:' }))).toBe(false)
    expect(isPlayableAudioMedia(null)).toBe(false)
    expect(isPlayableAudioMedia(undefined)).toBe(false)
  })
})
