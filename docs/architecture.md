# Client-owned game and immutable history

Sabobatage follows Pantheon's trusted-client architecture. There is no game server, polling API, Cloud Function, server-owned game snapshot, or server-side rules engine.

- Each browser subscribes directly to the room's immutable Firestore event collection and runs the same versioned, deterministic reducer.
- The creation event records the shuffle seed. Card identities, draws, reshuffles, and random steals derive from that seed and event order, never browser time or replay-time randomness.
- A move is validated and applied in the browser immediately. The client queues its Firestore append in the background; gameplay does not wait for its acknowledgement.
- A small Firestore room document tracks owner, seats, and stream revision. As in Pantheon, a client-side Firestore transaction serializes appends and catches up any missing events. Rules enforce authorship and append-only writes; game-rule validation runs in the clients.
- Stable event IDs make retries idempotent. Confirmed events replace optimistic events rather than applying twice. Competing moves are replayed against the latest stream. An invalidated optimistic move is removed and explained inline.
- Undo appends an event identifying the move to undo. Replay-local checkpoints restore the position; history is never edited. Draw/reveal and turn-end boundaries clear undo checkpoints, following Pantheon's information barriers.
- The tabletop renders public cards and hand counts. Each phone renders its own hand. This is presentation privacy among trusted clients, as requested: the stream and seed allow a technically modified client to reconstruct all hands. No cryptographic secrecy or authoritative filtering is claimed.
- Anonymous Firebase Auth remembers each phone's identity across refreshes. The host can also join from their phone; the tabletop always uses a public-only rendering projection.

References inspected: Pantheon `backend/setup-repository.ts`, `backend/firebase.ts`, `game/undo.ts`, and inline card interactions; RoboRally `room-service.ts`, `room-model.ts`, and `/hand/` and `/tt/` routes. These projects inform the architecture; Sabobatage's reducer and UI are implemented here.

Local development uses Firebase Auth and Firestore emulators. Production is static SvelteKit output plus a configured Firebase project. The Vite server only serves frontend assets.

The development flake uses Pantheon's exact pinned inputs and package list. Run repository commands through `nix develop`; Java and the other tools come from that shell. Consult Pantheon's implementation and development documentation before introducing a different technical pattern.
