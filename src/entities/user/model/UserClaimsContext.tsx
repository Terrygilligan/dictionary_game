import { createContext, useContext, type ReactNode } from 'react'
import type { UserClaims } from './types.ts'

interface UserClaimsContextType {
  claims: UserClaims | null
  isSuperAdmin: boolean
  isAdmin: boolean
  isLoading: boolean
}

const UserClaimsContext = createContext<UserClaimsContextType>({
  claims: null,
  isSuperAdmin: false,
  isAdmin: false,
  isLoading: true,
})

export interface UserClaimsProviderProps {
  children: ReactNode
  claims: UserClaims | null
  isLoading: boolean
}

export function UserClaimsProvider({ children, claims, isLoading }: UserClaimsProviderProps) {
  const value: UserClaimsContextType = {
    claims,
    isSuperAdmin: claims?.superadmin === true,
    isAdmin: claims?.admin === true || claims?.superadmin === true,
    isLoading,
  }

  console.log('[UserClaimsProvider] Computing context value:')
  console.log('[UserClaimsProvider] Input claims:', claims)
  console.log('[UserClaimsProvider] Input isLoading:', isLoading)
  console.log('[UserClaimsProvider] Computed isSuperAdmin:', value.isSuperAdmin)
  console.log('[UserClaimsProvider] Computed isAdmin:', value.isAdmin)

  return (
    <UserClaimsContext.Provider value={value}>
      {children}
    </UserClaimsContext.Provider>
  )
}

export function useUserClaims() {
  const context = useContext(UserClaimsContext)
  if (!context) {
    throw new Error('useUserClaims must be used within UserClaimsProvider')
  }
  return context
}
