# ebr-tracker-maker

A web-based tool for generating print-quality custom campaign tracker PDFs for
Earthborne Rangers. Built with **SvelteKit + adapter-static**, hosted on GitHub
Pages. This is a community-created tool; it is not officially endorsed by or
affiliated with Earthborne Games.

## What it does

1. Presents a live in-browser preview of a custom campaign tracker sheet
2. Lets users edit tracker fields
3. Prints or saves the result as a PDF via the browser's print dialog

## Tech stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit + adapter-static (static site) |
| Frontend | Svelte 5, TypeScript |
| PDF output | Client-side HTML/CSS + `window.print()` |
| Hosting | GitHub Pages |

## Development Setup

### Prerequisites

- **Node.js** (LTS) - [nodejs.org/en/download](https://nodejs.org/en/download) or via your platform's package manager (`winget install OpenJS.NodeJS.LTS`, `brew install node`, etc.)

### Build & Run

```powershell
# Install dependencies
npm install

# Run dev server (hot-reload)
npm run dev

# Build static site
npm run build

# Preview the production build locally
npm run preview
```

The dev server runs at `http://localhost:5173` by default. The preview server runs at `http://localhost:4173`.

### Testing

```powershell
# Type-check
npm run check

# Unit tests
npm test
```

Print output is verified manually: open the print dialog (Ctrl/Cmd+P), and choose
"Save as PDF".

## Deployment

Pushes to `main` trigger the [Deploy to GitHub Pages](.github/workflows/deploy.yml)
workflow, which builds the static site (with `BASE_PATH=/ebr-tracker-maker`) and
publishes it to GitHub Pages.
