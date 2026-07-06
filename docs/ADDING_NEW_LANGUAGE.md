# Adding New Languages to Lexicon Master

This guide provides a standardized process for adding new languages to the multi-language lexicon system.

## 📋 Process Recipe

### 1. **Preparation**
- [ ] Identify the language code (ISO 639-1 format, e.g., 'nl' for Dutch, 'in' for Indonesian)
- [ ] Ensure you have translations for all existing concepts
- [ ] Run validation script to confirm current state: `node scripts/validate-lexicon.cjs`

### 2. **Data Entry**
- [ ] Open `src/entities/lexicon/data/master-lexicon.json`
- [ ] For each concept, add the new language to both `translations` and `definitions` objects
- [ ] Follow the exact JSON structure (no trailing commas)
- [ ] Save the file

### 3. **Validation**
- [ ] Run validation script: `node scripts/validate-lexicon.cjs`
- [ ] Fix any missing translations or definitions reported
- [ ] Ensure 100% completeness for the new language
- [ ] Run build to verify TypeScript compilation: `npm run build`

### 4. **UI Integration**
- [ ] Update `src/shared/lib/i18n/` to add new language locale files
- [ ] Update i18n configuration to include the new language
- [ ] Test the language in the browser interface
- [ ] Verify both terms and definitions display correctly

### 5. **Testing**
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to game and select new language
- [ ] Play a few rounds to verify all content is in the new language
- [ ] Check browser console for any errors

## 📝 Example Entry

### Copy-Paste Template

When adding a new language (e.g., Dutch 'nl'), each concept should follow this exact structure:

```json
{
  "id": "word_001",
  "conceptId": "concept_001",
  "translations": {
    "en": "aberration",
    "bg": "аберация",
    "nl": "afwijking"
  },
  "definitions": {
    "en": "a departure from what is normal, usual, or expected, typically one that is unwelcome",
    "bg": "отклонение от това, което е нормално, обичайно или очаквано, обикновено нежелано",
    "nl": "een afwijking van wat normaal, gebruikelijk of verwacht is, meestal ongewenst"
  },
  "coord": {
    "scroll": "A-C",
    "page": 1,
    "column": 1,
    "wordNumber": 1
  }
}
```

### Key Requirements:
- **Language Code**: Use ISO 639-1 format (2 letters)
- **Both Objects**: Add to BOTH `translations` AND `definitions`
- **No Trailing Commas**: Ensure valid JSON syntax
- **Consistent Order**: Keep languages in alphabetical order (en, bg, nl, etc.)

## 🛠️ Validation Script

### Running Validation
```bash
node scripts/validate-lexicon.cjs
```

### Expected Output
```
🔍 Validating Master Lexicon...
📁 Path: C:\dictionary_game\src\entities\lexicon\data\master-lexicon.json

📊 Summary:
   Total words: 10
   Unique concepts: 10
   Languages: bg, en, nl

📚 Language Completeness:
   en: 10/10 (100.0%)
   bg: 10/10 (100.0%)
   nl: 10/10 (100.0%)

✅ Lexicon validation passed!
```

## 🚨 Troubleshooting

### Missing Keys Error
If the validation script reports missing translations:

```
⚠️  Warnings:
   Entry 5 (concept_005): Missing translation for 'nl'
   Entry 7 (concept_007): Missing definition for 'nl'
```

**Solution:**
1. Find the reported conceptId in `master-lexicon.json`
2. Add the missing translation/definition for the new language
3. Re-run validation script
4. Repeat until 100% completeness is achieved

### TypeScript Compilation Error
If build fails after adding new language:

**Solution:**
1. Check JSON syntax (no trailing commas)
2. Verify all objects have required fields
3. Run `npm run build` to identify specific errors
4. Fix reported issues and retry

### Language Not Showing in UI
If new language doesn't appear in language selector:

**Solution:**
1. Check i18n configuration files
2. Verify language code matches UI configuration
3. Restart dev server
4. Clear browser cache

## 📚 Quick Reference

### Language Codes (ISO 639-1)
- `en` - English
- `bg` - Bulgarian  
- `nl` - Dutch
- `de` - German
- `fr` - French
- `es` - Spanish
- `it` - Italian
- `pt` - Portuguese
- `in` - Indonesian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

### Validation Commands
```bash
# Validate lexicon data
node scripts/validate-lexicon.cjs

# Test basic functionality
node scripts/test-lexicon.cjs

# Build project
npm run build

# Start development server
npm run dev
```

### File Locations
- **Master Data**: `src/entities/lexicon/data/master-lexicon.json`
- **Validation Script**: `scripts/validate-lexicon.cjs`
- **Test Script**: `scripts/test-lexicon.cjs`
- **Deck Builder**: `src/features/play-round/model/deck.ts`
- **UI Components**: `src/features/play-round/ui/GameScreen.tsx`

## 🔄 Integration Checklist

After adding a new language, ensure these components are updated:

- [ ] **Lexicon Data**: All concepts have new language translations/definitions
- [ ] **Validation Script**: Reports 100% completeness
- [ ] **Build Process**: TypeScript compilation succeeds
- [ ] **i18n Files**: New language locale files added
- [ ] **UI Configuration**: Language appears in selector
- [ ] **Game Testing**: All game content displays in new language
- [ ] **Documentation**: Update any language-specific documentation

## 📈 Scaling Tips

1. **Batch Processing**: Add multiple concepts at once to minimize validation cycles
2. **Translation Tools**: Use translation memory tools for consistency
3. **Review Process**: Have native speakers review translations
4. **Incremental Testing**: Test after every 10-20 concepts added
5. **Backup Strategy**: Commit working states frequently

---

**Remember**: The validation script is your best friend. Run it often to catch issues early! 🎯
