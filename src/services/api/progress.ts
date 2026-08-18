import { supabase } from './_shared'

export async function getQuestProgress(questId: string, userId: string) {
  const { data, error } = await supabase
    .from('quest_progress')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching quest progress:', error)
    return []
  }

  return data.map(row => ({
    questId: row.quest_id,
    userId: row.user_id,
    roundId: row.round_id,
    categoryId: row.category_id,
    questionId: row.question_id,
    playedAt: new Date(row.played_at).getTime()
  }))
}

export async function markQuestionAsPlayed(
  questId: string,
  userId: string,
  roundId: string,
  categoryId: string,
  questionId: string
): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .upsert(
      {
        quest_id: questId,
        user_id: userId,
        round_id: roundId,
        category_id: categoryId,
        question_id: questionId
      },
      {
        onConflict: 'quest_id,round_id,category_id,question_id,user_id'
      }
    )

  if (error) {
    console.error('Error marking question as played:', error)
    throw error
  }
}

export async function resetQuestProgress(questId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .delete()
    .eq('quest_id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error resetting quest progress:', error)
    throw error
  }
}

export async function resetRoundProgress(
  questId: string,
  userId: string,
  roundId: string
): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .delete()
    .eq('quest_id', questId)
    .eq('user_id', userId)
    .eq('round_id', roundId)

  if (error) {
    console.error('Error resetting round progress:', error)
    throw error
  }
}
