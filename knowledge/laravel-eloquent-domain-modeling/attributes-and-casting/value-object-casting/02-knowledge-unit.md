# value-object-casting

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** value-object-casting
- **Last Updated:** 2026-06-02

---

## Executive Summary

Value object casting is the practice of bridging Eloquent models and immutable value objects through custom casts, ensuring domain primitives survive the round trip from database to PHP and back without losing their validation, behavior, or type guarantees. This KU covers the full pipeline: storing value objects as scalars (or JSON), reconstructing them on read via `CastsAttributes`, self-defining their storage via `Castable`, and controlling their JSON serialization via `SerializesCastableAttributes`. Mastering value object casting is the keystone skill for eliminating primitive obsession in Laravel applications.

---

## Core Concepts

- **Round-trip integrity**: The value object must survive database → cast → PHP → cast → database without data loss or invariant violation.
- **Storage representation**: Value objects are stored as primitives (string, integer, JSON) in the database. The cast converts between the stored form and the PHP value object.
- **Constructor-based reconstruction**: The cast `get` method reconstructs the value object from stored data via its constructor, which performs validation. If the stored data is invalid, the constructor throws and the model read fails.
- **Castable as self-definition**: Implementing `Castable` on the value object allows the value object to declare its own storage format, removing cast configuration from the model.
- **Immutability preservation**: The cast must create new instances on every `get` call or cache them. Mutating a casted value object on the model should not affect the stored value until explicitly saved.
- **Null handling**: Nullable value objects must be handled explicitly — either as `null` or as a Null Object pattern.

---

## Mental Models

- **Persistence adapter**: The cast is an adapter between the value object domain and the relational database. Neither knows about the other; the cast translates between them.
- **Round-trip serialization test**: The core test of a value object cast: serialize a value object to storage, deserialize it, and assert equality. If this test passes, the cast works.
- **Bidirectional mapping**: Similar to ORM entity mapping, but for a single column. The cast maps the column type to the PHP type and back.
- **Guard at the gate**: The cast's `get` method is the gate through which stored data enters the domain. It validates on entry. The `set` method is the gate through which domain data leaves for storage. It serializes on exit.

---

## Internal Mechanics

- **`get` in value object casting**: The stored primitive is received, the value object constructor is called with it, and the value object is returned. Example: `new Email($value)`.
- **`set` in value object casting**: The value object is received, its primitive representation is extracted (via `__toString`, `value()`, or a getter), and returned for storage.
- **Composite value object storage**: Multi-property value objects (e.g., `Money`) can be stored as JSON columns or split across multiple database columns. JSON is simpler; multi-column is more queryable.
- **Castable integration**: If the value object implements `Castable`, `castUsing()` returns the cast class responsible for the round trip, keeping the value object and its persistence logic together.
- **Serialization for API output**: Without `SerializesCastableAttributes`, `toArray()` calls `get` and returns the value object instance. With it, `serialize` returns a primitive or array suitable for JSON.

---

## Patterns

### Single-Column Primitive Pattern

**Purpose**: Store a value object in a single column as a string or integer (e.g., `Email` → `varchar`, `Age` → `integer`).

**Benefits**: Simplest storage; queryable; indexable.

**Tradeoffs**: Only works for single-property value objects.

### JSON Column Pattern

**Purpose**: Store a composite value object as JSON in a single column (e.g., `Address` → `json`).

**Benefits**: Single column for complex data; flexible schema.

**Tradeoffs**: Not easily queryable (JSON path queries are slower); no foreign key constraints.

### Multi-Column Pattern

**Purpose**: Store a composite value object across multiple columns (e.g., `amount` + `currency_code` for `Money`).

**Benefits**: Fully queryable and indexable; native SQL types.

**Tradeoffs**: The `set` method must update multiple columns atomically; partial updates risk inconsistency.

### Serialization-Aware Pattern

**Purpose**: Implement `SerializesCastableAttributes` to control API output of the value object.

**Benefits**: Clean JSON without value object internals leaking.

**Tradeoffs**: Requires maintaining both `get` and `serialize` representations.

---

## Architectural Decisions

- **When to use value object casting**: The model attribute represents a domain concept with validation, behavior, or formatting requirements beyond a primitive.
- **When to avoid**: The attribute is a simple scalar with no domain rules (e.g., a count, a simple flag).
- **JSON vs multi-column for composite value objects**: Use JSON when querying individual properties is rare. Use multi-column when the properties need `WHERE` clauses, indexes, or foreign keys.
- **Castable vs separate cast class**: Use `Castable` when the value object is shared across multiple models. Use a separate cast class for model-specific serialization logic.
- **Null Object vs nullable**: Use Null Object pattern when code should never check for `null` (e.g., `$order->getDiscount()->apply($total)`). Use nullable when `null` has business meaning ("no discount").

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain primitives throughout the stack | Cast adds complexity to model definition | Primitive obsession eliminated at the cost of additional classes |
| Self-validating data on read (via constructor) | Invalid stored data causes read failures | Data migration required if old invalid data exists |
| Queryable composite value objects (multi-column) | Complex `set` logic with multiple column updates | Risk of partial updates if `set` throws mid-operation |
| Consistent serialization across models | Cast must handle null, empty, and invalid states | Edge cases in serialization produce hard-to-debug API responses |

---

## Performance Considerations

- **Construction on every read**: Value objects are reconstructed on every attribute access (unless cached by the cast). For value objects with expensive validation (regex, external lookups), this is costly.
- **JSON column overhead**: MySQL JSON columns require parsing on every read. PostgreSQL is more efficient but still slower than native columns.
- **Multi-column write amplification**: Composite casts that update multiple columns on every `set` cause more writes than single-column casts, even if only one property changes.
- **Collection hydration**: Hydrating 100 models with value object casts constructs 100 value objects. If each validates (e.g., email regex), the cumulative cost is significant.

---

## Production Considerations

- **Data integrity over time**: Stored data that was valid at write time may become invalid at read time if validation rules change. The cast must handle this gracefully or a data migration must be run.
- **Migration of storage format**: Changing a value object's storage format (e.g., from JSON to multi-column) requires a migration and a forward-compatible cast that can read both old and new formats.
- **Querying value object properties**: Multi-column value objects are easily queried. JSON value objects require `WHERE JSON_EXTRACT(...)` syntax, which is database-specific and not portable.
- **API versioning**: If the `serialize` output changes, API consumers break. Versioned casts or separate serialization methods may be needed for backward-compatible APIs.

---

## Common Mistakes

- **Storing value objects as PHP serialized strings**: Using `serialize()` for storage is fragile — PHP version changes or class renames break deserialization. Always use a portable format (JSON, scalar).
- **Not handling legacy data**: Adding validation to a value object constructor breaks reading of old data that does not satisfy the new validation rules.
- **Caching value objects by reference**: If the cast returns the same value object instance for multiple attributes, mutating one (even accidentally) affects the others.
- **Forgetting SerializesCastableAttributes**: The value object is properly stored and retrieved, but API responses contain `{}` because `json_encode` cannot serialize the value object.
- **Using value objects in `where` clauses**: Querying `Where('email', $emailValueObject)` fails if the database driver receives an object. Use `$emailValueObject->__toString()` or `(string) $emailValueObject`.
- **Inconsistent null handling**: Some casts return `null`, some return `NullEmail()`. The model's attribute getter must handle both consistently.

---

## Failure Modes

- **Stale stored data fails validation**: Old data that passes the old `Email` validation but fails the new one causes 500 errors on every model read.
- **JSON column type mismatch**: Storing a value object as JSON but the column is `text` causes silent truncation or malformed JSON that cannot be decoded.
- **Partial update with multi-column cast**: A `set` that returns `['amount' => 100]` without `'currency'` causes the currency column to be overwritten with whatever the current model state holds, potentially corrupting data.
- **Infinite loop during serialization**: If the value object holds a reference back to the model or entity, `toArray()` → `get` → value object → `toArray()` recursion.
- **Construction exception during collection hydration**: Iterating a collection of 1000 models fails on model #537 because of a single invalid stored value. The entire collection operation fails.

---

## Ecosystem Usage

- **brick/money + custom cast**: The most common pattern for Money value object casting in Laravel. Custom casts wrap `brick\Money\Money` for Eloquent persistence.
- **Spatie Laravel Data**: Full value object casting pipeline including validation, serialization, and Eloquent integration.
- **Laravel Nova**: Nova fields use value-object-like casting for complex field types.
- **Laravel Cashier**: Money value objects for billing attributes, cast to integers in the database and reconstructed as `Money` instances.
- **Community Laravel value object packages**: Many Laravel-specific packages provide pre-built value objects (`laravel-address`, `laravel-money`, `laravel-email`) with Eloquent cast support.

---

## Related Knowledge Units

### Prerequisites
- value-object-fundamentals — principles of immutable value objects
- casts-attributes-interface — the bidirectional custom casting contract

### Related Topics
- castable-interface
- serializes-castable-attributes
- immutability-patterns

### Advanced Follow-up Topics
- money-email-address
- cast-parameters

---

## Research Notes

- Value object casting is the most common real-world use case for Eloquent custom casts.
- The JSON column pattern has grown in popularity as MySQL and PostgreSQL have improved JSON support.
- Multi-column value object casts are less common because they require careful handling of partial updates and are harder to refactor.
- The `Castable` interface enables value object packages to distribute their cast logic without requiring consumers to create cast classes.
- A significant number of production bugs in value object casting stem from the `set` method not returning the complete set of columns for composite casts.
