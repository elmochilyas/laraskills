# Typed Attribute Accessors with DTOs — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | typed-attribute-accessors-with-dto |

## Anti-Patterns

### Using DTOs for Simple Scalar Attributes
- **Severity:** Medium
- **Problem:** Creating a DTO class and typed accessor for a simple string or integer attribute adds unnecessary class count and object allocation overhead.
- **Solution:** Use primitive casts for scalar values. Reserve DTO accessors for structured data with multiple named fields.

### Mutable DTOs with Public Setters
- **Severity:** High
- **Problem:** A DTO with mutable properties allows consumers to modify the returned object, potentially bypassing the accessor's immutability contract and dirty detection.
- **Solution:** Use `readonly` properties on all DTOs. Require constructor-based construction for state changes.

### Not Caching DTO Accessors
- **Severity:** Medium
- **Problem:** Every access to the DTO attribute deserializes the stored value and constructs a new DTO, which is expensive for attributes accessed multiple times per request.
- **Solution:** Always enable `shouldCache: true` on DTO accessors to amortize the construction cost.

### Returning Arrays Instead of Typed DTOs
- **Severity:** Medium
- **Problem:** The accessor returns an associative array with magic string keys instead of a typed DTO, forcing consumers to know the key names and losing IDE autocompletion.
- **Solution:** Define a DTO class with typed, readonly properties and return it from the accessor. Consumers benefit from type safety and IDE support.
