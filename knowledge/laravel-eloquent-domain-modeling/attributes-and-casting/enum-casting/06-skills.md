# Enum Casting — Skills

---

## Skill 1: Cast an Attribute to a PHP Enum

### Purpose
Register an Eloquent attribute to cast to a PHP enum (backed or unit) so the model attribute returns a typed enum instance from the database and serializes back correctly on save.

### When To Use
- A column stores a fixed set of string or integer values (status, type, category)
- You want to eliminate magic string comparisons throughout the codebase
- The list of allowed values is stable and known at compile time

### When NOT To Use
- The allowed values change frequently (use a database lookup table)
- The column stores free-text strings, not constrained values
- You need runtime-extensible sets of values

### Prerequisites
- PHP 8.1+ backed enum class defined (backed by string or int)
- Database column stores the enum's scalar value

### Inputs
- Enum class name
- Enum case to value mapping
- Database column type (string or integer matching the enum's backing type)

### Workflow

1. **Define the backed enum** with a `string` or `int` backing type:
   ```php
   enum PostStatus: string
   {
       case Draft = 'draft';
       case Published = 'published';
       case Archived = 'archived';
   }
   ```

2. **Add to the model's `$casts`** using the enum class name:
   ```php
   protected $casts = [
       'status' => PostStatus::class,
   ];
   ```

3. **Set the database column type** to match the enum's backing type (string or int)

4. **Use the enum in business logic** — type-hint methods with the enum class:
   ```php
   public function scopeByStatus(Builder $query, PostStatus $status): void
   ```

5. **Compare using enum instances** — `$post->status === PostStatus::Published`, not string comparison

### Validation Checklist

- [ ] Enum is backed by string or int (not a unit enum for database columns)
- [ ] Enum class is registered in `$casts` using `Enum::class` syntax
- [ ] Database column type matches the enum's backing type
- [ ] Business logic uses enum instances, not raw scalar values
- [ ] No string constants duplicated alongside the enum definition
- [ ] Enum serializes correctly to JSON (uses the backing value)

### Related Rules

| Rule | Reference |
|---|---|
| Cast to backed enums for string/int columns | `05-rules.md` Rule 1 |
| Do not register unit enums in $casts | `05-rules.md` Rule 2 |
| Type-hint domain methods with enum classes | `05-rules.md` Rule 3 |
| Compare using enum instances, not strings | `05-rules.md` Rule 4 |
| Match database column type to enum backing value | `05-rules.md` Rule 5 |

### Success Criteria
- Model attribute returns typed enum instance from DB read
- Enum instance serializes to its backing value in JSON/array output
- Saving a model with an enum attribute writes the backing value to DB
- Invalid database values (not matching any case) throw a cast error
