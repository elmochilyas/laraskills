# Relationship Touch — Touch Timestamps on Relationship Changes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** relationship-touch
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
The `$touches` property and `touch()` method automatically update the `updated_at` timestamp of a parent model whenever a related model is created, updated, or deleted. This ensures cache invalidation, dirty detection, and freshness tracking propagate through the relationship hierarchy without manual calls. `$touches` is declared as an array of relationship names on the child model; `touch()` can be called manually on any model instance.

---

## Core Concepts
When a model has `protected $touches = ['post']`, any save or delete on that model triggers `$this->post->touch()` automatically. The `touch()` method updates the model's `updated_at` column to the current timestamp (via `freshTimestampString()`), saves the model, and fires the `touching`, `touched`, `saving`, `saved` events. The operation is recursive — if the parent model also has `$touches`, touching it triggers further touches up the chain.

---

## Mental Models
Think of `$touches` as a **change-propagation cable** — when one model changes, the timestamp signal travels up the relationship graph automatically. It answers the question "when was this parent last relevant?" by reflecting the most recent change to any of its children. `touch()` is the manual trigger; `$touches` is the automatic wiring.

---

## Internal Mechanics
Eloquent's `Model::save()` and `Model::delete()` methods call `Model::finishSave()` and `Model::performDeleteOnModel()` respectively, both of which invoke `$this->touchOwners()`. The `touchOwners()` method iterates `$this->touches`, resolves each relationship name to a relation instance, calls `$relation->getResults()` (which lazy-loads the related model), and calls `touch()` on the result. The `touch()` method calls `$query->where($this->getKeyName(), $this->getKey())->update(['updated_at' => $this->freshTimestampString()])`, then fires the `touching`/`touched` events. The BelongsTo relationship provides `touch()` directly — it does not require `$touches` for manual use.

---

## Patterns
- **Cache invalidation**: `Comment` touches `Post`, `Post` touches `User` — clearing cache on content changes
- **Hierarchical timestamps**: Category touches parent category — full ancestry chain stays fresh
- **Feeds and listings**: `Post $touches = ['user']` ensures user profile "last active" reflects new posts
- **Manual touch**: `$post->touch()` — explicitly mark as updated without changing any attributes
- **Conditional touch**: Override `touchOwners()` to conditionally skip propagation based on business rules

---

## Architectural Decisions
The decision to propagate via the relationship graph rather than denormalized columns is a tradeoff between write overhead and read performance. The timestamp is stored once on the parent table (normalized), but every child mutation triggers a parent `UPDATE` query. An alternative — storing the latest child timestamp directly on the parent — would require more complex logic but eliminate the update cascade. Eloquent chose simplicity (automatic cascade) over write optimization.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic cache invalidation | Extra UPDATE query per child mutation | Write-heavy relationships see significant overhead |
| Simple declarative syntax | Lazy-loads the parent model to touch it | Each touch loads the entire parent from DB |
| Recursive propagation | Can create long update chains | 5-level deep chain = 5 extra UPDATE queries |
| Fires model events for hooks | `touching`/`touched` events can trigger observers | Circular touches possible if not careful |

---

## Performance Considerations
Each touch generates one `UPDATE` query on the parent table. A `Post` with 100 `Comment` saves in a single request generates 100 extra `UPDATE posts SET updated_at = ...` queries. For write-heavy relationships, this is a significant source of database load. Mitigations include: batching updates (overriding `touchOwners()` to deduplicate), deferring touches to a queue job, or using `withoutTouching()` callback to suppress touches for bulk operations. The `withoutTouching()` method accepts a model class or closure to temporarily disable the feature.

---

## Production Considerations
Monitor `SHOW PROCESSLIST` or query logs for excessive `UPDATE ... updated_at` queries — they indicate touch overhead. Use `Model::withoutTouching()` around batch operations: `Model::withoutTouching(fn() => Comment::factory(1000)->create())`. For high-traffic applications, consider replacing touches with a scheduled cache invalidation or a materialized "last activity" column updated asynchronously. Touches are safe with transactions — if the child save rolls back, the touch is also rolled back.

---

## Common Mistakes
- Listing a relationship in `$touches` that returns a collection (e.g., `hasMany`) — touch only works on singular relations.
- Forgetting that `touch()` fires `saving`/`saved` events — can trigger unexpected observer chains.
- Using `$touches` on a `belongsToMany` relationship (not supported — pivot timestamps must be touched separately).
- Expecting `touch()` to work without an `updated_at` column on the parent table.

---

## Failure Modes
- **Circular touch chain**: `Post touches User, User touches Post` — infinite loop until PHP timeout. Eloquent does not detect circular references.
- **N+1 touch queries**: 1,000 child saves = 1,000 parent UPDATE queries in a single request.
- **Stale parent in memory**: The parent model instance in memory is not updated — only the database row is touched.
- **Missing updated_at column**: `touch()` silently fails if the `updated_at` column does not exist on the parent table.

---

## Ecosystem Usage
Laravel's own `Authenticatable` model uses touches for `remember_token` changes. Forum packages use `$touches` on replies to update thread timestamps. CMS packages use it to update page timestamps when blocks or content elements change. Cache invalidation packages often trigger on `touched` events.

---

## Related Knowledge Units
### Prerequisites
- BelongsTo / HasMany relationship definitions
- Model lifecycle events (saving, saved, updating, updated)
- Timestamps and `$dates` property

### Related Topics
- Model events and observers (touching/touched events)
- Cache invalidation strategies
- withoutTouching() helper

### Advanced Follow-up Topics
- Asynchronous touch via queue dispatching
- Conditional touch overriding (custom touchOwners)
- Database trigger alternative for guaranteed touch propagation

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Model::touch()` at `src/Illuminate/Database/Eloquent/Model.php`. The `$touches` property is read in `touchOwners()`. The `withoutTouching()` static method is in `Illuminate\Database\Eloquent\Concerns\HasEvents`.
### Key Insight
The touch mechanism is entirely synchronous and database-bound. Each touch is a separate UPDATE query executed immediately. There is no queuing, batching, or deferred execution — this is the primary performance limitation.
### Version-Specific Notes
- Laravel 5.x+: `$touches` property and `touch()` method available.
- Laravel 8.x+: `withoutTouching()` introduced.
- Laravel 9.x+: `touch()` no longer fires `updated` event — only `saving`/`saved` and `touching`/`touched`.
- Laravel 11.x+: Performance improvement — `touch()` now uses a single query without loading the entire model.
