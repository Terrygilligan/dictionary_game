# 🤖 Cascade Translation Prompt for Lexicon Master

## 📋 **Complete Prompt for Cascade**

Copy and paste this entire prompt into Cascade to generate all your language translations:

---

### **🚀 The Complete Cascade Prompt**

> I am working on the "Lexicon Master" project, which uses a Feature-Sliced Design (FSD) architecture. I need to implement multilingual support for a new RuleBook feature.
> 
> **Project Context:**
> - Lexicon Master is a multilingual dictionary game for village communities
> - Supports 6 languages: English (en), Dutch (nl), Bulgarian (bg), Indonesian (in), French (fr), German (de)
> - Uses event-sourced architecture with "Blind Arbiter" and "Crypto-Shredding" as core concepts
> - GDPR-compliant with EU data hosting (europe-west1)
> - Community-focused with social bridge philosophy
> 
> **Current English Translation Structure:**
> I already have the English translations in `src/shared/lib/i18n/locales/en.json` under the `rules` namespace with this structure:
> ```json
> {
>   "rules": {
>     "title": "Lexicon Master: Official Rule Book",
>     "welcome": "Welcome to Lexicon Master! This game is designed to celebrate our diverse village community...",
>     "sections": {
>       "objective": {
>         "title": "1. The Objective",
>         "description": "The goal of Lexicon Master is to build the highest-scoring vocabulary sequence..."
>       },
>       "howToPlay": {
>         "title": "2. How to Play",
>         "dealer": { "title": "The Dealer", "description": "The game starts with the Dealer..." },
>         "selection": { "title": "Selection", "description": "Players take turns..." },
>         "log": { "title": "The Log", "description": "Every selection is recorded..." },
>         "scoring": { "title": "Scoring", "description": "Points are awarded..." }
>       },
>       "modes": {
>         "title": "3. Game Modes",
>         "solo": { "title": "Solo Sprint", "description": "Challenge yourself..." },
>         "versus": { "title": "Village Versus", "description": "A competitive mode..." },
>         "bridge": { "title": "Community Bridge", "description": "A collaborative mode..." }
>       },
>       "important": {
>         "title": "4. Important Rules",
>         "language": { "title": "Language Independence", "description": "You may change..." },
>         "arbiter": { "title": "Fair Play (The Blind Arbiter)", "description": "Lexicon Master uses..." },
>         "community": { "title": "Community Contribution", "description": "If you come across..." }
>       },
>       "privacy": {
>         "title": "5. Privacy & Ethics",
>         "gdpr": { "title": "GDPR Compliance", "description": "We take your data privacy..." },
>         "forgotten": { "title": "The Right to be Forgotten", "description": "You can request..." }
>       }
>     },
>     "tips": {
>       "title": "Tips for Village Testers",
>       "collaborate": { "title": "Collaborate", "description": "Try the \"Community Bridge\"..." },
>       "consistency": { "title": "Consistency", "description": "Play regularly..." },
>       "feedback": { "title": "Feedback", "description": "Use the VILLAGE_BETA_GUIDE.md..." }
>     },
>     "join": {
>       "title": "Join the Community",
>       "description": "Lexicon Master is more than just a game...",
>       "tagline": "Together, we're building not just vocabulary, but understanding.",
>       "welcome": "Welcome to Lexicon Master!"
>     }
>   }
> }
> ```
> 
> **Task:**
> Generate the complete JSON content for my 5 remaining translation files: `nl.json`, `bg.json`, `in.json`, `fr.json`, and `de.json`.
> 
> **Requirements:**
> 1. **Cultural Adaptation**: Adapt the language to be natural and culturally appropriate for each target audience
> 2. **Technical Terminology**: Keep "Blind Arbiter" and "Crypto-Shredding" consistent as these are core architectural concepts
> 3. **Community Focus**: Maintain the welcoming, community-focused tone that emphasizes social bridge building
> 4. **GDPR Compliance**: Ensure privacy terminology is legally appropriate for EU languages (Dutch, French, German)
> 5. **Game Terminology**: Translate game modes and concepts while keeping them engaging and clear
> 
> **Specific Translation Guidelines:**
> 
> **Dutch (nl.json):**
> - Use natural Dutch for village communities
> - GDPR terminology should be in proper Dutch (e.g., "GDPR-naleving")
> - Keep game mode names catchy in Dutch
> 
> **Bulgarian (bg.json):**
> - Use Cyrillic script appropriately
> - Adapt community concepts for Bulgarian village context
> - Ensure technical terms are understandable
> 
> **Indonesian (in.json):**
> - Use Bahasa Indonesia that feels natural
> - Adapt community concepts for Indonesian culture
> - Keep the social bridge philosophy clear
> 
> **French (fr.json):**
> - Use proper French with appropriate formality
> - GDPR terminology should be in correct French
> - Maintain the elegant, community-focused tone
> 
> **German (de.json):**
> - Use proper German with attention to formal/informal balance
> - GDPR terminology must be legally correct in German
> - Keep technical precision while being accessible
> 
> **Output Format:**
> Provide each language as a separate JSON object that I can directly copy into the corresponding files. Each should contain only the `rules` object that matches the English structure.
> 
> **File Creation Request:**
> After generating the JSON content, please create/update these files:
> - `src/shared/lib/i18n/locales/nl.json`
> - `src/shared/lib/i18n/locales/bg.json`
> - `src/shared/lib/i18n/locales/in.json`
> - `src/shared/lib/i18n/locales/fr.json`
> - `src/shared/lib/i18n/locales/de.json`
> 
> Add the `rules` object to each file, preserving any existing content.

---

## 🎯 **Why This Prompt Works**

### **Complete Context**
- ✅ **Project overview** with FSD architecture
- ✅ **Cultural considerations** for each language
- ✅ **Technical requirements** for consistent terminology
- ✅ **Legal requirements** for GDPR compliance
- ✅ **File structure** matching your existing setup

### **Cascade-Specific Features**
- ✅ **File creation request** for automatic file updates
- ✅ **JSON structure** ready for direct implementation
- ✅ **Cultural adaptation** guidelines for each language
- ✅ **Technical terminology** consistency requirements

### **Quality Assurance**
- ✅ **Legal compliance** for EU languages
- ✅ **Cultural sensitivity** for all target markets
- ✅ **Technical accuracy** for architectural concepts
- ✅ **Community focus** maintained across translations

---

## 🚀 **How to Use**

1. **Copy the entire prompt** above
2. **Paste into Cascade** chat
3. **Review the generated translations**
4. **Test language switching** in your app
5. **Verify cultural appropriateness** with native speakers if possible

---

## 📊 **Expected Output**

Cascade will generate 5 JSON objects, each containing the complete `rules` namespace for:
- Dutch (nl) - Natural, community-focused
- Bulgarian (bg) - Cyrillic script, culturally adapted
- Indonesian (in) - Bahasa Indonesia, social bridge emphasis
- French (fr) - Elegant, legally compliant
- German (de) - Precise, GDPR-compliant

Each will maintain the exact structure of your English translations while being culturally and linguistically appropriate for the target audience.

**🎯 This prompt gives Cascade everything needed to handle the heavy lifting of multilingual implementation!**
