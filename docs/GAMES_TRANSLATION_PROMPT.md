# 🌍 Games Dashboard Translation Prompt for Cascade

## 📋 **Complete Translation Generation Prompt**

Copy and paste this into Cascade to generate all missing language translations for the Games Dashboard:

---

### **🚀 The Complete Cascade Translation Prompt**

> I need to generate complete translations for my Lexicon Master Games Dashboard in 5 languages. I already have the English translations in `src/shared/lib/i18n/locales/en.json` and need to create the corresponding translations for Dutch (nl), Bulgarian (bg), Indonesian (in), French (fr), and German (de).
> 
> **Current English Structure (games section):**
> ```json
> {
>   "games": {
>     "title": "Games Hub",
>     "tagline": "Choose your adventure and connect with your village community through language learning games",
>     "quickPlay": {
>       "title": "Quick Play Zone"
>     },
>     "modes": {
>       "solo": {
>         "title": "Solo Sprint",
>         "description": "Challenge yourself to define or translate as many words as possible within a set time limit",
>         "duration": "5 minutes",
>         "difficulty": "Medium"
>       },
>       "versus": {
>         "title": "Village Versus",
>         "description": "A competitive mode where you and your neighbors compete for the highest score using the same deck of words",
>         "players": "2-8 players",
>         "duration": "10 minutes"
>       },
>       "bridge": {
>         "title": "Community Bridge",
>         "description": "A collaborative mode where players work together to build a \"Community Lexicon\" by adding definitions for new words in their mother tongue"
>       }
>     },
>     "playNow": "Play Now",
>     "playGames": "Play Games",
>     "communityBridge": {
>       "title": "The Community Bridge",
>       "currentWord": "Today's Community Word",
>       "language": "Dutch",
>       "contributions": "Contributions:",
>       "contribute": "Add Translation",
>       "recentContributions": "Recent Community Contributions"
>     },
>     "activeRooms": {
>       "title": "Active Rooms",
>       "comingSoon": "Village Tables Coming Soon",
>       "description": "Create and join small group games with friends from your village. Perfect for intimate learning sessions!",
>       "notifyMe": "Notify Me When Available"
>     },
>     "recentActivity": {
>       "title": "Recent Activity"
>     },
>     "activity": {
>       "newHighScore": "New high score achieved!",
>       "communityContribution": "Community contribution made",
>       "streakAchievement": "Streak milestone reached"
>     }
>   }
> }
> ```
> 
> **Task:**
> Generate the complete JSON content for my 5 translation files: `nl.json`, `bg.json`, `in.json`, `fr.json`, and `de.json`.
> 
> **Requirements:**
> 1. **Cultural Adaptation**: Adapt the language to be natural and culturally appropriate for each target audience
> 2. **Gaming Terminology**: Use engaging, game-friendly language that appeals to village communities
> 3. **Community Focus**: Maintain the social bridge and community collaboration emphasis
> 4. **Consistent Structure**: Match the exact JSON structure of the English version
> 5. **Technical Terms**: Keep "Community Bridge" and "Community Lexicon" consistent as these are core concepts
> 
> **Specific Translation Guidelines:**
> 
> **Dutch (nl.json):**
> - Use natural, friendly Dutch for village communities
> - "Games Hub" → "Spellen Hub" or "Spelencentrum"
> - "Quick Play Zone" → "Snelle Speelzone"
> - "Village Versus" → "Dorp Versus" or "Dorp Tegen Dorp"
> - "Community Bridge" → "Gemeenschapsbrug" (keep this concept clear)
> 
> **Bulgarian (bg.json):**
> - Use Cyrillic script appropriately
> - "Games Hub" → "Игрови център" or "Хъб за игри"
> - "Quick Play Zone" → "Зона за бърза игра"
> - "Village Versus" → "Селско състезание"
> - "Community Bridge" → "Мост на общността" (keep this concept clear)
> 
> **Indonesian (in.json):**
> - Use Bahasa Indonesia that feels natural and engaging
> - "Games Hub" → "Pusat Permainan" or "Hub Permainan"
> - "Quick Play Zone" → "Zona Main Cepat"
> - "Village Versus" → "Desa Lawan Desa"
> - "Community Bridge" → "Jembatan Komunitas" (keep this concept clear)
> 
> **French (fr.json):**
> - Use proper French with gaming-friendly language
> - "Games Hub" → "Centre de Jeux" or "Hub de Jeux"
> - "Quick Play Zone" → "Zone de Jeu Rapide"
> - "Village Versus" → "Village Contre Village"
> - "Community Bridge" → "Pont Communautaire" (keep this concept clear)
> 
> **German (de.json):**
> - Use engaging German that appeals to gaming communities
> - "Games Hub" → "Spiele-Hub" or "Spielezentrum"
> - "Quick Play Zone" → "Schnelle Spielzone"
> - "Village Versus" → "Dorf Gegen Dorf"
> - "Community Bridge" → "Gemeinschaftsbrücke" (keep this concept clear)
> 
> **Key Translation Notes:**
> - "Solo Sprint" should sound exciting and fast-paced
> - "Village Versus" should emphasize friendly competition
> - "Community Bridge" should emphasize collaboration and connection
> - "Village Tables" should feel intimate and community-focused
> - Activity feed should use engaging, achievement-oriented language
> 
> **Output Format:**
> Provide each language as a separate JSON object that I can directly copy into the corresponding files. Each should contain only the `games` object that matches the English structure.
> 
> **File Creation Request:**
> After generating the JSON content, please create/update these files:
> - `src/shared/lib/i18n/locales/nl.json`
> - `src/shared/lib/i18n/locales/bg.json`
> - `src/shared/lib/i18n/locales/in.json`
> - `src/shared/lib/i18n/locales/fr.json`
> - `src/shared/lib/i18n/locales/de.json`
> 
> Add the `games` object to each file, preserving any existing content.

---

## 🎯 **Why This Prompt Works**

### **Complete Context**
- ✅ **Current English structure** provided for reference
- ✅ **Cultural guidelines** for each target language
- ✅ **Gaming terminology** adapted for village communities
- ✅ **Community focus** maintained throughout

### **Quality Assurance**
- ✅ **Exact JSON structure** matching English version
- ✅ **Cultural adaptation** for each language
- ✅ **Consistent terminology** for core concepts
- ✅ **File creation automation** for easy implementation

### **Community-Focused Language**
- ✅ **Social bridge philosophy** emphasized
- ✅ **Village community** terminology
- ✅ **Collaborative gaming** language
- ✅ **Achievement-oriented** activity feed

---

## 🚀 **How to Use**

1. **Copy the entire prompt** above
2. **Paste into Cascade** chat
3. **Review the generated translations** for cultural appropriateness
4. **Test language switching** in your Games Dashboard
5. **Verify all sections translate properly**

---

## 📊 **Expected Output**

Cascade will generate 5 JSON objects, each containing the complete `games` namespace for:
- **Dutch (nl)** - Friendly, community-focused Dutch
- **Bulgarian (bg)** - Engaging Bulgarian with Cyrillic script
- **Indonesian (in)** - Natural Bahasa Indonesia
- **French (fr)** - Elegant, gaming-friendly French
- **German (de)** - Engaging German for gaming communities

Each will maintain the exact structure of your English translations while being culturally and linguistically appropriate for village community gaming.

---

## 🎉 **After Implementation**

Once you run this prompt and add the translations:

1. ✅ **Complete multilingual Games Dashboard**
2. ✅ **6-language support** for all gaming features
3. ✅ **Community-focused translations** in all languages
4. ✅ **Culturally appropriate gaming terminology**
5. ✅ **Ready for Village Beta testing** across all languages

**🎯 This prompt gives Cascade everything needed to handle the heavy lifting of multilingual Games Dashboard implementation!**
