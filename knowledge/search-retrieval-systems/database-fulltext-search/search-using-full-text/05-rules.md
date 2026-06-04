## Create FULLTEXT Index Before Applying the Attribute
---
## Category
Performance
---
## Rule
Always create FULLTEXT (MySQL) or GIN (PostgreSQL) indexes in a migration before applying `#[SearchUsingFullText]` on model columns.
---
## Reason
The attribute only changes the query syntax to use `MATCH...AGAINST` — it does not create indexes. Without a matching index, MySQL falls back to `LIKE` scans that are 100-1000x slower.
---
## Bad Example
```php
#[SearchUsingFullText(['title', 'body'])]
// No FULLTEXT index — attribute has no performance effect
```
---
## Good Example
```php
// Step 1: Create index in migration
Schema::table('posts', function (Blueprint $table) {
    $table->fullText(['title', 'body']);
});

// Step 2: Apply attribute
#[SearchUsingFullText(['title', 'body'])]
```
---
## Exceptions
Development environments where search performance is not critical.
---
## Consequences Of Violation
LIKE fallback, slow queries, no performance benefit from the attribute.

## List Only Indexed Columns in the Attribute
---
## Category
Performance
---
## Rule
Always list only columns that have FULLTEXT/GIN indexes in the `#[SearchUsingFullText]` attribute array.
---
## Reason
Listing non-indexed columns in the attribute causes MySQL to attempt FULLTEXT search on them — which fails or degrades to a full scan, negating any performance benefit.
---
## Bad Example
```php
#[SearchUsingFullText(['title', 'body', 'author_name'])]
// 'author_name' has no FULLTEXT index — degrades performance
```
---
## Good Example
```php
// Only 'title' and 'body' have FULLTEXT index
#[SearchUsingFullText(['title', 'body'])]
// Author search handled separately or via prefix
```
---
## Exceptions
When adding indexes for all listed columns is planned but not yet deployed.
---
## Consequences Of Violation
Degraded query performance, unexpected behavior, wasted optimization effort.

## Combine with SearchUsingPrefix for Identifier Fields
---
## Category
Design
---
## Rule
Always use `#[SearchUsingPrefix]` for identifier columns and `#[SearchUsingFullText]` for text content columns on the same model.
---
## Reason
Full-text search tokenizes identifiers like emails and SKUs into individual words, producing incorrect matches. Prefix search on identifier columns gives exact prefix matching while full-text handles content.
---
## Bad Example
```php
#[SearchUsingFullText(['email', 'bio'])]
// 'john@example.com' is tokenized into 'john@example' and 'com'
```
---
## Good Example
```php
#[SearchUsingPrefix(['email', 'username'])]
#[SearchUsingFullText(['bio', 'interests'])]
// Each field uses the correct search strategy
```
---
## Exceptions
Models containing only text content or only identifiers.
---
## Consequences Of Violation
Confusing search results on identifier fields, missed matches.
