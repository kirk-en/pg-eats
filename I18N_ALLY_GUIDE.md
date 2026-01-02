# i18n Ally Setup & Usage Guide

## ✅ Configuration Complete!

i18n Ally has been configured for your PG Eats project. This VS Code extension makes managing translations much easier.

## Installation

1. Install the **i18n Ally** extension in VS Code:
   - Open VS Code Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "i18n Ally"
   - Click Install (by Alex Zhang)
   - Version: Latest

## Configuration Files

### `.i18nallyrc.json` - Main Configuration

Located in your project root, this file controls:

- Translation file paths: `src/i18n/locales`
- Supported languages: English (en) and Spanish (es)
- File patterns to scan for translation keys
- Namespace settings

### `.vscode/settings.json` - VS Code Integration

Workspace-specific settings for i18n Ally that enable:

- Inline annotations showing translations
- Auto-detection of translation usage
- Keyboard shortcut support
- Key sorting and organization

## Features Now Enabled

### 1. **Hover Tooltips** 🔍

Hover over any translation key in your code to see the English and Spanish values instantly.

Example:

```tsx
const { t } = useTranslation();
return <h1>{t("hero.title")}</h1>;
//           ↑ Hover here to see the translation value
```

### 2. **Inline Annotations** 📝

See translation values directly in your code above the line (optional, can toggle in VS Code):

```tsx
// (en) What should we snack on?
// (es) ¿Qué snacks deberíamos comer?
return <h1>{t("hero.title")}</h1>;
```

### 3. **Translation Manager** 🗂️

Click the i18n Ally icon in the activity bar (left sidebar) to:

- View all translations organized by namespace
- Add new translation keys
- Edit existing translations
- Find unused keys
- Search across all languages

### 4. **Quick Actions** ⚡

Right-click on a translation key to:

- Copy the key path
- Copy the translation value
- Open in translation editor
- Find references in code

### 5. **Auto-Detect Usage** 🔎

i18n Ally automatically detects translation keys in your code when you type `t('` and shows:

- Available keys from your locale files
- Which keys are used/unused
- Key definitions and translations

## Keyboard Shortcuts

| Action               | Shortcut                               |
| -------------------- | -------------------------------------- |
| Open i18n Ally Panel | Usually in Activity Bar (left sidebar) |
| Search Translations  | Ctrl+K (when in i18n Ally view)        |
| Edit Translation     | Double-click in the panel              |
| Copy Key Path        | Ctrl+C (when key is selected)          |

## Common Tasks

### Adding a New Translation

**Method 1: Use i18n Ally Panel**

1. Click the i18n Ally icon in the left sidebar
2. Right-click in the translation tree
3. Select "Add new key"
4. Enter key name (e.g., `myFeature.title`)
5. Enter English and Spanish values
6. Save

**Method 2: Manual Edit**

1. Edit `src/i18n/locales/en.json`
2. Add your key-value pair
3. Edit `src/i18n/locales/es.json`
4. Add the Spanish translation
5. Save both files

### Finding Unused Translations

1. Open i18n Ally panel
2. Click the "Filter" icon
3. Select "Show unused keys"
4. Review and delete if needed

### Viewing All Translations

1. Click i18n Ally icon in left sidebar
2. Expand any namespace to see all keys
3. Hover over keys to see translations
4. Click to edit values

## Tips & Best Practices

✅ **Always add translations to both language files**

- Add to `en.json` AND `es.json`
- Otherwise you'll see missing key warnings

✅ **Use nested key structure**

- Good: `header.searchPlaceholder`, `snackCard.upvote`
- Bad: `headerSearchPlaceholder`

✅ **Keep key names descriptive**

- Helps find translations in code later
- Makes the translation panel more readable

✅ **Enable inline annotations for visual confirmation**

- Settings → "i18n-ally.enableInlineAnnotation": true
- Helps verify translations are correct

✅ **Periodically check for unused keys**

- Use i18n Ally's filter to find them
- Remove to keep translation files clean

## Project Structure

```
.
├── .i18nallyrc.json              ← i18n Ally config
├── .vscode/
│   └── settings.json             ← VS Code i18n Ally settings
├── src/
│   └── i18n/
│       └── locales/
│           ├── en.json           ← English translations
│           └── es.json           ← Spanish translations
└── src/components/
    └── ...                       ← Your React components
```

## Troubleshooting

**Problem**: i18n Ally doesn't show translations

- **Solution**: Reload VS Code window (Ctrl+Shift+P → Developer: Reload Window)

**Problem**: Inline annotations not showing

- **Solution**: Check `.vscode/settings.json` has `"i18n-ally.enableInlineAnnotation": true`

**Problem**: Keys not being detected

- **Solution**: Make sure file paths in `.i18nallyrc.json` match your actual structure

**Problem**: Can't add translations in panel

- **Solution**: Try manual edit in JSON files, or check file permissions

## Resources

- [i18n Ally GitHub](https://github.com/lokalise/i18n-ally)
- [i18n Ally Docs](https://i18n-ally.js.org/)
- [i18next Documentation](https://www.i18next.com/)

---

You're all set! i18n Ally will significantly speed up your translation workflow. Enjoy! 🚀
