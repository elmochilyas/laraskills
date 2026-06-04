# Enum Casting — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | enum-casting |

## Anti-Patterns

### Using Unit Enums in $casts
- **Severity:** High
- **Problem:** Unit enums (without backing type) cannot be serialized to/from database columns. Registering them in `$casts` causes a runtime `CastException` when the attribute is read or written.
- **Solution:** Always use backed enums (`enum X: string` or `enum X: int`) for model attribute casting.

### Duplicating Enum Values as String Constants
- **Severity:** Medium
- **Problem:** Keeping class constants alongside the enum definition duplicates the value set and creates two sources of truth that can diverge.
- **Solution:** Remove string constants once the enum is defined. Use the enum class directly in all comparisons and type hints.

### Using Enums for Frequently Changing Value Sets
- **Severity:** Medium
- **Problem:** Enum values are compiled into the codebase and require a deployment to change. Using enums for admin-managed or rapidly evolving value sets creates deployment cycle bottlenecks.
- **Solution:** Use database lookup tables with a relationship for value sets that change frequently or are managed via admin UI.

### Comparing Enum Attributes with Raw Strings
- **Severity:** High
- **Problem:** `$post->status === 'published'` bypasses the enum type safety, is prone to typos, and has no IDE support.
- **Solution:** Always use `$post->status === PostStatus::Published` for comparisons.
