import { useCallback } from 'react'
import { useUserStore, useUserIdentity } from '@/entities/user/model/context.ts'
import { useUserDispatch } from '@/entities/user/model/useUser.ts'
import { selectGuestAccessState } from '@/entities/user/model/selectors.ts'

/**
 * React hook for guest access functionality.
 * 
 * This hook consumes user entity state to provide guest access information
 * and dispatch capabilities. It follows the event-sourcing pattern by
 * dispatching commands to the user entity decider.
 * 
 * @param maxGames - Maximum number of games allowed for guest access (default: 3)
 * @returns Guest access state and request function
 */
export function useGuestAccess(maxGames: number = 3) {
  const dispatch = useUserDispatch()
  const store = useUserStore()
  const { tenant_id, aggregate_id } = useUserIdentity()
  
  // Get guest access state from user entity
  const guestAccessState = tenant_id && aggregate_id
    ? selectGuestAccessState(store.getState(tenant_id, aggregate_id))
    : {
        gamesPlayed: 0,
        maxGames,
        isAccessGranted: false,
      }
  
  const { gamesPlayed, isAccessGranted } = guestAccessState
  const gamesRemaining = maxGames - gamesPlayed
  const isDenied = !isAccessGranted && gamesPlayed >= maxGames
  
  /**
   * Request guest access by dispatching a command to the user entity decider.
   * The decider will evaluate eligibility and emit appropriate events.
   */
  const requestGuestAccess = useCallback(() => {
    if (!tenant_id || !aggregate_id) {
      console.error('❌ [GUEST_ACCESS] Cannot request access: missing identity')
      return
    }
    
    dispatch({
      type: 'guestAccess/request',
      tenant_id,
      aggregate_id,
      maxGames,
    })
  }, [dispatch, tenant_id, aggregate_id, maxGames])
  
  return {
    // State
    gamesPlayed,
    gamesRemaining,
    isAccessGranted,
    isDenied,
    maxGames,
    
    // Actions
    requestGuestAccess,
  }
}
