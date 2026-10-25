
# FORGE Desktop — Electron Application

This directory contains FORGE's Electron main and preload processes, together with the Windows installer configuration.

The application combines a React/Vite client, a local Express API and a SQLite database inside a desktop application.

## Key files

| Path | Purpose |
| --- | --- |
| `main.js` | Window lifecycle, database initialization, backend management and IPC |
| `preload.cjs` | Restricted Electron API bridge |
| `package.json` | Electron scripts and electron-builder configuration |
| `assets/logo-transparent.ico` | Windows application icon |
| `dist/` | Generated packaging artifacts, excluded from Git |

## Application lifecycle

On launch, Electron:

1. Resolves application resources and the user database location.
2. Initializes the database if this is the first launch.
3. Starts the Express backend as a managed subprocess.
4. Verifies the backend's instance identity.
5. Loads the compiled React frontend into the desktop window.

The backend runs locally on:

```text
127.0.0.1:5000
```

Avoid running another FORGE backend on that port while launching Electron.

The process instance ID is used to verify that Electron has reached its managed backend. It is **not** an authentication token.

## Development

Install dependencies in the frontend, backend and Electron folders.

From the project root:

```powershell
cd client
npm install
npm run build

cd ../server
npm install

cd ../electron
npm install
npm start
```

The React frontend must be built before launching this desktop development flow.

The application uses its managed SQLite database rather than the manually initialized backend development database.

## Building Windows applications

From the project root:

```powershell
cd client
npm run build

cd ../electron
npm run pack:dir
```

This creates an unpacked Windows application.

To build an NSIS installer:

```powershell
npm run dist
```

Generated artifacts are written to:

```text
electron/dist/
```

Examples include the unpacked application, installer executable, and electron-builder metadata.

These files are intentionally excluded from the public Git repository.

## Packaging configuration

The electron-builder configuration includes:

- Electron's main and preload files.
- The compiled React frontend.
- Selected backend source files.
- Backend runtime dependencies.
- The SQLite schema and desktop seed.
- Application icons and Windows packaging configuration.

The installer must not include actual user databases, secrets, or development-only configuration.

## Electron preload bridge

The renderer interacts with selected desktop functionality through:

```javascript
window.forgeDesktop
```

This restricted bridge exposes operations related to:

- Selecting database backups.
- Validating backups.
- Preparing and executing restores.
- Performing restore dry runs.
- Testing backend restart behavior.

React components should use this bridge instead of accessing Node.js filesystem APIs directly.

## Persistent application data

User data is stored outside the installation directory.

For Windows, the usual path is:

```text
%APPDATA%\FORGE\data\forge.sqlite
```

Keeping the database outside the installation directory helps preserve records across application updates and reinstalls, subject to the installer's actual uninstall behavior.

## Release considerations

Before distributing a Windows installer:

1. Test installation and startup on a clean Windows system.
2. Verify first-run database initialization.
3. Confirm data persists after closing and reopening FORGE.
4. Test backup and restore functionality.
5. Check bundled files for secrets and personal information.
6. Review third-party licenses and notices.
7. Verify upgrade and uninstall behavior.
8. Confirm end-user installation and usage terms.

The public repository currently provides source code, **not a downloadable installer**.

## License metadata

The original uploaded project declared:

```json
"license": "ISC"
```

If FORGE is intended to remain proprietary, change that metadata in `electron/package.json` to:

```json
"license": "UNLICENSED",
"private": true
```

This does not override third-party licenses or revoke permissions already granted under a previous license.

## Copyright and license

Copyright © 2026 ACodes3. All rights reserved in the author's original code and documentation.

Public source availability is for portfolio review; no general license to reuse or redistribute the original code is granted unless separately authorized.

Third-party dependencies and assets retain their own rights and license terms. See the repository's `LICENSE` and `COPYRIGHT.md` for further information.
