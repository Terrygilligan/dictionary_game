import { Button } from './Button'

interface GameCardProps {
  title: string
  description: string
  stats?: string[]
  buttonText?: string
  variant?: 'default' | 'large' | 'featured'
  onPlay?: () => void
}

export function GameCard({ 
  title, 
  description, 
  stats = [], 
  buttonText = 'Play Now',
  variant = 'default',
  onPlay 
}: GameCardProps) {
  return (
    <div className={`game-card game-card--${variant}`}>
      <div className="game-card__content">
        <h3 className="game-card__title">{title}</h3>
        <p className="game-card__description">{description}</p>
        
        {stats.length > 0 && (
          <div className="game-card__stats">
            {stats.map((stat, index) => (
              <span key={index} className="game-card__stat">
                {stat}
              </span>
            ))}
          </div>
        )}
        
        <Button className="game-card__button" onClick={onPlay}>
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
