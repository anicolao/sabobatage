# Project conventions

- Consult `../games/pantheon` before making an uncertain technical or interaction-design decision. Read the relevant implementation and docs, not just its dependency list.
- Run development, verification, and repository tooling inside `nix develop`. The flake and lockfile match Pantheons pinned inputs; do not download standalone toolchains.
- Use trusted clients and immutable Firestore events. Every client deterministically replays the seed and ordered stream. Firestore stores/synchronizes events; do not introduce a game server, polling API, private projection service, or Cloud Functions.
- Apply moves optimistically. Undo is an event, with Pantheon-style information barriers. Never mutate committed events.
- Use direct card manipulation and inline choices. Provide undo instead of confirmation dialogs.
- Keep the shared tabletop public-only. Players see hand faces on their phones, following `../games/roborally`. This is UI privacy among trusted clients.
- Preserve the approved illustration style and portrait card proportions. Rule text remains selectable HTML.
- Test game rules, deterministic replay, conflict/retry behavior, and immutable Firestore writes. Validate type checks and static builds before pushing.
