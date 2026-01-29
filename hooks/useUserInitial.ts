import { useUserOptional } from '@/contexts/user-context'

/**
 * Returns the first letter of the user's display name or email, uppercased.
 * Falls back to 'U' if neither is available.
 */
export function useUserInitial(): string {
  const userContext = useUserOptional()
  const displayName = userContext?.profile?.display_name
  const email = userContext?.user?.email

  if (displayName) return displayName.charAt(0).toUpperCase()
  if (email) return email.charAt(0).toUpperCase()
  return 'U'
}
