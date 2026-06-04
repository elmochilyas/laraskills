# Knowledge Unit: shouldBeSearchable Conditional Indexing

## Metadata

- **ID:** K007
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Publish/draft gating

## Executive Summary

`shouldBeSearchable()` is a boolean method on Searchable models that gates whether a model instance gets indexed. It acts as a pre-condition filter for the observer-based auto-sync. When it returns `false`, Scout skips indexing on save and removes the record from the index if it was previously indexed. This is primarily used for publish/draft workflows, soft-launch gating, and content lifecycle management.

## Core Concepts

- **Observer Gate**: Called during `saved` event before indexing. If `false`, Scout issues a `delete()` call to the engine.
- **Not for Database Engine**: The database engine searches the DB table directly, so `shouldBeSearchable()` has no effect with it. Use `where` clauses instead.
- **Bypassed by `searchable()`**: Calling `searchable()` directly on a model or collection bypasses `shouldBeSearchable()`. This is intentional for forced indexing scenarios.
- **Return Type**: Any truthy/falsy value. Common pattern: `return !is_null($this->published_at) && $this->published_at->isPast()`.

## Internal Mechanics

When `saved` fires, Scout's observer calls `shouldBeSearchable()`. If `true`, it proceeds to `toSearchableArray()` and indexing. If `false`, it calls `engine->delete()` to remove the document. On model update, if the model was previously indexed and becomes unsearchable, the delete fires. If it was not indexed and becomes searchable, the add fires.

## Patterns

- **Draft/Published gating**: `return $this->status === 'published'`.
- **Soft-launch**: Index only for internal users until a go-live date.
- **Content type filtering**: Only index specific model subtypes based on a `type` column.

## Architectural Decisions

The method-based approach was chosen over configuration because the indexing decision can depend on instance state (dates, flags, relationships). A purely config-based system would need complex rule DSLs.

## Tradeoffs

- Transparency: Developers may not realize `shouldBeSearchable()` is controlling index presence, leading to confusion when records don't appear.
- Bypass risk: `searchable()` directly ignores the gate. Teams must remember this.
- Observer-only: Does not affect `scout:import` — all records are imported regardless.

## Performance Considerations

- `shouldBeSearchable()` runs on every model save. Keep it simple — avoid database queries or API calls.
- It's called during both insert and update operations. For bulk updates, evaluate performance impact.
- With queued indexing, `shouldBeSearchable()` is re-evaluated at job execution time, not dispatch time.

## Production Considerations

- **Use with `searchIndexShouldBeUpdated()`** — Scout 10+ allows limiting re-indexing to only when relevant attributes change.
- **Test both paths**: Verify that transitioning a model from searchable to unsearchable removes it from the index.
- **Monitor unexpected removals**: A bug in `shouldBeSearchable()` can silently clear the entire index on save if it returns `false` for all records.

## Common Mistakes

- Using it with the database engine (no effect).
- Expecting `scout:import` to respect it (it doesn't — all records are imported).
- Including expensive computation (DB queries, HTTP calls) that slows down every model save.
- Not considering the `searchable()` bypass — direct calls to `searchable()` override the gate.

## Failure Modes

- **Logic error returns `false` for all records**: Every save triggers a delete from the index. Index empties gradually.
- **Time-dependent gating**: A model that was searchable yesterday (published_at in past) becomes unsearchable today if the logic changes.

## Ecosystem Usage

Universal pattern in production Scout implementations with content publishing workflows. Used in CMS platforms, e-commerce product catalogs, and membership sites.

## Related Knowledge Units

- K001 (Searchable trait)
- K005 (toSearchableArray)
- K008 (withoutSyncingToSearch)

## Research Notes

Source: Laravel Scout docs, community patterns. The `searchIndexShouldBeUpdated()` method was introduced in Scout 10 to complement `shouldBeSearchable()` by allowing attribute-level granularity — only re-index when specific fields change, reducing unnecessary index writes.


## Mental Models

- **Mirror Reflection**: Index synchronization is like keeping a mirror reflection of your database in the search engine. Every change to the original must be reflected in the mirror.
- **Conveyor Belt**: Batch indexing is a conveyor belt — documents enter on one end (import), travel through processing, and emerge searchable on the other end.

