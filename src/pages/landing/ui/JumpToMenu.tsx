import { useState, useEffect, useMemo } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export function JumpToMenu() {
  const { t } = useTranslate()
  const [activeSection, setActiveSection] = useState('play-your-way')

  const menuItems = useMemo(() => [
    { id: 'features', label: t('landing.menu.features') },
    { id: 'privacy', label: t('landing.menu.dataControl') },
    { id: 'how-it-works', label: t('landing.menu.howItWorks') },
    { id: 'play-your-way', label: t('landing.menu.playYourWay') }
  ], [t])

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
  }, [menuItems])

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
