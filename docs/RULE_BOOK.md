# 📖 Lexicon Master: Official Rule Book

Welcome to **Lexicon Master**! This game is designed to celebrate our diverse village community by turning language learning into a social, collaborative experience. Whether you speak English, Dutch, Bulgarian, Indonesian, French, or German, the rules remain the same.

---

## 🎯 **1. The Objective**

The goal of Lexicon Master is to build the highest-scoring vocabulary sequence by selecting words that connect logically, creatively, or grammatically, depending on the game mode.

---

## 🎮 **2. How to Play**

### **The Dealer**
The game starts with the Dealer (the application) presenting a set of vocabulary words based on your chosen language.

### **Selection**
Players take turns or compete to select words from the available deck.

### **The Log**
Every selection is recorded as an event in the `event-log`. This log ensures the game state is fair, immutable, and verifiable for all players.

### **Scoring**
Points are awarded based on word complexity, connection strategy, and speed.

---

## 🏆 **3. Game Modes**

### **Solo Sprint**
Challenge yourself to define or translate as many words as possible within a set time limit.

### **Village Versus**
A competitive mode where you and your neighbors compete for the highest score using the same deck of words.

### **Community Bridge**
A collaborative mode where players work together to build a "Community Lexicon" by adding definitions for new words in their mother tongue.

---

## 📋 **4. Important Rules**

### **Language Independence**
You may change your interface language at any time via the Profile settings. The game state will remain the same for everyone in the match, regardless of the language they are viewing it in.

### **Fair Play (The Blind Arbiter)**
Lexicon Master uses a "Blind Arbiter" system. The game state is derived strictly from the events recorded in the log, ensuring no player—or the game itself—can cheat or alter history once a word is played.

### **Community Contribution**
If you come across a word that needs a better definition or a translation in a new language, use the "Suggest" feature. Your contribution will be recorded with your name attached, helping your neighbors learn.

---

## 🔒 **5. Privacy & Ethics**

### **GDPR Compliance**
We take your data privacy seriously. All personal data is encrypted using AES-256-GCM and stored within the EU.

### **The Right to be Forgotten**
You can request the permanent deletion of your data at any time via the "Crypto-Shredding" feature in your profile. This renders your personal logs unrecoverable, fulfilling your right to be forgotten.

---

## 💡 **Tips for Village Testers**

### **Collaborate**
Try the "Community Bridge" mode with a neighbor who speaks a different language. It's the fastest way to learn!

### **Consistency**
Play regularly to improve your personal streak and contribute to the village leaderboard.

### **Feedback**
Use the `VILLAGE_BETA_GUIDE.md` to report any words that seem incorrect or culturally insensitive.

---

## 🛠️ **Implementation Notes**

### **UI Component Structure**
This rule book can be implemented as a `RuleBook.tsx` component in your `src/shared/ui` or `src/pages/help` directory.

### **Internationalization**
The entire rule book uses your existing `i18n` system, so it will automatically translate when a player changes their language settings.

### **Translation Keys**
All content should be broken down into translation keys for your `en.json`, `nl.json`, `bg.json`, `in.json`, `fr.json`, and `de.json` files.

---

## 🌍 **Community Focus**

### **Social Bridge Nature**
This game is designed to connect neighbors across language barriers, creating a social bridge within your village community.

### **Cultural Exchange**
By playing together, villagers learn not just words, but also cultural context and understanding.

### **Inclusive Design**
The game supports multiple languages and accessibility features to ensure everyone in the community can participate.

---

## 📚 **Technical Architecture**

### **Event-Sourced Foundation**
Built on a universal event-sourced architecture, ensuring:
- **Immutable game history**
- **Fair play verification**
- **Deterministic replay**
- **Transparent game state**

### **Privacy-First Design**
- **Crypto-shredding** for data deletion
- **EU data hosting** (europe-west1)
- **GDPR compliance** by design
- **No tracking or analytics**

### **Multilingual Support**
- **6 languages** fully supported
- **Instant language switching**
- **Consistent game state** across languages
- **Cultural sensitivity** in translations

---

## 🎯 **Village Beta Testing**

### **What We're Testing**
1. **Game mechanics** across different languages
2. **Community engagement** and social features
3. **Privacy features** and user trust
4. **Accessibility** and inclusivity
5. **Performance** on various devices

### **How to Participate**
1. **Create an account** with email verification
2. **Choose your preferred language**
3. **Try different game modes**
4. **Provide feedback** through the beta guide
5. **Invite neighbors** to join the community

---

## 🏆 **Success Metrics**

### **Community Engagement**
- Number of active village participants
- Cross-language collaboration instances
- Community lexicon contributions
- Regular player retention

### **Educational Impact**
- Vocabulary improvement tracking
- Language switching frequency
- Definition quality contributions
- Cultural exchange instances

### **Privacy Trust**
- User confidence in data protection
- Feature usage of privacy controls
- Community feedback on privacy
- GDPR compliance verification

---

## 🚀 **Future Development**

### **Planned Features**
- **Voice pronunciation** guides
- **Image associations** for visual learners
- **Progress tracking** with certificates
- **Teacher tools** for classroom use
- **Community events** and tournaments

### **Community Contributions**
- **Word suggestions** from native speakers
- **Cultural context** additions
- **Translation improvements**
- **Accessibility enhancements**

---

## 📞 **Support & Feedback**

### **For Village Testers**
- Use the **Village Beta Guide** for detailed testing instructions
- Report issues through the **Profile page** backend tester
- Join our **community Discord** for real-time discussion
- Email **village-beta@lexicon-master.eu** for private support

### **Technical Support**
- Check the **Backend Tester** in Profile page for connectivity
- Review **Firebase status** for service availability
- Consult **FAQ** in the help section
- Contact **support@lexicon-master.eu** for technical issues

---

## 🎉 **Join the Community**

Lexicon Master is more than just a game—it's a social bridge connecting our diverse village community through language, learning, and mutual respect.

**Together, we're building not just vocabulary, but understanding.**

**Welcome to Lexicon Master!** 🌍🤝
