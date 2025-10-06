import { supabase } from './supabase'

export async function signUpWithEmail(email: string, password: string) {
  return await supabase.auth.signUp({ email, password })
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { session: data.session, error }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.warn('Supabase auth error:', error.message)
      return null
    }

    return user
  } catch (err) {
    console.warn('Auth session missing — returning null')
    return null
  }
}
export async function signOut() {
  await supabase.auth.signOut()
}
