import { Button } from '@/shared/ui/Button'
import { useGameIdentity } from '../model/useFirebaseAuth.ts'

export interface GameScreenIdentityProps {
  children: (tenant_id: string, aggregate_id: string) => React.ReactNode
}

export function GameScreenIdentity({ children }: GameScreenIdentityProps) {
  const { tenant_id, aggregate_id, isLoading, error } = useGameIdentity()
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Loading game identity...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Authentication required: {error}</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      </div>
    )
  }

  // Handle missing identity
  if (!tenant_id || !aggregate_id) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Game identity not available</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  return <>{children(tenant_id, aggregate_id)}</>
}
