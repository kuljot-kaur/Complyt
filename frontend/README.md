# Complyt AI Frontend (React)

React + Vite executive UI for Complyt AI, rebuilt from the Obsidian Executive reference screens.

## Stack

- React 18
- Vite 5
- TypeScript
- React Router
- Axios

## Pages

- `/login` - executive login
- `/dashboard` - operational metrics and recent documents
- `/upload` - upload and pipeline initiation
- `/processing/:taskId` - active processing stream view
- `/results/:taskId` - compliance analysis output
- `/history` - searchable and filterable document archive
- `/document/:documentId` - deep document detail
- `/settings` - workspace settings placeholder

## Run

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment

Create a `.env.local` file from `.env.local.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Complyt AI
VITE_ALLOW_DEMO=true
```

## API Notes

The frontend attempts backend APIs first and falls back to local mock data for display continuity when backend endpoints are unavailable in development.
