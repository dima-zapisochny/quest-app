import { supabase, isSupabaseConfigured, ensureSupabaseConfigured, logSupabaseError } from './_shared'
import type { Quest } from '@/types'

const QUEST_MEDIA_BUCKET = 'quest-media'

export async function getQuestList(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quest_list_view')
    .select('id, title, description, rounds_count, questions_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[Supabase] quest_list_view недоступен, fallback на полный data:', error.message)
    return getQuestListFallback(userId)
  }

  return (data || []).map((row: { id: string; title: string; description?: string | null; rounds_count?: number; questions_count?: number }) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    rounds: [], // структура подгрузится через loadQuestFull
    roundsCount: row.rounds_count ?? 0,
    questionsCount: row.questions_count ?? 0
  }))
}

/** Старый путь: тянет полный data и считает на клиенте (пока view не задеплоен). */
async function getQuestListFallback(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, description, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quest list:', error)
    return []
  }

  return (data || []).map((row: { id: string; title: string; description?: string | null; data?: Quest | null }) => {
    const q = row.data
    const rounds = q && Array.isArray(q.rounds) ? q.rounds : []
    const questionsCount = rounds.reduce((sum, r) => sum + (r.categories || []).reduce((cs, c) => cs + (c.questions?.length ?? 0), 0), 0)
    return {
      id: row.id,
      title: row.title ?? q?.title ?? '',
      description: row.description ?? q?.description ?? undefined,
      rounds,
      roundsCount: rounds.length,
      questionsCount
    } as Quest
  })
}

/** Повний список квестів з data (важкий, усі медіа в JSON). */
export async function getQuestById(questId: string, userId: string): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching quest:', error)
    return null
  }
  if (!data) return null
  return (data as { data: Quest }).data
}


export async function getQuestByIdGlobal(questId: string): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .maybeSingle()

  if (error) {
    logSupabaseError('getQuestByIdGlobal', error)
    return null
  }
  if (!data) return null
  const quest = data.data as Quest
  return quest ? ({ ...quest, id: questId } as Quest) : null
}

export async function createQuest(quest: Quest, userId: string): Promise<Quest> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase
    .from('quests')
    .insert({
      id: quest.id,
      title: quest.title,
      description: quest.description || null,
      data: quest,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating quest:', error)
    throw error
  }

  return data.data as Quest
}

export async function updateQuest(quest: Quest, userId: string): Promise<Quest> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase
    .from('quests')
    .update({
      title: quest.title,
      description: quest.description || null,
      data: quest
    })
    .eq('id', quest.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Quest not found or you do not have permission to update it')
    }
    console.error('Error updating quest:', error)
    throw error
  }

  return data.data as Quest
}

export async function deleteQuest(questId: string, userId: string): Promise<void> {
  ensureSupabaseConfigured()
  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting quest:', error)
    throw error
  }
}


export async function uploadQuestMedia(
  questId: string,
  userId: string,
  file: File,
  mediaId: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${questId}/${mediaId}.${ext}`
  const { error } = await supabase.storage.from(QUEST_MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined
  })
  if (error) {
    console.warn('[Supabase] Upload quest media failed:', error.message, { code: (error as { error?: string }).error, path, size: file.size })
    return null
  }
  const { data } = supabase.storage.from(QUEST_MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
