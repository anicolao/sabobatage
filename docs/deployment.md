# Deployment

The public repository uses GPL-3.0-only, matching Pantheon. `LICENSE` contains the complete license.

GitHub Pages serves production at `https://anicolao.github.io/sabobatage/` and retained PR previews at `https://anicolao.github.io/sabobatage/prN/play/`. The Pages source is the `gh-pages` branch. Same-repository PRs publish previews; pushes to `main` publish production. Forks cannot publish. All build and verification tools run through the pinned Nix flake.

Both environments use the same Firebase project, `sabobatage-preview-anicolao`, including anonymous Authentication and the default Firestore database in Toronto (`northamerica-northeast2`). The project ID retains its original preview suffix but is the shared production backend. Room links should be shared from the deployment where the room was opened so everyone runs the same game version.

Configure repository variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` from the Firebase web app configuration. These are public client configuration; no Google credentials are needed in GitHub Actions. Cloud builds explicitly disable local emulators.

Firebase setup requires anonymous sign-in enabled and `anicolao.github.io` authorized in Authentication. Deploy reviewed Firestore rule changes using `nix develop --command bunx firebase deploy --only firestore:rules`. Rules apply to both previews and production, so they must remain compatible with deployed clients.

The browser applies moves optimistically and replays immutable Firestore events. There is no game server or Cloud Function.
