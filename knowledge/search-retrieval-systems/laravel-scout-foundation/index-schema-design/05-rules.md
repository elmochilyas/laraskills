## Only Index Fields Needed for Search and Display
---
## Category
Performance
---
## Rule
Always return only the fields required for search matching, filtering, and result display from `toSearchableArray()` — never send all model attributes.
---
## Reason
Every additional field increases index size, slows indexing, and reduces search performance. Unnecessary fields also increase storage costs on SaaS search engines.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return $this->toArray(); // Sends 50+ columns including internal IDs
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'description' => $this->description,
        'status' => $this->status,
        'category_id' => $this->category_id,
    ];
}
```
---
## Exceptions
Development environments where indexing all fields is temporarily acceptable.
---
## Consequences Of Violation
Higher storage costs, slower search, potential data exposure.

## Declare Filterable and Sortable Attributes Explicitly
---
## Category
Reliability
---
## Rule
Always declare filterable and sortable attributes in the search engine's index settings after adding them to `toSearchableArray()`.
---
## Reason
Most search engines (Meilisearch, Typesense, Algolia) filter/sort only on explicitly declared attributes. Undeclared attributes cause silent query failures or error responses.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'price' => $this->price, // Not declared as filterable
    ];
}
// Post::search('shoes')->where('price', '>', 10) — fails silently
```
---
## Good Example
```php
// In Meilisearch: set filterableAttributes to ['price']
// In Typesense: declare 'price' as type 'float' and index:true
// Then use where() — works correctly
```
---
## Exceptions
When filtering is done via PHP post-query filtering on small result sets.
---
## Consequences Of Violation
Broken filtering, silent query failures, confused users.

## Use Typed Casts for Numeric Fields in toSearchableArray
---
## Category
Reliability
---
## Rule
Always cast numeric fields (prices, counts, IDs) to their proper PHP types in `toSearchableArray()` to prevent string-based sorting and filtering issues.
---
## Reason
Database integer values sent without casting become strings in the search index. String-based numeric sorting produces incorrect order (e.g., "100" < "9" alphabetically).
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['price' => $this->price]; // Float becomes string
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'price' => (float) $this->price, // Proper numeric type
        'views' => (int) $this->view_count,
    ];
}
```
---
## Exceptions
Search engines that auto-detect and convert field types from JSON payloads.
---
## Consequences Of Violation
Incorrect sort order, broken range filters, confusing search results.

## Normalize Related Data in toSearchableArray
---
## Category
Design
---
## Rule
Always denormalize related model data directly into `toSearchableArray()` rather than relying on join queries at search time.
---
## Reason
Search indexes are denormalized by nature. Joining at search time is not supported by most search engines. The entire searchable payload must be self-contained in a single indexed document.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['title' => $this->title];
    // Can't search by author name — not in index
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'author_name' => $this->author->name, // Denormalized
    ];
}
```
---
## Exceptions
When using a search engine that supports relational queries (e.g., Elasticsearch nested fields).
---
## Consequences Of Violation
Inability to search by related data, complex workarounds, poor search quality.
