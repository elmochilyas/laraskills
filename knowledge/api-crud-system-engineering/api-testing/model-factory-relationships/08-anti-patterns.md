# Anti-Patterns: Model Factory Relationships

## Relationship Sprawl
**Description:** Creating every possible related model for every test regardless of whether the relationship is needed.
**Why it happens:** Developers copy-paste factory setup from other tests without evaluating necessity.
**Consequences:** Slow test suites, unclear test intent, difficult-to-maintain factory chains.
**Better approach:** Create only the minimum relationships required for the specific test scenario.

## Manual Foreign Key Assignment
**Description:** `Comment::factory()->create(['post_id' => $post->id])` instead of `Comment::factory()->for($post)->create()`.
**Why it happens:** Developers are more familiar with array attribute assignment than factory relationship methods.
**Consequences:** Less readable; relationship direction is unclear; foreign key constraint errors possible.
**Better approach:** Use factory relationship methods `for()` and `has()` for all relationship creation.

## Unrecycled Parents
**Description:** Creating a new user for each of 10 post factories in the same test, generating 11 users when 1 suffices.
**Why it happens:** Developers don't realize `recycle()` exists or don't think about database insert counts.
**Consequences:** Test suite bloat; hundreds of unnecessary database records.
**Better approach:** Use `recycle()` to share parent models across related child records.

## Magical Number Collections
**Description:** `->count(5)` without explanation of why 5 is significant. Test intent is unclear.
**Why it happens:** Developers pick arbitrary round numbers.
**Consequences:** Test modifications require understanding which count matters and which is arbitrary.
**Better approach:** Use named constants (`PAGE_SIZE`, `MINIMUM_FOR_PAGINATION`) for semantically meaningful counts.
