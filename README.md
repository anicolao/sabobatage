# Sabobatage

An unofficial 2–5 player Sabobatage implementation with a complete illustrated gallery (27 card types / 110 cards), a shared tabletop, and private phone hands.

The gameplay UI now follows the reviewed [counter-based UX design](UX_DESIGN.md): a private hand fan, focused phone counter, and public table with fixed, oriented seats. See [implementation captures and review notes](docs/ux/implementation/README.md).

## Local play

Use the pinned Nix shell for development and verification, as in Pantheon. It provides Bun, Node.js, Java, Git, GitHub CLI, Python, and ripgrep.

```sh
nix develop
bun install --frozen-lockfile
cp .env.example .env.local
bun run emulators
# In a second terminal:
bun run dev:table
```

Open the **Network** URL printed by Vite, then `/play/`. Create a table on the shared display; scan its QR code on each phone, enter shop names, and start. Phones and the computer need to reach the Vite, Auth, and Firestore emulator ports (5194, 9295, and 8195) on the same network. Using the Network URL also gives the QR code the correct address. Refreshing a phone restores its Firebase identity and replays the room.

For gallery-only work: `bun run dev`, then http://127.0.0.1:5194/gallery/. Rules are at `/rules/`.

For an immediate visual review without connecting phones, the development server provides deterministic, local-only fixtures:

- `/hand/?demo` — playable private counter; resize between desktop and phone.
- `/hand/?demo=overflow` — fourteen-card hand with bounded paging.
- `/hand/?demo=milk-choice` — the victim chooses a Milk to discard.
- `/table/?demo=reaction` — five public seats with all five Sabobatage targets declared.

These fixtures are labeled `DEMO`, use the real reducer, never write to Firestore, and are excluded from production. Actual multiplayer starts at `/play/`.

## Game interactions

- Tap a hand card, then the drink or opponent to act on. Ingredient cards also support desktop drag-and-drop into drink slots. Choices stay inline; there are no modal dialogs or confirmation prompts.
- Sabobatage declares five ingredients before opening reactions. Each player passes or plays Customer Loyalty on their phone. Lactose Intolerant and Untrained Employee let the targeted player choose their own discard.
- Tea Party: choose one or two tea cards, then their destination slots. Recycle: choose from the discard tray. Wild ingredients fit compatible recipes automatically and remain flexible.
- Undo appends to the event stream. As in Pantheon, draws/reveals and ending a turn clear undo history. The host can undo the latest eligible move; a player can undo their own.
- The tabletop displays played cards and hand counts. Hand faces appear only in the corresponding phone UI.

## Architecture

Svelte 5 / SvelteKit static frontend. Trusted clients run the same deterministic reducer over an immutable Firestore event stream. Moves apply optimistically without waiting for a write acknowledgement. Firestore is storage and synchronization only: there is **no game server, API polling, or Cloud Function**. Firebase Auth gives each browser a stable anonymous identity.

The small room metadata document serializes appends, following Pantheon. Unique command IDs prevent duplicate replay, clients rebase concurrent intents, and Firestore rules enforce authorship and append-only history. Private hands are presentation privacy among trusted clients, not cryptographic secrecy. See [architecture notes](docs/architecture.md).

GitHub Pages hosts production and PR previews. Both use the shared Firebase project `sabobatage-preview-anicolao`, with anonymous Authentication and Firestore. Open the [PR #2 tabletop](https://anicolao.github.io/sabobatage/pr2/table/) to create a room and scan the phone-join QR codes. See [deployment and backend setup](docs/deployment.md). Local emulators are for development.

## Validation

```sh
bun run test
bun run test:backend # starts isolated emulators; stop dev emulators first
bun run check
bun run build
bun run test:ux # uses installed Chrome, following the local browser setup
SABOBATAGE_EMULATORS=1 bun run test:ux # also checks independent phones against running emulators
```

Tests cover every action, recipe compatibility, reaction timing, flexible Wild ingredients, deterministic full-game simulations, replay/undo, optimistic acknowledgement and conflict handling, concurrent Firestore appends, identity and immutable history rules.

## Art and rules

The launcher icon is served at `/art/sabobatage-launcher.png` (prefixed by `PUBLIC_BASE_PATH` when deployed under a subpath). Set the TTLauncher application's Icon field to the absolute HTTPS URL of this asset on the deployed Sabobatage host. SvelteKit copies `static/art/sabobatage-launcher.png` into the static build; no separate image host is needed. The square badge matches the Boba Mischief illustrations and follows Pantheon's launcher composition. Its built-in imagegen prompt is recorded in [launcher icon provenance](docs/launcher-icon.json).

Original boba-shop illustrations use two generated sprite sheets with live HTML rules text. The gallery retains the original 63:88 proportions, larger explanatory text, filters, favorites, card backs, and an inline detail panel.

The current third-edition manual (internally version 2.1) provides the inventory. User-confirmed card text supplies Lactose Intolerant and Recycle. See [rules references](docs/rules-reference.md) and [art direction](docs/art-direction.md). Pantheon and RoboRally informed the interaction and synchronization patterns.

