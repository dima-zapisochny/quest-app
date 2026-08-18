import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile } from '@/types'
import { generateId } from '@/utils/id'
import { ensureAnonymousSession, claimLegacyData } from '@/services/auth'
import { getUserProfile, upsertUserProfile } from '@/services/supabaseService'

/**
 * Профиль пользователя + анонимная авторизация + активная сессия игрока.
 * Выделено из gameSessionStore (был god-store). gameSessionStore делегирует сюда.
 */
export const useProfileStore = defineStore('profile', () => {
  const userProfile = ref<UserProfile | null>(null)
  const activePlayerSession = ref<{ sessionId: string; playerId: string } | null>(null)

  /**
   * Анонимный вход + загрузка профиля + восстановление активной сессии игрока.
   * id профиля ВСЕГДА = текущий auth uid (иначе RLS блокирует create/read — прод-инцидент).
   */
  async function loadProfile(): Promise<void> {
    // Анонимная авторизация: стабильный auth uid (закрытие RLS).
    const authUid = await ensureAnonymousSession()
    if (authUid) {
      // Старый клиентский id (player-xxx) мог быть уже перезаписан — восстанавливаем из
      // сохранённого профиля, чтобы claim смог вернуть старые квесты на новый uid.
      let legacyId = localStorage.getItem('quiz-app-user-id')
      if (!legacyId || legacyId === authUid) {
        try {
          const raw = localStorage.getItem('quiz-app-user-profile')
          if (raw) legacyId = JSON.parse(raw).id
        } catch { /* ignore */ }
      }
      if (legacyId && legacyId !== authUid) {
        await claimLegacyData(legacyId)
      }
      localStorage.setItem('quiz-app-user-id', authUid)
    }

    const profileId = localStorage.getItem('quiz-app-user-id')
    if (profileId) {
      try {
        const profile = await getUserProfile(profileId)
        if (profile) {
          userProfile.value = profile
          localStorage.setItem('quiz-app-user-profile', JSON.stringify(profile))
        }
      } catch (error) {
        console.error('Error loading profile from Supabase:', error)
      }

      // Fallback: из localStorage, с принудительным id = текущий auth uid
      if (!userProfile.value) {
        const storedProfile = localStorage.getItem('quiz-app-user-profile')
        if (storedProfile) {
          try {
            const p = JSON.parse(storedProfile)
            userProfile.value = { ...p, id: profileId }
            localStorage.setItem('quiz-app-user-profile', JSON.stringify(userProfile.value))
          } catch (e) {
            console.error('Error parsing stored profile:', e)
          }
        }
      }
    }

    // Активная сессия игрока (для восстановления при перезагрузке)
    const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
    if (storedActiveSession) {
      try {
        activePlayerSession.value = JSON.parse(storedActiveSession)
      } catch (e) {
        console.error('Error parsing stored active player session:', e)
        localStorage.removeItem('quiz-app-active-player-session')
      }
    }
  }

  async function setUserProfile(profile: { name: string; avatar: string }): Promise<UserProfile> {
    const storedId = localStorage.getItem('quiz-app-user-id')
    const existing = userProfile.value ?? { id: storedId || generateId('player'), name: '', avatar: '' }
    const newProfile: UserProfile = {
      ...existing,
      // id профиля ВСЕГДА = текущий auth uid (иначе RLS блокирует upsert/create). Прод-инцидент.
      id: storedId || existing.id,
      name: profile.name.trim(),
      avatar: profile.avatar
    }
    try {
      userProfile.value = await upsertUserProfile(newProfile)
      localStorage.setItem('quiz-app-user-id', userProfile.value.id)
      localStorage.setItem('quiz-app-user-profile', JSON.stringify(userProfile.value))
    } catch (error) {
      console.error('Error saving user profile:', error)
      localStorage.setItem('quiz-app-user-profile', JSON.stringify(newProfile))
      localStorage.setItem('quiz-app-user-id', newProfile.id)
      userProfile.value = newProfile
    }
    return userProfile.value
  }

  function ensureProfile(): UserProfile {
    if (!userProfile.value) {
      throw new Error('User profile is not set')
    }
    return userProfile.value
  }

  function setActivePlayer(sessionId: string, playerId: string) {
    activePlayerSession.value = { sessionId, playerId }
    localStorage.setItem('quiz-app-active-player-session', JSON.stringify({ sessionId, playerId }))
  }

  function clearActivePlayer() {
    activePlayerSession.value = null
    localStorage.removeItem('quiz-app-active-player-session')
  }

  function getCurrentDevicePlayer(sessionId: string): string | null {
    return activePlayerSession.value?.sessionId === sessionId
      ? activePlayerSession.value.playerId
      : null
  }

  return {
    userProfile,
    activePlayerSession,
    loadProfile,
    setUserProfile,
    ensureProfile,
    setActivePlayer,
    clearActivePlayer,
    getCurrentDevicePlayer
  }
})
