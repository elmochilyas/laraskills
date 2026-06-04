# Select Constraints

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Select Constraints |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Select constraints limit which columns and related records are retrieved from the database. Every unnecessary column or row wastes memory, network bandwidth, and query execution time. Eloquent provides `select()`, `addSelect()`, constrained eager loading, and model `$hidden`/`$visible` for controlling the SELECT clause and serialization payload.

## Core Concepts

- **`select($columns)`**: Restricts the query to retrieve only specified columns: `User::select('id', 'name', 'email')->get()`.
- **`addSelect($columns)`**: Adds columns to an existing select list — useful in query scopes and global scopes.
- **Constrained eager loading**: Limit related columns: `Post::with(['comments' => fn($q) => $q->select('id', 'post_id', 'body')])`.
- **`$hidden` / `$visible`**: Control serialization output (`toArray()`, `toJson()`). Hidden attributes are never serialized. These do not affect the SELECT clause.
- **Partial model**: A model instance with only some columns loaded. Missing columns return `null` on access.

## When To Use

- List/index views — only columns needed for display (id, title, status) instead of all columns
- API endpoints with large models — select only the fields the API resource exposes
- Models with large columns (BLOBs, TEXT, JSON) — avoid loading these unless needed
- Dashboard/aggregate queries — select only the columns needed for computation

## When NOT To Use

- Write operations (save, update) — partial models may overwrite unloaded columns with null/default values
- Complex model comparison — partial models may lack columns needed for equality checks
- Development/administrative queries — `SELECT *` is acceptable for debugging

## Best Practices

- **Never save partial models**: A model loaded with `select('id', 'name')` and then saved will overwrite unloaded columns with null or default values. Always load the full model (or at minimum all non-nullable columns) before saving. Use `fresh()` to reload the full model if needed.
- **Always include the foreign key in constrained eager loading**: `with(['comments' => fn($q) => $q->select('id', 'body')])` without `post_id` causes all comments to fail matching — Eloquent cannot match them to posts. Always include the foreign key column in the select list.
- **Use `$hidden` for serialization, `select()` for I/O reduction**: `$hidden` only prevents serialization — the data is still loaded from the database and consumes memory. Use `select()` to avoid loading large or sensitive columns entirely. Use `$hidden` to control API response payloads.
- **Use different select sets for list vs. detail views**: List views should select minimal columns (`id`, `title`, `status`). Detail views can select all needed columns. This ensures list endpoints are fast and lightweight while detail pages have complete data.

## Architecture Guidelines

- Define explicit select lists in repository methods — never rely on `SELECT *` in production queries
- Use `addSelect()` in query scopes to extend rather than override the column list
- Enable `preventAccessingMissingAttributes()` in development to catch partial model access bugs
- Audit `SELECT *` queries via database monitoring tools

## Performance Considerations

- Selecting 5 columns instead of 20 reduces row data transfer by ~75% — for 10k rows, this is ~500 KB vs ~2 MB
- Column reduction helps InnoDB read fewer pages from disk when columns are narrower
- Constrained eager loading reduces memory: loading 10k comments with only `id` and `body` instead of 15 columns saves significant memory
- `$hidden` does not reduce I/O — data is still loaded; it only filters serialization

## Security Considerations

- Never select sensitive columns (ssn, password_reset_token, internal_notes) in non-privileged queries — `$hidden` prevents serialization but the data is still loaded into memory
- Use `select()` to avoid loading sensitive data entirely, not just `$hidden` to hide it

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Saving partial models | Loading with select() then calling save() | Unloaded columns set to null/default | Reload full model before save |
| Missing FK in constrained select | Not including foreign key | Relation matching fails | Always include FK column |
| Using $hidden instead of select() | Confusing serialization with I/O | Still loads data into memory | Use select() to avoid loading; $hidden for serialization |
| Not disambiguating joined selects | `select('name')` on joined query | Ambiguous column error | Use `select('table.name')` |

## Anti-Patterns

- **SELECT\*-everywhere**: Never specifying columns, always relying on `SELECT *`. For a model with 20+ columns but views that only use 3, this wastes bandwidth and memory on every query.
- **Partial model save**: Loading a model with `select()`, modifying it, and calling `save()`. Overwrites unloaded columns with defaults. Always load the full model before write operations.
- **$hidden-for-security**: Relying on `$hidden` to protect sensitive columns. The data is still loaded into memory and can be exposed through debugging tools, serialization edge cases, or memory dumps.

## Examples

```php
// List view — minimal columns
$users = User::select('id', 'name', 'email')
    ->withCount('posts')
    ->paginate(20);

// Detail view — all needed columns
$user = User::with(['posts' => fn($q) => $q->select('id', 'user_id', 'title')])
    ->findOrFail($id);

// Safe partial model — display only, never saved
$summary = User::select('id', 'name')->get();

// addSelect in a scope
public function scopeWithBasicInfo(Builder $query): void
{
    $query->addSelect('id', 'name', 'email');
}

// Avoid loading large columns
$posts = Post::select('id', 'title', 'excerpt') // exclude 'body' (large TEXT)
    ->published()
    ->get();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Eloquent query builder basics |
| Prerequisite | Model serialization ($hidden, $visible) |
| Closely Related | prevention-strategies |
| Closely Related | index-aware-queries |
| Closely Related | subquery-optimization |

## AI Agent Notes

- Generate `select()` for list/index queries — specify only needed columns
- Always include foreign key columns in constrained eager loading selects
- Never generate `save()` calls on partial models loaded with `select()`
- Use `addSelect()` in query scopes to compose column lists safely

## Verification

- [ ] List/index queries use explicit `select()` with minimal columns
- [ ] Constrained eager loading includes the foreign key column
- [ ] Partial models loaded with `select()` are never saved back to the database
- [ ] Sensitive columns are excluded via `select()` (not just `$hidden`)
- [ ] `preventAccessingMissingAttributes()` is enabled in development
