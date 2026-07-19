import './LiquidGuestButton.css'

interface LiquidGuestButtonProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function LiquidGuestButton({ onClick, children, className = '' }: LiquidGuestButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`liquid-guest-button ${className}`}
      type="button"
    >
      <span className="liquid-guest-button__text">{children}</span>
      <div className="liquid-guest-button__blob" aria-hidden="true" />
    </button>
  )
}
