# Skill: Cast Model Attributes for Type Safety

## Purpose

Define attribute casting via `$casts` to convert between database representations and PHP types — including native casts (boolean, integer, datetime), enum casts, JSON casts, encrypted casts, and custom casts — for type safety and clean attribute access.

## When To Use

- Mapping database columns to native PHP types
- Serializing/deserializing JSON columns
- Enum mapping for status fields
- Encrypting sensitive attributes automatically

## When NOT To Use

- Complex transformations requiring business logic (use accessors)
- One-off type conversions in controllers

## Prerequisites

- Understanding of PHP types and database column types
- Knowledge of enum classes for enum casting

## Inputs

- Attribute name and desired type
- Enum class (for enum casts)
- Custom cast class (for complex transformations)

## Workflow

1. Add to `$casts` array: `protected $casts = ['is_admin' => 'boolean']`
2. For enum casts: `'status' => OrderStatus::class` (OrderStatus is a PHP enum)
3. For JSON casts: `'metadata' => 'array'` or `'metadata' => 'object'`
4. For encrypted casts: `'ssn' => 'encrypted'`
5. For custom casts: implement `CastsAttributes` interface and register

## Validation Checklist

- [ ] bigInteger casts use string or decimal to prevent overflow
- [ ] JSON cast columns use JSON column type in the database
- [ ] Enum casts map to PHP backed enums matching database values
- [ ] Encrypted casts on sensitive columns (PII, credentials)

## Common Failures

### Casting to integer for large numbers
bigInteger columns may overflow PHP's integer type. Use `decimal` or string casts for large values.

### JSON cast without json column type
Casting to `array` on a string column works but loses the database's JSON validation.

## Decision Points

### Cast vs Accessor?
Use casts for type conversion (boolean, integer, JSON). Use accessors for computed or transformed values.

### Enum cast vs string?
Enum casts provide type safety and prevent invalid values. Use for status, type, and category fields.

## Performance Considerations

Casts have minimal overhead — they execute on attribute access and hydration. Encrypted casts add encryption/decryption overhead.

## Security Considerations

Encrypted casts automatically encrypt data at rest. Use for PII, credentials, and sensitive configuration. Enum casts prevent invalid status values from being set.

## Related Rules

- Prefer casts over accessors for type conversion
- Use enum casts for status/type fields
- Use encrypted casts for sensitive attributes

## Related Skills

- Transform Model Attributes with Accessors and Mutators
- Configure Model Serialization
- Define Eloquent Model Conventions for Table Mapping

## Success Criteria

- All type conversions use `$casts` instead of manual accessors
- Enum casts used for constrained value fields
- bigInteger columns use string/decimal casts to prevent overflow
- Sensitive columns use encrypted casts
