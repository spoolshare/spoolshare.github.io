import { useCallback } from 'react'
import { api, type SignUpInput } from '@/lib/api'
import { invalidate, useQuery } from './useQuery'

export function useSession() {
  const { data, loading } = useQuery('session', () => api.getSession())

  const afterAuthChange = useCallback(() => invalidate(), [])

  return {
    user: data ?? null,
    loading,
    signedIn: !!data,
    signIn: async (email: string, password: string) => {
      const p = await api.signIn(email, password)
      afterAuthChange()
      return p
    },
    signInDemo: async () => {
      const p = await api.signInDemo()
      afterAuthChange()
      return p
    },
    signUp: async (input: SignUpInput) => {
      const p = await api.signUp(input)
      afterAuthChange()
      return p
    },
    signOut: async () => {
      await api.signOut()
      afterAuthChange()
    },
  }
}
