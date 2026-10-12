# Sabobatage — art direction prototype

A local Svelte 5 / SvelteKit / TypeScript gallery for reviewing an original boba-shop art direction before gameplay implementation.

## Run

```sh
bun install
bun run dev
```

Open http://127.0.0.1:5194. `/gallery/` shows the gallery; `/rules/` contains the sourced rules summary.

```sh
bun run check
bun run build
```

## Scope

All 27 illustrated base-game card types (110 physical cards), visible copy counts, category and text filters, enlarged card inspector, card backs, large-card mode, and browser-local art favorites. This is an unofficial art prototype, not a playable game or a transcription of every printed rule. All effects are now documented, with Lactose Intolerant and Recycle confirmed by the user from their cards. Verified action cards link to the publisher’s card images, manual, or tutorial.

Reference project was found at `../games/pantheon` (the requested `../pantheon` did not exist). The project follows its SvelteKit static architecture, typed card data, reusable card faces with live text, searchable gallery, and native dialog inspector. No Pantheon source or art was copied.

## Art

Original contact sheet generated with the built-in imagegen tool, saved at `static/art/boba-contact-sheet.png`. See `docs/art-direction.md` for the exact prompt. The companion `static/art/boba-inventory-sheet.png` adds the remaining 15 card illustrations. Cards use the sheets directly as a CSS atlas; names and rules remain accessible HTML. The illustration was generated as a 4 × 3 sheet; CSS crops each tile consistently. Fonts use Google Fonts, with local system fallbacks.

## Rules

Use the current official third-edition download linked from https://sabobatage.com/pages/how-to-play (internally labelled version 2.1), rather than the 2021 manual. The newer deck adds Oat Milk and Recycle and changes tea/milk quantities. See the rules page and `docs/rules-reference.md` for sources and remaining questions.
