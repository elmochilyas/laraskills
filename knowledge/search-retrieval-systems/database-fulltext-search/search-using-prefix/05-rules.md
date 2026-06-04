## Use SearchUsingPrefix for Identifiers Only
---
## Category
Design
---
## Rule
Always apply `#[SearchUsingPrefix]` only to identifier-type columns (email, username, SKU, order number) — never to free-text content fields.
---
## Reason
Prefix matching (`term%`) on free-text content misses interior words and is less effective than full-text tokenization. Identifiers benefit from prefix matching because they are searched from the start.
---
## Bad Example
```php
#[SearchUsingPrefix(['email', 'bio'])]
// Searching 'world' won't match 'hello world bio'
```
---
## Good Example
```php
#[SearchUsingPrefix(['email', 'username'])]
#[SearchUsingFullText(['bio', 'interests'])]
```
---
## Exceptions
Models containing only identifier fields with no free-text content.
---
## Consequences Of Violation
Poor search quality on text content, missed interior word matches.

## Add B-Tree Indexes on Prefixed Columns
---
## Category
Performance
---
## Rule
Always add B-tree indexes on columns that use `#[SearchUsingPrefix]` to enable fast prefix lookups.
---
## Reason
While prefix LIKE (`term%`) can theoretically use B-tree indexes, MySQL/PostgreSQL may still fall back to table scans without explicit indexes. A B-tree index on the column guarantees optimal prefix lookup performance.
---
## Bad Example
```php
#[SearchUsingPrefix(['email'])]
// No B-tree index on email column — potential table scan
```
---
## Good Example
```php
// Migration
Schema::table('users', function (Blueprint $table) {
    $table->index('email'); // B-tree index for prefix LIKE
});

#[SearchUsingPrefix(['email'])]
```
---
## Exceptions
Very small tables (< 1,000 rows) where table scan performance is acceptable.
---
## Consequences Of Violation
Slow prefix searches, unnecessary full table scans.

## Combine with SearchUsingFullText for Mixed Content
---
## Category
Architecture
---
## Rule
Always apply both `#[SearchUsingPrefix]` and `#[SearchUsingFullText]` on models containing both identifiers and text content.
---
## Reason
Without both attributes, some fields will use suboptimal query strategies — identifiers get tokenized or text content gets prefix-only matching. Both attributes together ensure each field type is queried optimally.
---
## Bad Example
```php
#[SearchUsingPrefix(['email', 'username', 'bio'])]
// 'bio' text content can only match from the start of the field
```
---
## Good Example
```php
#[SearchUsingPrefix(['email', 'username'])]
#[SearchUsingFullText(['bio', 'interests'])]
```
---
## Exceptions
Models containing only one type of field (all identifiers or all text).
---
## Consequences Of Violation
Poor text search quality, missed content matches, user frustration.
