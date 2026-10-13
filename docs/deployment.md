# Deployment

The public repository uses GPL-3.0-only, matching Pantheon. `LICENSE` contains the complete license.

GitHub Pages serves production at `https://anicolao.github.io/sabobatage/` and retained PR previews at `https://anicolao.github.io/sabobatage/prN/play/`. The Pages source is the `gh-pages` branch. Same-repository PRs publish previews; pushes to `main` publish production. Forks cannot publish. All build and verification tools run through the pinned Nix flake.

Open `/table/` directly on the shared display. It creates a room, preserves its code in the URL for reloads, and displays phone-join QR codes facing all four table edges. Players open `/hand/?room=…` through those codes; the host starts on the table after at least two phones have joined. `/play/` also offers table creation and manual room-code entry.

Both environments use the same Firebase project, `sabobatage-preview-anicolao`, including anonymous Authentication and the default Firestore database in Toronto (`northamerica-northeast2`). The project ID retains its original preview suffix but is the shared production backend. Room links should be shared from the deployment where the room was opened so everyone runs the same game version.

Configure repository variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` from the Firebase web app configuration. These are public client configuration; no Google credentials are needed in GitHub Actions. Cloud builds explicitly disable local emulators.

Firebase setup requires anonymous sign-in enabled and `anicolao.github.io` authorized in Authentication. Deploy reviewed Firestore rule changes using `nix develop --command bunx firebase deploy --only firestore:rules`. Rules apply to both previews and production, so they must remain compatible with deployed clients.

Creating a Firebase project and deploying Firestore does not initialize Authentication. For a new free project, use Authentication → Get started in the Firebase console, then enable Anonymous under Sign-in method. The public `identityPlatform:initializeAuth` API initializes the billing-dependent Identity Platform product; it is not the equivalent of this free Firebase setup flow. `auth/configuration-not-found` means the Authentication configuration is missing, not that game clients need a server or that anonymous sign-in requires billing.

Before calling a deployment playable, run `SABOBATAGE_LIVE_URL=https://anicolao.github.io/sabobatage/prN/ bunx playwright test live.spec.ts` inside `nix develop`. It opens a table directly, follows its phone links with independent identities, starts, plays, undoes, and reloads through the real Firebase backend. This intentionally creates a small test room in the shared database.

The browser applies moves optimistically and replays immutable Firestore events. There is no game server or Cloud Function.
