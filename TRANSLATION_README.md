# Translation Synchronization Rules

## 📋 **Cascade Translation Synchronization Prompt**

> "I have observed that the UI is reverting to untranslated keys instead of using the values from my `.json` files. We must maintain strict synchronization between code and localization.
> **Task:**
> 1. **Restore Translations**: Please inspect the current `en.json` and ensure all keys used in the UI are correctly mapped and populated.
> 2. **Establish the 'i18n-First' Rule**: From now on, **all new UI components must be built with i18n keys from the start**. Never hardcode English strings directly into components.
> 3. **Sync Workflow**: Whenever you modify or create a UI component, you are required to simultaneously:
> * Add the corresponding keys to `src/shared/lib/i18n/locales/en.json`.
> * Ensure the component uses `useTranslation` to reference those keys.
> 
> 
> 4. **Verification**: Before concluding any task, perform a check to ensure that the displayed UI matches the translations in the JSON files, rather than displaying raw key names like `games.quickPlay.title`.
> 
> 
> If you detect any UI element showing a raw key name, fix it immediately by adding the missing entry to the `en.json` file."

---

## 🎯 **i18n-First Development Rule**

### **Core Principle**
- **NEVER** hardcode English strings in UI components
- **ALWAYS** use translation keys from the moment of component creation
- **SIMULTANEOUSLY** update both code and translation files

### **Required Workflow**

#### 1. **When Creating New Components**
```tsx
// ❌ WRONG - Hardcoded strings
export function MyComponent() {
  return (
    <div>
      <h1>Welcome to Lexicon Master</h1>
      <p>Start your journey now</p>
    </div>
  )
}

// ✅ CORRECT - i18n-first approach
export function MyComponent() {
  const { t } = useTranslate()
  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.description')}</p>
    </div>
  )
}
```

#### 2. **When Modifying Existing Components**
- Add new translation keys to `en.json` **BEFORE** using them in code
- Update the component to use the new keys
- Test that translations display correctly (not raw key names)

#### 3. **Translation Key Organization**
```json
{
  "componentName": {
    "title": "Component Title",
    "description": "Component description",
    "actions": {
      "submit": "Submit",
      "cancel": "Cancel"
    }
  }
}
```

### **Post-Task Verification Checklist**

Before completing any task, ask yourself:

- ✅ **Did I verify that all new text elements are mapped to an i18n key in `en.json`?**
- ✅ **Are all components using `useTranslate()` hook?**
- ✅ **Do any UI elements show raw key names (like `games.quickPlay.title`)?**
- ✅ **Are translation keys organized logically by component?**

### **Emergency Fix Protocol**

If you see raw key names in the UI:

1. **Immediate Fix**: Add the missing key to `en.json`
2. **Root Cause**: Identify why the key was missing
3. **Prevention**: Ensure the component uses proper i18n structure

### **File Structure**

```
src/shared/lib/i18n/
├── locales/
│   ├── en.json          # Primary translation file
│   ├── nl.json          # Dutch translations
│   └── ...              # Other languages
├── useTranslate.ts      # Hook for components
├── types.ts            # TypeScript definitions
└── index.ts            # Public API
```

---

## 💡 **Pro-Tip for Prevention**

To prevent this in the future, add this **post-task checklist** to your standard workflow with Cascade. Whenever it says "I've finished the changes," ask:

> *"Did you verify that all new text elements are mapped to an i18n key in `en.json`?"*

This reinforces the requirement that the code and the translations must always evolve together.

---

## 🚨 **Critical Rules**

1. **No Hardcoded Strings**: Never write English text directly in JSX
2. **Simultaneous Updates**: Code and translations must be updated together
3. **Key Verification**: Always test that translations display, not key names
4. **Logical Organization**: Group keys by component/feature
5. **Type Safety**: Use TypeScript definitions for translation paths

---

## 📞 **When in Doubt**

If you're unsure about a translation key:
1. Check existing patterns in `en.json`
2. Follow the component-based organization
3. Ask for clarification rather than hardcoding
4. Test immediately after implementation

**Remember**: Translation synchronization is not optional—it's a fundamental requirement for maintaining a consistent, multilingual user experience.
