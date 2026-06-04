# casts-inbound-interface

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** casts-inbound-interface
- **Last Updated:** 2026-06-02

---

## Executive Summary

`CastsInboundAttributes` is a write-only specialization of the custom cast contract. It implements only the `set` direction — transforming user-assigned values into database-safe representations without defining a `get` transformation. This is useful when the stored format is already the preferred PHP representation, or when read-time transformation is handled by accessors, relationships, or presentation layers. It reduces boilerplate for one-directional casting and signals intent that only the write path needs customization.

---

## Core Concepts

- **Unidirectional contract**: Only `set` is required. The raw database value flows through to the model attribute without transformation on read.
- **Same interface shape as `set` in `CastsAttributes`**: The `$model`, `$key`, `$value`, and `$attributes` parameters follow the same contract.
- **Return contract**: Must return an array of `['column' => value]` pairs, identical to `CastsAttributes::set()`.
- **No `get` default behavior**: The raw value from `$attributes` is returned directly — there is no automatic type coercion beyond what Eloquent's native casting provides.
- **Signaling with interface implementation**: Merely implementing `CastsInboundAttributes` (instead of `CastsAttributes`) is the mechanism that tells Laravel to skip the get transformation.

---

## Mental Models

- **Validator gate**: Think of inbound casting as a gate that validates/transforms values entering the model but lets stored values pass through unchanged on exit.
- **Half-duplex connection**: If `CastsAttributes` is full-duplex, `CastsInboundAttributes` is half-duplex — data flows in through the cast but out directly from storage.
- **Sanitization layer**: Equivalent to a `set{Attribute}Attribute` mutator but formalized as a reusable class. Anything that would be a mutator applied on write but not on read is a candidate for this interface.
- **Trust boundary**: Values coming from user input go through the cast; values coming from the database are trusted as-is. This aligns with the assumption that stored data is already valid.

---

## Internal Mechanics

- **Interface detection**: Laravel checks whether the cast class implements `CastsInboundAttributes` during cast resolution. If it does, the cast is registered as inbound-only and `get` is never called.
- **Raw passthrough on read**: When the model attribute is accessed, the raw `$attributes[$key]` value is returned without any transformation.
- **`set` invocation timing**: Called during property assignment (`$model->attribute = $value`), exactly at the same point as `CastsAttributes::set()`.
- **Storage format preservation**: The raw database value is preserved verbatim. If the column stores JSON, the decoded array/object is returned on read.
- **Eloquent's `$casts` array entry**: Registered the same way as `CastsAttributes` — via a `$casts` entry mapping the attribute to the cast class.

---

## Patterns

### Inbound Normalization Pattern

**Purpose**: Normalize user input before storage (e.g., trimming whitespace, normalizing phone numbers, lowercasing emails) without altering read behavior.

**Benefits**: Keeps storage consistent without affecting read performance or output formatting.

**Tradeoffs**: Normalization is invisible to consumers of the model — there is no indication that the stored value differs from the assigned value.

### Inbound Validation Cast Pattern

**Purpose**: Validate values on assignment, throwing if the value does not meet domain constraints.

**Benefits**: Catches invalid data at the assignment boundary, before it reaches the database.

**Tradeoffs**: Throwing from `set` breaks the assignment operation; the exception type must be catchable by the calling code. This couples validation to persistence.

### Encrypted Inbound Pattern

**Purpose**: Encrypt values on write without decrypting on read (e.g., encrypting data that is only compared via hash or token).

**Benefits**: Keeps sensitive data encrypted in the database without the overhead of decryption on every read.

**Tradeoffs**: The attribute value is never readable as plaintext through the model — useful only for write-and-compare scenarios.

---

## Architectural Decisions

- **When to use `CastsInboundAttributes`**: The stored format is acceptable as the PHP representation; only the write path needs transformation (encryption, hashing, normalization).
- **When to avoid**: The stored value needs transformation before it is useful in PHP (e.g., JSON string → collection, integer → enum).
- **When to consider `CastsAttributes` instead**: If there is any read-time formatting, type coercion, or value object construction required.
- **When to consider accessors instead**: If the transformation is trivial or model-specific (not reusable across models), a `get{Attribute}Attribute` accessor is simpler than a cast class.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Less boilerplate than full CastsAttributes | Cannot intercept or transform on read | If read transformation is needed later, must migrate to CastsAttributes |
| Clear intent: only write path is customized | Interface provides no default `get` behavior from parent | Developers may incorrectly assume automatic type coercion exists |
| Container-resolved with DI support | Inbound validation in `set` throws mid-assignment | Callers must handle exceptions from what appears to be a simple property assignment |
| Reusable normalization logic across models | Normalization is invisible to developers reading the model | Engineers may store un-normalized test data that behaves differently from production data |

---

## Performance Considerations

- **No read-time overhead**: Because `get` is never called, attribute access is faster than `CastsAttributes` — the raw value is returned directly.
- **Same write cost as `CastsAttributes`**: The `set` method runs on every assignment, with the same performance characteristics.
- **Memory footprint**: Same as `CastsAttributes` — one cast instance per model instance, stateless.
- **Container resolution**: If the cast class has expensive dependencies, those are resolved on model instantiation regardless of whether the cast is ever invoked.

---

## Production Considerations

- **Invisible transformation risk**: Developers debugging a model may inspect raw attribute values and see stored data, unaware that an inbound cast transformed the assigned value. Logging the assignment or documenting the cast is essential.
- **Serialization behavior**: When the model is serialized to array/JSON, the stored value (raw) is returned. If the stored value is not a scalar, serialization may produce unexpected results.
- **Validation boundary clarity**: Throwing validation exceptions from `set` mixes persistence concerns with validation. Consider using Laravel's validation layer instead, and reserve inbound casts for non-validation transformations.
- **Upgrading to bidirectional**: If a later requirement demands read transformation, the cast must migrate from `CastsInboundAttributes` to `CastsAttributes` and implement `get`. The storage format must remain compatible with both.

---

## Common Mistakes

- **Implementing both interfaces simultaneously**: A class implementing both `CastsAttributes` and `CastsInboundAttributes` will be treated as `CastsAttributes` (bidirectional). The inbound-only behavior will not apply.
- **Assuming type coercion on read**: Developers new to inbound casts expect the stored value to be coerced to `int`, `bool`, or `string` automatically. Inbound casts provide no type coercion whatsoever.
- **Using inbound casts for validation-only concerns**: Validation should live in FormRequests or custom rules. Throwing from `set` makes assignment operations unsafe.
- **Returning wrong array structure**: Forgetting to return an array from `set` (returning a scalar instead) causes `array_key_exists` errors identical to `CastsAttributes::set()`.

---

## Failure Modes

- **Silent data truncation**: If `set` returns a value that exceeds the column length, the database truncates silently in non-strict mode, and the truncated value is returned on read without any indication of loss.
- **Null handling ambiguity**: Since `set` receives the user-assigned value, if the user assigns `null`, the inbound cast must decide whether to store `null` or a default. Ambiguity here leads to nullable columns storing unexpected sentinel values.
- **Encrypted inbound + search failure**: Using an inbound cast to encrypt data on write without decrypting on read makes the attribute unusable for `WHERE` clauses in queries — the raw encrypted value does not match user-provided plaintext.
- **Exception during assignment**: If `set` throws, the model's `$attributes` array retains the previous value. The model enters an inconsistent state (attribute not updated, no exception recovery).

---

## Ecosystem Usage

- **Laravel Framework**: No direct internal usage of `CastsInboundAttributes` as of Laravel 11. The framework prefers `CastsAttributes` even when only one direction is needed.
- **Spatie Laravel Encrypt**: Uses inbound cast patterns for encrypting attributes on write with optional read decryption.
- **Community packages**: Commonly used for password hashing casts, normalization of email/phone attributes, and sanitization of HTML/Markdown fields.
- **First-party vs third-party pattern**: Most ecosystem packages use `CastsAttributes` even for write-only concerns, likely because the interface is better known and migrating from inbound to bidirectional is easier than the reverse.

---

## Related Knowledge Units

### Prerequisites
- casts-attributes-interface — bidirectional custom casting contract
- Native Attribute Casting — built-in Eloquent casting (int, bool, json, object)

### Related Topics
- castable-interface
- serializes-castable-attributes
- Accessors & Mutators

### Advanced Follow-up Topics
- runtime-casting
- cast-parameters

---

## Research Notes

- `CastsInboundAttributes` was introduced in Laravel 8 alongside the custom cast refactor.
- Located at `Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes`.
- The interface is rarely used in open-source packages — most developers reach for `CastsAttributes` by default even when they only need inbound transformation.
- The return array contract from `set` is identical to `CastsAttributes::set()`, meaning inbound casts can be swapped to bidirectional casts without changing the `set` logic.
- No native Laravel cast extends `CastsInboundAttributes` — even `AsStringable` (which could be inbound-only) implements full `CastsAttributes`.
