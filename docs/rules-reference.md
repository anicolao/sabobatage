# Rule sources and implementation notes

Reviewed 2026-10-12.

- Publisher overview: https://sabobatage.com/pages/how-to-play
- Current linked manual: https://cdn.shopify.com/s/files/1/0558/8097/4518/files/sabobatage-basegame-3rd-ed-instruction-manual.pdf?v=1747377798
- Historical comparison only: https://bobacardgame.com/wp-content/uploads/2021/07/sabobatage_instructionmanual.pdf

The current file is named third edition but internally marked version 2.1. Its cover lists 110 cards and 2–5 players. Use current counts and Oat Milk/Recycle, not the historical deck. The publisher's overview provides the standard turn structure; `/rules/` provides the concise summary.

## Current card inventory

| Card | Copies |
| --- | ---: |
| Boba | 8 |
| Aloe | 3 |
| Lychee Jelly | 3 |
| Pudding | 3 |
| Red Bean | 3 |
| Taro | 4 |
| Milk | 6 |
| Oat Milk | 6 |
| Black Tea | 11 |
| Green Tea | 11 |
| Passion Fruit | 4 |
| Peach | 4 |
| Honey Lemon | 4 |
| Wild Ingredient | 3 |
| Sabobatage | 2 |
| Lactose Intolerant | 2 |
| 5-Star Review | 5 |
| Bobasurance | 3 |
| Customer Loyalty | 5 |
| Health Inspector | 2 |
| BOGO | 3 |
| POS Down | 2 |
| Straw | 3 |
| Sugar and Ice | 3 |
| Tea Party | 3 |
| Untrained Employee | 2 |
| Recycle | 2 |

Total: 27 card definitions, 110 physical cards. The gallery illustrates all 27 definitions, with visible copy counts totaling 110.

## Before implementing gameplay

Official card images and the publisher’s video now verify Sabobatage, 5-Star Review, BOGO, Untrained Employee, Health Inspector, Sugar and Ice, and the complete one-use effect of Bobasurance. Lactose Intolerant and Recycle are now confirmed by the user from their cards. Other ingredient and action effects are rulebook summaries.

Resolve reaction windows, counter chains, target declaration, protection consumption, topping re-entry triggers, wild-ingredient assignment, and the exact victory-check timing. Separate card identity, effect definitions, game state, and UI presentation as the implementation grows. Do not infer engine behavior from art captions or flavor text.

The base box supports 2–5; the 5–7 recommendation in the manual is relevant to expansion-supported larger groups.

## User-confirmed card effects

- **Health Inspector:** Choose a player and one type of topping or flavor card on their table. They must discard all cards of that type. This cannot target Wild Ingredient.
- **Sugar and Ice:** Steal an ingredient card from another player’s table and place it anywhere on your table.
- **Terminology:** “Trash” means discard.

The two supplied effects above are now also corroborated by official visual sources. See the source audit below.

## Official source audit — October 12, 2026

The missing rules were partly embedded in card images, not the searchable FAQ prose. The publisher’s official tutorial is narrated by creator Eric Chen and linked from the how-to-play page. It dates to July 22, 2021, so the current manual takes precedence for later changes (including Oat Milk, Recycle, and the Boba bonus).

| Card | Reference | Verified meaning |
| --- | --- | --- |
| Sabobatage | [Official video, 0:53](https://www.youtube.com/watch?v=MVI-T9PE7L4&t=53s); current manual p. 2 | Select five ingredient cards on the table from one or more players. Declare every target before counters. Discard is the project term for trash/destroy. |
| 5-Star Review | [Publisher card image](https://sabobatage.com/cdn/shop/files/how-to-play-card-2.webp) | Draw two. |
| BOGO | Current manual p. 2 card image; [official video, 0:48](https://www.youtube.com/watch?v=MVI-T9PE7L4&t=48s) | Take a random hand card from another player, then draw from the deck. The FAQ cancels both benefits if Customer Loyalty blocks the theft. |
| Untrained Employee | Current manual p. 1 card image | The chosen player chooses and discards an incomplete drink set. |
| Health Inspector | [Publisher card image](https://sabobatage.com/cdn/shop/files/how-to-play-health-inspector.webp) | Choose a player and topping/flavor type; discard all that type on their table, excluding Wild Ingredient. |
| Sugar and Ice | [Official video, 0:53](https://www.youtube.com/watch?v=MVI-T9PE7L4&t=53s) | Steal an ingredient from another table and place it anywhere on yours. |
| Bobasurance | Current manual p. 2 card image and FAQ | Protect an incomplete or completed drink once; discard the protection when an ingredient is targeted. Not a counter card. |

### Final user-confirmed effects

- Lactose Intolerant: choose a player; they must discard one Milk from their table.
- Recycle: take a card from the discard pile and add it to your hand.

The user's card text supersedes the secondary review: no Sabobatage exclusion is imposed on Recycle. All 27 definitions now have a documented effect. The tutorial confirms that Sabobatage targets ingredients already on the table.
