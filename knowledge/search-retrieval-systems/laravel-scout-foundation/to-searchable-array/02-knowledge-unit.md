# Knowledge Unit: toSearchableArray Customization

## Metadata

- **ID:** K005
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Core — shapes what data is indexed

## Executive Summary

`toSearchableArray()` is the method on a Searchable model that defines the data payload sent to the search engine. By default, Scout sends the model's `toArray()` output (all visible attributes). Overriding this method is the primary mechanism for controlling index size, denormalizing related data, transforming values (timestamps to integers, HTML to plain text), and excluding sensitive fields.

## Core Concepts

- **Default Behavior**: Returns `array_merge($this->toArray(), $this->scoutMetadata())`. Includes all attributes visible to `toArray()`.
- **Return Value**: An associative array where keys become searchable fields and values become indexed values. Engine-specific field type requirements apply (e.g., Typesense requires string IDs and integer timestamps).
- **Relationship Denormalization**: Include `$this->relation->field` values to make cross-table text searchable without joins.
- **Index Size Control**: Fewer fields = smaller index = faster searches. Only index fields users actually search against.

## Internal Mechanics

`toSearchableArray()` is called at indexing time (both sync and queued). The return value is JSON-encoded (for most engines) and sent via the engine client. The method receives no parameters — it's called on the model instance with access to all properties and loaded relations. For queued indexing, the method is called at job dispatch time, serializing the result.

## Patterns

- **Always implement** `toSearchableArray()` — never rely on the default, which may include sensitive or irrelevant fields.
- **Include denormalized relationship values** like `'author_name' => $this->author->name`.
- **Clean data**: Strip HTML, convert dates to timestamps, cast booleans to integers.
- **Add computed fields**: `'popularity_score' => $this->views * 0.5 + $this->sales * 1.5`.

## Architectural Decisions

Scout chose method override over attribute configuration for maximum flexibility. Developers can compute, transform, and conditionally include any data. The tradeoff is that the method signature is fixed — you cannot pass query-time parameters to influence what gets indexed.

## Tradeoffs

- Denormalization increases index size but eliminates search-time joins.
- Including too many fields increases index storage and slows writes.
- Excluding fields you later need requires a re-index (import/flush).

## Performance Considerations

- `toSearchableArray()` executes on every index operation. Expensive computations (heavy relationship loading, API calls) directly impact indexing throughput.
- Use `makeAllSearchableUsing()` to eager-load relationships before batch import.
- For large text fields, consider storing a truncated or summarized version.

## Production Considerations

- Cast string primary keys: `'id' => (string) $this->id`.
- Convert dates to Unix timestamps for proper range filtering.
- Flatten array relationships (e.g., tags) into space-separated strings or arrays depending on engine support.

## Common Mistakes

- Not overriding it — sends all database columns to the index, including `password`, `remember_token`, internal IDs.
- Including eagerly loaded relations without checking if they exist (causes errors on partial model loading).
- Leaving HTML tags in searchable text — `strip_tags()` should be applied.
- Not casting types correctly for engine requirements (Typesense rejects non-string IDs).

## Failure Modes

- **Serialization errors**: If a relation's attribute throws an exception, the entire index operation fails.
- **Memory exhaustion**: Loading many relationships in a single `toSearchableArray()` call on large models.
- **Type mismatch**: Engine rejects document due to schema violation (e.g., string where integer expected).

## Ecosystem Usage

Used in every Scout implementation. The method is the standard pattern across Algolia, Meilisearch, Typesense, and custom engines.

## Related Knowledge Units

- K001 (Searchable trait)
- K010 (makeAllSearchableUsing)
- K034 (Typesense collection schemas)

## Research Notes

Source: Laravel Scout docs. The pattern of denormalizing relationships directly into the searchable array is consistent across third-party engines. Some community packages provide traits that auto-include specific relationships based on annotations, but the manual override remains the most common approach.


## Mental Models

- **Mirror Reflection**: Index synchronization is like keeping a mirror reflection of your database in the search engine. Every change to the original must be reflected in the mirror.
- **Conveyor Belt**: Batch indexing is a conveyor belt — documents enter on one end (import), travel through processing, and emerge searchable on the other end.

