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
- Responsive, modern light theme UI

## Run
- npm start — start dev server at http://localhost:3000
- npm run build — production build

No environment variables are required.
