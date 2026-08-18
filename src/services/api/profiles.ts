import { supabase } from './_shared'
import type { UserProfile } from '@/types'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar
  }
}
