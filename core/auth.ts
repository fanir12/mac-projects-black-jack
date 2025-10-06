'use client'
import { supabase } from './supabase'

// Sign in with Google
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })
  if (error) console.error('Sign-in error:', error.message)
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Sign-out error:', error.message)
}

// Get current user (session persisted in browser)
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
