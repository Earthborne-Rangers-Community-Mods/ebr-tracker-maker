# Contributing to ebr-tracker-maker

The tracker maker is a SvelteKit web app that generates print-quality custom
campaign tracker PDFs for Earthborne Rangers. It runs entirely in the browser -
no install, no account, no server. Contributions that improve the tool are
welcome.

## Getting Started

### Prerequisites

- Node.js (LTS)

### Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. See the [README](../README.md)
for full build and testing instructions.

## How to Contribute

1. Fork this repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm run check` and verify no TypeScript errors
5. Test manually in the browser, including the print / save-as-PDF output
6. Open a pull request against `main`

### What We Accept

- Bug fixes
- Print-fidelity improvements
- Accessibility improvements
- Documentation improvements

### What Requires Discussion First

Open an issue before working on:

- New features or UI changes
- Dependency additions or upgrades
- Changes to the tracker layout or print output

## Code Style

- TypeScript for all source files
- Svelte 5 component syntax

## Testing

- Run tests with `npm test`
- UI and print output are tested manually

## Commit Messages

Use clear, descriptive commit messages.

## Questions

Open a GitHub issue for questions about the codebase or contribution process.
