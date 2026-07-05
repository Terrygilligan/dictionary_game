# 🌍 Rule Book Translation Keys

Below are the translation keys for implementing the rule book in your i18n system. Add these to your respective language files (`en.json`, `nl.json`, `bg.json`, `in.json`, `fr.json`, `de.json`).

---

## 📝 **English Translation Keys (en.json)**

```json
{
  "ruleBook": {
    "title": "Lexicon Master: Official Rule Book",
    "welcome": "Welcome to Lexicon Master! This game is designed to celebrate our diverse village community by turning language learning into a social, collaborative experience. Whether you speak English, Dutch, Bulgarian, Indonesian, French, or German, the rules remain the same.",
    
    "objective": {
      "title": "1. The Objective",
      "description": "The goal of Lexicon Master is to build the highest-scoring vocabulary sequence by selecting words that connect logically, creatively, or grammatically, depending on the game mode."
    },
    
    "howToPlay": {
      "title": "2. How to Play",
      "dealer": {
        "title": "The Dealer",
        "description": "The game starts with the Dealer (the application) presenting a set of vocabulary words based on your chosen language."
      },
      "selection": {
        "title": "Selection",
        "description": "Players take turns or compete to select words from the available deck."
      },
      "log": {
        "title": "The Log",
        "description": "Every selection is recorded as an event in the event-log. This log ensures the game state is fair, immutable, and verifiable for all players."
      },
      "scoring": {
        "title": "Scoring",
        "description": "Points are awarded based on word complexity, connection strategy, and speed."
      }
    },
    
    "gameModes": {
      "title": "3. Game Modes",
      "soloSprint": {
        "title": "Solo Sprint",
        "description": "Challenge yourself to define or translate as many words as possible within a set time limit."
      },
      "villageVersus": {
        "title": "Village Versus",
        "description": "A competitive mode where you and your neighbors compete for the highest score using the same deck of words."
      },
      "communityBridge": {
        "title": "Community Bridge",
        "description": "A collaborative mode where players work together to build a \"Community Lexicon\" by adding definitions for new words in their mother tongue."
      }
    },
    
    "importantRules": {
      "title": "4. Important Rules",
      "languageIndependence": {
        "title": "Language Independence",
        "description": "You may change your interface language at any time via the Profile settings. The game state will remain the same for everyone in the match, regardless of the language they are viewing it in."
      },
      "fairPlay": {
        "title": "Fair Play (The Blind Arbiter)",
        "description": "Lexicon Master uses a \"Blind Arbiter\" system. The game state is derived strictly from the events recorded in the log, ensuring no player—or the game itself—can cheat or alter history once a word is played."
      },
      "communityContribution": {
        "title": "Community Contribution",
        "description": "If you come across a word that needs a better definition or a translation in a new language, use the \"Suggest\" feature. Your contribution will be recorded with your name attached, helping your neighbors learn."
      }
    },
    
    "privacy": {
      "title": "5. Privacy & Ethics",
      "gdpr": {
        "title": "GDPR Compliance",
        "description": "We take your data privacy seriously. All personal data is encrypted using AES-256-GCM and stored within the EU."
      },
      "rightToBeForgotten": {
        "title": "The Right to be Forgotten",
        "description": "You can request the permanent deletion of your data at any time via the \"Crypto-Shredding\" feature in your profile. This renders your personal logs unrecoverable, fulfilling your right to be forgotten."
      }
    },
    
    "tips": {
      "title": "Tips for Village Testers",
      "collaborate": {
        "title": "Collaborate",
        "description": "Try the \"Community Bridge\" mode with a neighbor who speaks a different language. It's the fastest way to learn!"
      },
      "consistency": {
        "title": "Consistency",
        "description": "Play regularly to improve your personal streak and contribute to the village leaderboard."
      },
      "feedback": {
        "title": "Feedback",
        "description": "Use the VILLAGE_BETA_GUIDE.md to report any words that seem incorrect or culturally insensitive."
      }
    },
    
    "community": {
      "title": "Community Focus",
      "socialBridge": {
        "title": "Social Bridge Nature",
        "description": "This game is designed to connect neighbors across language barriers, creating a social bridge within your village community."
      },
      "culturalExchange": {
        "title": "Cultural Exchange",
        "description": "By playing together, villagers learn not just words, but also cultural context and understanding."
      },
      "inclusiveDesign": {
        "title": "Inclusive Design",
        "description": "The game supports multiple languages and accessibility features to ensure everyone in the community can participate."
      }
    },
    
    "technical": {
      "title": "Technical Architecture",
      "eventSourced": {
        "title": "Event-Sourced Foundation",
        "description": "Built on a universal event-sourced architecture, ensuring:",
        "features": [
          "Immutable game history",
          "Fair play verification",
          "Deterministic replay",
          "Transparent game state"
        ]
      },
      "privacyFirst": {
        "title": "Privacy-First Design",
        "description": "",
        "features": [
          "Crypto-shredding for data deletion",
          "EU data hosting (europe-west1)",
          "GDPR compliance by design",
          "No tracking or analytics"
        ]
      },
      "multilingual": {
        "title": "Multilingual Support",
        "description": "",
        "features": [
          "6 languages fully supported",
          "Instant language switching",
          "Consistent game state across languages",
          "Cultural sensitivity in translations"
        ]
      }
    },
    
    "beta": {
      "title": "Village Beta Testing",
      "whatTesting": {
        "title": "What We're Testing",
        "items": [
          "Game mechanics across different languages",
          "Community engagement and social features",
          "Privacy features and user trust",
          "Accessibility and inclusivity",
          "Performance on various devices"
        ]
      },
      "howParticipate": {
        "title": "How to Participate",
        "steps": [
          "Create an account with email verification",
          "Choose your preferred language",
          "Try different game modes",
          "Provide feedback through the beta guide",
          "Invite neighbors to join the community"
        ]
      }
    },
    
    "success": {
      "title": "Success Metrics",
      "communityEngagement": {
        "title": "Community Engagement",
        "metrics": [
          "Number of active village participants",
          "Cross-language collaboration instances",
          "Community lexicon contributions",
          "Regular player retention"
        ]
      },
      "educationalImpact": {
        "title": "Educational Impact",
        "metrics": [
          "Vocabulary improvement tracking",
          "Language switching frequency",
          "Definition quality contributions",
          "Cultural exchange instances"
        ]
      },
      "privacyTrust": {
        "title": "Privacy Trust",
        "metrics": [
          "User confidence in data protection",
          "Feature usage of privacy controls",
          "Community feedback on privacy",
          "GDPR compliance verification"
        ]
      }
    },
    
    "future": {
      "title": "Future Development",
      "plannedFeatures": {
        "title": "Planned Features",
        "features": [
          "Voice pronunciation guides",
          "Image associations for visual learners",
          "Progress tracking with certificates",
          "Teacher tools for classroom use",
          "Community events and tournaments"
        ]
      },
      "communityContributions": {
        "title": "Community Contributions",
        "contributions": [
          "Word suggestions from native speakers",
          "Cultural context additions",
          "Translation improvements",
          "Accessibility enhancements"
        ]
      }
    },
    
    "support": {
      "title": "Support & Feedback",
      "forTesters": {
        "title": "For Village Testers",
        "items": [
          "Use the Village Beta Guide for detailed testing instructions",
          "Report issues through the Profile page backend tester",
          "Join our community Discord for real-time discussion",
          "Email village-beta@lexicon-master.eu for private support"
        ]
      },
      "technicalSupport": {
        "title": "Technical Support",
        "items": [
          "Check the Backend Tester in Profile page for connectivity",
          "Review Firebase status for service availability",
          "Consult FAQ in the help section",
          "Contact support@lexicon-master.eu for technical issues"
        ]
      }
    },
    
    "join": {
      "title": "Join the Community",
      "description": "Lexicon Master is more than just a game—it's a social bridge connecting our diverse village community through language, learning, and mutual respect.",
      "tagline": "Together, we're building not just vocabulary, but understanding.",
      "welcome": "Welcome to Lexicon Master!"
    }
  }
}
```

---

## 🌍 **Implementation Instructions**

### **Step 1: Add to Language Files**
Copy the JSON structure above to:
- `src/shared/lib/i18n/locales/en.json`
- `src/shared/lib/i18n/locales/nl.json` (translate to Dutch)
- `src/shared/lib/i18n/locales/bg.json` (translate to Bulgarian)
- `src/shared/lib/i18n/locales/in.json` (translate to Indonesian)
- `src/shared/lib/i18n/locales/fr.json` (translate to French)
- `src/shared/lib/i18n/locales/de.json` (translate to German)

### **Step 2: Create RuleBook Component**
```typescript
// src/shared/ui/RuleBook.tsx
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export function RuleBook() {
  const { t } = useTranslate()
  
  return (
    <div className="rule-book">
      <h1>{t('ruleBook.title')}</h1>
      <p>{t('ruleBook.welcome')}</p>
      
      <section>
        <h2>{t('ruleBook.objective.title')}</h2>
        <p>{t('ruleBook.objective.description')}</p>
      </section>
      
      {/* Continue with all sections... */}
    </div>
  )
}
```

### **Step 3: Add to Navigation**
Add a "Rules" link to your navigation or create a dedicated help page.

---

## 🎯 **Translation Guidelines**

### **Cultural Adaptation**
- Adapt examples to be culturally relevant for each language
- Ensure game mode names make sense in each culture
- Consider cultural nuances in community-focused language

### **Technical Terms**
- Keep technical terms like "Event-Sourced Architecture" consistent
- Translate explanations but maintain technical accuracy
- Ensure GDPR compliance language is legally appropriate

### **Tone and Voice**
- Maintain friendly, community-focused tone
- Use inclusive language that welcomes all villagers
- Keep explanations simple and accessible

---

## 🚀 **Ready to Implement**

The rule book is now structured for easy implementation in your existing i18n system. The translation keys follow your established patterns and will automatically translate when users switch languages.

**Next step: Add these keys to your language files and create the RuleBook component!**
