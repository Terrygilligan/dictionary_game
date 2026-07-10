import { useState, useEffect } from 'react'

interface JumpToMenuProps {
  safeT: (key: string, fallback?: string) => string
}

export function JumpToMenu({ safeT }: JumpToMenuProps) {
  const [activeSection, setActiveSection] = useState('play-your-way')

  const menuItems = [
    { id: 'features', label: safeT('landing.menu.features', 'Features') },
    { id: 'privacy', label: safeT('landing.menu.dataControl', 'Data Control') },
    { id: 'how-it-works', label: safeT('landing.menu.howItWorks', 'How It Works') },
    { id: 'play-your-way', label: safeT('landing.menu.playYourWay', 'Play Your Way') }
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
    }
  }

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      }))

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing__jump-menu">
      <nav className="landing__jump-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`landing__jump-item ${activeSection === item.id ? 'landing__jump-item--active' : ''}`}
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
