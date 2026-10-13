# ConfigCanvas

ConfigCanvas is a fully local, browser-based, open-source configuration file editor.
It allows users to drop a JSON file and instantly generate a usable settings panel. Users can edit values without writing code and download the valid JSON result.

## Features
- **Local-first**: All file processing happens in the browser. No server interaction, no data sent externally.
- **Two-way Synchronization**: Edit via the visual form panel or the raw JSON CodeMirror editor. Changes sync instantly.
- **Unified Undo/Redo**: A single history stack tracks changes across both the form and the code editor.
- **Precision-Safe Numbers**: Automatically detects and handles large integers or highly precise floats that JavaScript's native number type would silently truncate or corrupt.
- **Invalid JSON Handling**: If you make a syntax error in the code editor, the form will pause synchronization and display the last valid state until the error is fixed.
- **Diff View**: Compare your current valid edits against the originally loaded file.
- **Search**: Filter fields by name, path, or value in the form view.
- **Mobile Friendly**: Responsive design with tabbed navigation on smaller screens.

## Technical Stack
- React 19
- Vite
- TypeScript
- TailwindCSS v4
- CodeMirror 6
- Vitest & React Testing Library

## Quick Start & Development

### Installation
Make sure you have Node.js installed, then install dependencies:
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Run Tests
```bash
npx vitest run
```

### Build for Production
To build a static application suitable for deployment (e.g., GitHub Pages):
```bash
npm run build
```
The output will be generated in the `dist` folder.

## Deployment
ConfigCanvas is a purely static site. After running `npm run build`, you can deploy the contents of the `dist` directory to any static file host like GitHub Pages, Vercel, Netlify, or Amazon S3. No backend or database is required.

### GitHub Pages Setup
This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application to GitHub Pages whenever you push to the `main` branch.

To enable this:
1. Go to your repository **Settings** on GitHub.
2. Navigate to **Pages** on the left sidebar.
3. Under **Build and deployment**, change the **Source** to **GitHub Actions**.
4. The workflow will automatically run and publish your site to `https://<your-username>.github.io/config-canvas/`.

## License
MIT
