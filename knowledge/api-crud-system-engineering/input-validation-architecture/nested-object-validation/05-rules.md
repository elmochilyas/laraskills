# Nested Object Validation — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | nested-object-validation |

## Rules

### Rule: Use Dot Notation for Named Properties
- **Condition:** When validating properties of a nested object
- **Action:** Use `parent.child.grandchild` dot notation to reference nested fields.
- **Consequence:** Each nested property gets its own validation rules and error messages.
- **Enforcement:** Review ensures no manual concatenation of field names in rules.

### Rule: Use Wildcard Notation for Array Items
- **Condition:** When validating items in a list where each item has the same structure
- **Action:** Use `array.*.field` wildcard notation. The `*` represents each item index.
- **Consequence:** Rules apply uniformly to all items; errors return indexed paths like `items.0.name`.
- **Enforcement:** Review ensures `*` is used instead of explicit numeric indices.

### Rule: Enforce Array Min/Max Size
- **Condition:** When accepting an array of items
- **Action:** Add `array` rule followed by `min:N` and/or `max:N` to bound the array size.
- **Consequence:** Prevents abuse with excessively large payloads or empty arrays where items are required.
- **Enforcement:** Integration tests verify array size limits.

### Rule: Limit Nesting to 2 Levels
- **Condition:** When designing API payloads with nested structures
- **Action:** Keep nesting at 2 levels maximum. Flatten 3+ level structures into separate endpoints or use compound keys.
- **Consequence:** Error messages remain readable; client-side mapping stays simple; processing overhead stays low.
- **Enforcement:** Architecture review flags payloads with 3+ levels of nesting.

### Rule: Use `present` for Required-But-Nullable Nested Fields
- **Condition:** When a nested field must exist in the request but may be null
- **Action:** Use `present` rule instead of `required` for fields that must submit with a null value.
- **Consequence:** `required` fails on null; `present` passes on null but fails on absent.
- **Enforcement:** Review ensures `present` is used for nullable-but-required nested fields.
