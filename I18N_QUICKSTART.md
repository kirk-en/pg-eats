# i18n Quick Start Guide

## Running Your App with i18n Enabled

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Look for the **Language Selector** in the header:

   - Located in the top navigation bar
   - Shows "Lang" label with "En" and "Es" buttons
   - Also available in the mobile menu drawer

3. Click to switch between:
   - **En** - English
   - **Es** - Spanish

## Testing i18n

### In the UI

- Click the language buttons in the header
- Verify all text changes:
  - Header labels (Office, search placeholder, balance)
  - Hero section title and subtitle
  - Footer copyright text
  - All button labels and tooltips

### In the Browser Console

```javascript
// Check current language
console.log(localStorage.getItem("i18nLanguage"));

// Manually test i18next
window.i18next.changeLanguage("es"); // Switch to Spanish
window.i18next.changeLanguage("en"); // Switch to English
```

## Common Translation Keys to Verify

```
header.searchPlaceholder    → "Search snacks..." or "Buscar snacks..."
hero.title                  → "What should we snack on?" or "¿Qué snacks deberíamos comer?"
header.logout              → "Logout" or "Cerrar sesión"
footer.credits             → "© 2024 PG Eats..." (in both languages)
```

## Adding a New Component with i18n

Example: Adding translations to `SnackCard` component

1. **Add translations to locale files:**

   `src/i18n/locales/en.json`:

   ```json
   {
     "snackCard": {
       "upvote": "Upvote",
       "downvote": "Downvote"
     }
   }
   ```

   `src/i18n/locales/es.json`:

   ```json
   {
     "snackCard": {
       "upvote": "Voto positivo",
       "downvote": "Voto negativo"
     }
   }
   ```

2. **Use in component:**

   ```tsx
   import { useTranslation } from "react-i18next";

   export function SnackCard() {
     const { t } = useTranslation();

     return <button>{t("snackCard.upvote")}</button>;
   }
   ```

## Troubleshooting

**Problem**: Not seeing language button in header  
**Solution**: Check that `Header.tsx` includes the `LanguageSelector` component

**Problem**: Language not persisting on page reload  
**Solution**: Ensure localStorage is not blocked in browser privacy settings

**Problem**: Seeing untranslated keys like "snackCard.title"  
**Solution**: Add the key to both `en.json` and `es.json` files

**Problem**: Text is in English even after switching to Spanish  
**Solution**:

1. Check browser DevTools for console errors
2. Verify the translation key exactly matches the path in locale files
3. Clear browser cache and localStorage

## Helpful Links

- Full documentation: [src/i18n/README.md](src/i18n/README.md)
- i18next docs: https://www.i18next.com/
- React-i18next docs: https://react.i18next.com/

## Tips

- Always add translations to BOTH English and Spanish files
- Use dot notation for nested keys: `feature.section.item`
- Keep key names consistent and descriptive
- Test both languages before deploying
