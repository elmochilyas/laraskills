# Knowledge Unit: Soft Delete Handling in Scout

## Metadata

- **ID:** K017
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** __soft_deleted attribute

## Executive Summary

Scout automatically handles soft-deleted models by adding a `__soft_deleted` attribute to the searchable array when a model is trashed. When querying, soft-deleted records are excluded from results by default. The `withTrashed()` method on the search query can include them. This is transparent to the developer once the `SoftDeletes` trait is present.

## Core Concepts

- **Automatic Detection**: Scout detects the `Illuminate\Database\Eloquent\SoftDeletes` trait on the model.
- **Trash Removal**: When `delete()` is called on a soft-deletable model, Scout removes it from the index.
- **Restore Re-Indexing**: When `restore()` is called, Scout re-indexes the model.
- **`__soft_deleted` Flag**: The searchable array includes this boolean for engines that support it (Algolia uses it for filtering).

## Internal Mechanics

Scout's observer checks if the model uses `SoftDeletes`. On `deleted` event, it calls `engine->delete()` to remove from index. On `restored`, it calls `engine->update()`. When querying, Scout adds a filter to exclude documents where `__soft_deleted = true`. This is engine-specific: for Algolia, Scout sends `__soft_deleted` as an attribute; for Meilisearch, it relies on the deletion.

## Patterns

- **Exclude trashed**: Default behavior. `Product::search('query')->get()` omits soft-deleted.
- **Include trashed**: `Product::search('query')->withTrashed()->get()`.
- **Only trashed**: `Product::search('query')->onlyTrashed()->get()`.

## Architectural Decisions

Scout chose automatic handling over explicit configuration because soft deletes are a ubiquitous Laravel pattern. Making developers manually handle trashed records would violate Laravel's convention-over-configuration philosophy.

## Tradeoffs

- Automatic handling simplifies coding but adds observer overhead for every delete/restore.
- The `__soft_deleted` attribute leaks an internal concern into the search index.
- Engine-specific — some engines don't support the `withTrashed()` API and require manual filter handling.

## Performance Considerations

- Delete and restore operations trigger index calls, same as regular saves.
- With queued indexing, there's a window where trash state is inconsistent between DB and index.

## Production Considerations

- **Verify behavior with your engine**: Meilisearch and Typesense handle deletion cleanly; verify `withTrashed()` works as expected.
- **Test trash/re-index flow**: Ensure records appear/disappear from search when trashed/restored.
- **Consider `forceDelete()`**: Permanently removes from both DB and index.

## Common Mistakes

- Expecting `shouldBeSearchable()` to handle soft deletes — it doesn't. Soft delete handling is separate.
- Forgetting that `withTrashed()` is needed for admin panels showing all records.
- Not testing the transition flow: published → trashed → restored.

## Failure Modes

- Index contains soft-deleted records if the delete observer fails (queue failure).
- `withTrashed()` not working on some engine driver — results may silently exclude trashed records.

## Ecosystem Usage

Universal standard in Laravel applications using both Scout and SoftDeletes.

## Related Knowledge Units

- K001 (Searchable trait)
- K007 (shouldBeSearchable)

## Research Notes

Source: Laravel Scout docs. The `withTrashed()` and `onlyTrashed()` query methods follow the same naming convention as Eloquent's soft delete query scopes.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

