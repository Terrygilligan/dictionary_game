import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export function RuleBook() {
  const { t } = useTranslate()

  return (
    <div className="rule-book">
      <header className="rule-book__header">
        <h1 className="rule-book__title">{t('rules.title')}</h1>
        <p className="rule-book__welcome">{t('rules.welcome')}</p>
      </header>

      <main className="rule-book__content">
        {/* Objective Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.sections.objective.title')}</h2>
          <p className="rule-book__section-description">{t('rules.sections.objective.description')}</p>
        </section>

        {/* How to Play Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.sections.howToPlay.title')}</h2>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.howToPlay.dealer.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.howToPlay.dealer.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.howToPlay.selection.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.howToPlay.selection.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.howToPlay.log.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.howToPlay.log.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.howToPlay.scoring.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.howToPlay.scoring.description')}</p>
          </div>
        </section>

        {/* Game Modes Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.sections.modes.title')}</h2>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.modes.solo.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.modes.solo.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.modes.versus.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.modes.versus.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.modes.bridge.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.modes.bridge.description')}</p>
          </div>
        </section>

        {/* Important Rules Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.sections.important.title')}</h2>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.important.language.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.important.language.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.important.arbiter.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.important.arbiter.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.important.community.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.important.community.description')}</p>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.sections.privacy.title')}</h2>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.privacy.gdpr.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.privacy.gdpr.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.sections.privacy.forgotten.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.sections.privacy.forgotten.description')}</p>
          </div>
        </section>

        {/* Tips Section */}
        <section className="rule-book__section">
          <h2 className="rule-book__section-title">{t('rules.tips.title')}</h2>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.tips.collaborate.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.tips.collaborate.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.tips.consistency.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.tips.consistency.description')}</p>
          </div>
          <div className="rule-book__subsection">
            <h3 className="rule-book__subsection-title">{t('rules.tips.feedback.title')}</h3>
            <p className="rule-book__subsection-description">{t('rules.tips.feedback.description')}</p>
          </div>
        </section>
      </main>

      <footer className="rule-book__footer">
        <div className="rule-book__join">
          <h2 className="rule-book__join-title">{t('rules.join.title')}</h2>
          <p className="rule-book__join-description">{t('rules.join.description')}</p>
          <p className="rule-book__join-tagline">{t('rules.join.tagline')}</p>
          <p className="rule-book__join-welcome">{t('rules.join.welcome')}</p>
        </div>
      </footer>
    </div>
  )
}
