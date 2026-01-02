# Internationalization (i18n) Setup

This project is now configured with full internationalization support for **English** and **Spanish**.

## How It Works

### Installation

The following packages have been installed:

- `i18next` - The core internationalization framework
- `react-i18next` - React bindings for i18next

### File Structure

```
src/
├── i18n/
│   ├── config.ts                 # i18next configuration
│   └── locales/
│       ├── en.json              # English translations
│       └── es.json              # Spanish translations
├── contexts/
│   └── I18nContext.tsx           # Language context provider
└── ...
```

## Usage

### 1. Using Translations in Components

Import and use the `useTranslation` hook from `react-i18next`:

```tsx
import { useTranslation } from "react-i18next";

export function MyComponent() {
  const { t } = useTranslation();

  return <div>{t("hero.title")}</div>;
}
```

### 2. Switching Languages

Use the `useI18n` hook from the I18nContext to switch languages:

```tsx
import { useI18n } from "../contexts/I18nContext";

export function LanguageButton() {
  const { setLanguage, language } = useI18n();

  return <button onClick={() => setLanguage("es")}>Switch to Spanish</button>;
}
```

### 3. Adding New Translations

1. **Add the key-value pair to both translation files:**

   In `src/i18n/locales/en.json`:

   ```json
   {
     "myFeature": {
       "title": "My Feature Title",
       "description": "My Feature Description"
     }
   }
   ```

   In `src/i18n/locales/es.json`:

   ```json
   {
     "myFeature": {
       "title": "Título de Mi Función",
       "description": "Descripción de Mi Función"
     }
   }
   ```

2. **Use the translation in your component:**
   ```tsx
   const { t } = useTranslation();
   return <h1>{t("myFeature.title")}</h1>;
   ```

## Language Persistence

The selected language is automatically saved to `localStorage` with the key `i18nLanguage`. This means:

- Users' language preference persists across sessions
- The app loads in the user's previously selected language

## Translation Keys

All available translation keys are organized by feature. Here's a quick reference:

- **Header**: `header.*` (search, logout, balance, language label, deadline tooltip)
- **Authentication**: `auth.*` (sign in messages)
- **Hero Section**: `hero.*` (welcome title and subtitle)
- **Categories**: `categories.*` (category names)
- **Snack Card**: `snackCard.*` (votes, prices, top voters)
- **Czar Panel**: `czarPanel.*` (administration features)
- **Add Product Modal**: `addProductModal.*` (new snack form)
- **Purchase Ad Modal**: `purchaseAdModal.*` (ad purchase form)
- **Footer**: `footer.*` (copyright info)
- **Common**: `common.*` (generic buttons and labels)

## Best Practices

1. **Always use translation keys** - Don't hardcode strings that users will see
2. **Keep key names consistent** - Use dot notation (e.g., `section.subsection.key`)
3. **Organize by feature** - Group related translations together
4. **Test both languages** - Verify translations work properly for different text lengths
5. **Check for missing translations** - i18next will show fallback keys if translations are missing

## Current Language Coverage

- ✅ English (en)
- ✅ Spanish (es)

## Adding More Languages

To add a new language (e.g., French):

1. Create `src/i18n/locales/fr.json` with all translation keys
2. Update `src/i18n/config.ts`:

   ```tsx
   import frTranslations from "./locales/fr.json";

   // In the resources object:
   fr: {
     translation: frTranslations;
   }
   ```

3. Update the language selector buttons in components as needed

## Troubleshooting

**Issue**: Translations not showing, showing key names instead

- **Solution**: Make sure you've added the key to both `en.json` and `es.json`

**Issue**: Language not persisting on page reload

- **Solution**: Check that `localStorage` is enabled in the browser

**Issue**: Component not updating when language changes

- **Solution**: Make sure you're using the `useTranslation()` hook from `react-i18next`

## Documentation

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
