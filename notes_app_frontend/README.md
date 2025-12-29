# Simple Notes App (Frontend-only, React)

A lightweight React app to add, edit, delete, search, and persist notes locally in the browser (localStorage). No backend required.

## Features
- Create, edit (modal), and delete notes
- Required title with inline validation
- Timestamps for created and last updated
- Search by title with debounce
- Sort by last updated (desc)
- Local persistence via `localStorage` under `notes_app_data_v1`
- Accessible modal with focus management, keyboard friendly FAB and actions
- Responsive, modern light and dark theme UI
- Theme toggle with persistence via `localStorage` under `notes_app_theme_v1`

## Theming
- Toggle theme using the button in the header (Light/Dark with icon).
- The app stores your selection in `localStorage` (`notes_app_theme_v1`) and restores it on load.
- If no preference is stored, the app follows the system preference using `prefers-color-scheme`.
- Theming is implemented via CSS variables on `:root` with a `data-theme="dark"` attribute for dark mode.
- Accent colors follow the style guide: primary `#3b82f6` (blue) and success `#06b6d4` (cyan). Contrast has been tuned for accessibility.

## Run
- npm start — start dev server at http://localhost:3000
- npm run build — production build

No environment variables are required.
