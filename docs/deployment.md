# Deployment

The public repository uses GPL-3.0-only, matching Pantheon. `LICENSE` contains the complete license.

GitHub Pages serves production at `https://anicolao.github.io/sabobatage/` and retained PR previews at `https://anicolao.github.io/sabobatage/prN/play/`. The Pages source is the `gh-pages` branch. Same-repository PRs publish previews; pushes to `main` publish production. Forks cannot publish. All build and verification tools run through the pinned Nix flake.

Open `/table/` directly on the shared display. It creates a room, preserves its code in the URL for reloads, and displays phone-join QR codes facing all four table edges. Players open `/hand/?room=…` through those codes; the host starts on the table after at least two phones have joined. `/play/` also offers table creation and manual room-code entry.

For online PvP, open `/play/`, enter a shop name, and choose **Create web game**. The host joins as a player and shares `/play/?room=…` with friends. Guests can also enter the code under **Join web game**. Every player has their own private browser hand, and the host starts in that same view. The separate **Create tabletop game** link opens `/table/`. Both modes replay the same immutable event stream; the URL selects the private player or public tabletop presentation.

Both environments use the same Firebase project, `sabobatage-preview-anicolao`, including anonymous Authentication and the default Firestore database in Toronto (`northamerica-northeast2`). The project ID retains its original preview suffix but is the shared production backend. Room links should be shared from the deployment where the room was opened so everyone runs the same game version.

Configure repository variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` from the Firebase web app configuration. These are public client configuration; no Google credentials are needed in GitHub Actions. Cloud builds explicitly disable local emulators.

Firebase setup declares anonymous sign-in in `firebase.json`, following Pantheon. With an authenticated Firebase CLI, provision it and deploy the reviewed Firestore rules using:

```sh
nix develop --command bunx firebase deploy --only auth,firestore:rules --project sabobatage-preview-anicolao
```

This initializes Authentication and enables the anonymous provider without browser setup or a billing account. Anonymous sign-in does not require adding the GitHub Pages domain to the OAuth authorized-domain list. Rules apply to both previews and production, so they must remain compatible with deployed clients.

Creating a Firebase project and deploying only Firestore does not initialize Authentication. `auth/configuration-not-found` means the Authentication configuration is missing: deploy the `auth` configuration above. Do not substitute the billing-dependent `identityPlatform:initializeAuth` API for the CLI provisioning flow.

Before calling a deployment playable, run `SABOBATAGE_LIVE_URL=https://anicolao.github.io/sabobatage/prN/ bunx playwright test live.spec.ts` inside `nix develop`. It opens a table directly, follows its phone links with independent identities, starts, plays, undoes, and reloads through the real Firebase backend. This intentionally creates a small test room in the shared database.

The browser applies moves optimistically and replays immutable Firestore events. There is no game server or Cloud Function.
