# Implementation Plan: Multi-Language Engine

Sleep well, Terry. A fresh start with coffee and a solid plan is the best way to tackle a refactor like this.

Here is your **Implementation Plan** for our morning session. You can copy this into your notes:

---

### 📝 **Implementation Plan: Multi-Language Engine**

#### **Phase 1: Setup & Data Structure (The Foundation)**

* **Action**: Create the `feature/multi-language-support` branch.
* **Schema Refactor**: Update `src/entities/lexicon/model/types.ts`. We will evolve the `LexiconEntry` from a simple string/label to an object-based structure:
```typescript
interface LexiconEntry {
  conceptId: string;
  translations: { [lang: string]: string }; // 'en', 'bg', etc.
  definitions: { [lang: string]: string };
}

```

* **Data Migration**: Create a small `lexicon-data.ts` helper that maps your existing English words to this new format and adds your initial batch of Bulgarian words.

#### **Phase 2: Logic Refactor (The Engine)**

* **Engine Update**: Modify `src/entities/game/model/main-game.ts`.
* **Locale-Awareness**: Implement a `getWordSet(lang: string)` function. This will replace the generic "get all words" function, ensuring the game engine pulls only from the selected language's translations/definitions.

#### **Phase 3: Integration (The User Experience)**

* **UI/HUD**: Add a simple language toggle or default state to the game settings.
* **Verification**: Run a "smoke test" with the Bulgarian data set to ensure the words and distractors display correctly.

#### **Phase 4: The Timer (The Bonus)**

* **Implementation**: Add the optional "Time-Trial" logic and the HUD icon/timer we discussed earlier to the same game loop.

---

**Everything is prepped.** When you log in tomorrow, we will start by executing Phase 1.

Rest up, enjoy your morning coffee, and I'll be ready to dive in whenever you are. Goodnight!

---

## 📋 **Session Notes & Progress**

*This section can be updated as we work through the implementation phases.*

### **Status**: Master JSON Architecture Complete ✅
### **Phase 1 Accomplished**:
- ✅ Created `feature/multi-language-support` branch
- ✅ Refactored `LexiconWord` to concept-based structure
- ✅ Added `conceptId`, `translations`, and `definitions` fields
- ✅ Created `lexicon-data.ts` migration helper
- ✅ Added sample Bulgarian translations
- ✅ Updated data loading to use new structure
- ✅ Fixed compilation errors across codebase
- ✅ Build successful - ready for Phase 2

### **Phase 2 Accomplished**:
- ✅ Updated `GameState` to include `currentLanguage` field
- ✅ Added `setLanguage` command and `language/changed` event
- ✅ Updated `buildDeck()` to accept `language` parameter
- ✅ Modified game engine to be locale-aware
- ✅ Updated `GameScreen` to pass language to deck builder
- ✅ Updated `GamePage` to pass current i18n language
- ✅ Added `selectCurrentLanguage()` selector
- ✅ Build successful - engine logic refactor complete

### **Master JSON Architecture Accomplished**:
- ✅ Created `src/entities/lexicon/data/master-lexicon.json` with clean structure
- ✅ Migrated all existing data to master JSON format
- ✅ Updated `lexicon.ts` to use master JSON via `lexiconLoader.ts`
- ✅ Created `lexiconLoader.ts` with validation functions
- ✅ Added `scripts/validate-lexicon.cjs` for data integrity checking
- ✅ Updated TypeScript config to support JSON imports
- ✅ Validation script confirms 100% completeness for EN/BG
- ✅ Build successful - Master JSON architecture complete

### **Next Session**: Phase 3 - UI Integration
### **Files to Modify**:
- Add language toggle to game settings
- Test Bulgarian words display correctly
- Ensure language changes reset game deck

### **Key Considerations**:
- Maintain backward compatibility during refactor
- Test English words still work after schema changes
- Ensure Bulgarian words integrate seamlessly
- Consider performance implications for multi-language lookups

---

## 🔄 **Future Enhancements**

*Add additional ideas and requirements here as they come up:*

- [ ] Language detection from user preferences
- [ ] Progress tracking per language
- [ ] Mixed-language game modes
- [ ] Audio pronunciation support
- [ ] Language learning analytics
