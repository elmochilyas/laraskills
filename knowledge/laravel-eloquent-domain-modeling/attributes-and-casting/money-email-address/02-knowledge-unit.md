# money-email-address

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** money-email-address
- **Last Updated:** 2026-06-02

---

## Executive Summary

Money, Email, and Address are the three most common value objects in Laravel applications. They represent domain concepts that appear in virtually every business application and are frequently casted via Eloquent custom casts. Understanding their implementations — validation rules, storage strategies, serialization formats, and Eloquent integration — provides a concrete reference for building any value object. These three examples span the full spectrum of value object complexity: single-property (Email), dual-property composite (Money), and multi-property composite (Address).

---

## Core Concepts

- **Email value object**: Wraps a string email address. Validates format at construction. Provides normalization (lowercase, trim). Typically stored as a single `varchar` column.
- **Money value object**: Wraps an amount and a currency. Supports arithmetic operations, comparison, and formatting. Typically stored as integer cents + currency code or JSON.
- **Address value object**: Wraps street, city, state/province, postal code, country. May include geocoding. Typically stored as JSON or across multiple columns.
- **All three implement immutability**: Once created, none of these value objects can be changed. Modification produces a new instance.
- **All three implement equality**: `equals()` or `isEqualTo()` methods compare structural equality.
- **All three support Eloquent casting**: Each provides a custom cast (or implements `Castable`) for round-trip persistence.

---

## Mental Models

- **Email as identifier**: Email is both a communication channel and a user identifier. Its value object must normalize aggressively (lowercase, trim) to prevent duplicate accounts due to casing differences.
- **Money as quantity + unit**: Money is always a pair (amount, currency). Storing amount without currency (or assuming a single currency) is a design smell.
- **Address as structured location**: Address is a composite value with both structured fields and a free-form representation. Different systems require different subsets of fields.
- **These three cover 80%**: In typical Laravel business applications, Email, Money, and Address cover ~80% of value object needs. Understanding them enables the remaining 20%.

---

## Internal Mechanics

### Email

- **Validation regex**: RFC-compliant email validation is complex. Most implementations use a simplified regex or PHP's `filter_var($email, FILTER_VALIDATE_EMAIL)`.
- **Normalization**: Lowercasing the domain part (not the local part, per RFC) and trimming whitespace. Some implementations also strip dots from Gmail addresses.
- **`__toString()`**: Returns the normalized email string.
- **Storage**: Single `varchar(255)` column. Case-insensitive queries require `LOWER()` or a case-insensitive collation.

### Money

- **Cent-based storage**: Amounts are stored as integers (cents) to avoid floating-point precision issues. `1000` cents = `10.00` USD.
- **Currency as ISO 4217**: Currency is stored as a 3-letter uppercase string (USD, EUR, GBP).
- **Arithmetic**: `add()`, `subtract()`, `multiply()`, `allocate()` return new `Money` instances. Currency mismatch throws an exception.
- **Formatting**: Locale-aware formatting for display (`$10.00`, `€10,00`).
- **JSON column vs multi-column**: JSON stores `{"amount": 1000, "currency": "USD"}`. Multi-column stores `amount` (integer) + `currency_code` (varchar).

### Address

- **Components**: Typically `line1` (street), `line2` (apt/suite), `city`, `state`/`province`, `postal_code`, `country`.
- **Free-form fallback**: Some implementations include a `formatted` field for the full address as a single string.
- **Geocoding**: May include `latitude` and `longitude` as optional components.
- **Country as ISO 3166**: Country is stored as a 2-letter code (US, GB, DE).
- **Validation varies**: Country-specific validation of postal codes (ZIP+4 vs alphanumeric UK postcodes) adds significant complexity.

---

## Patterns

### Email Cast Pattern

**Purpose**: Cast an email string to an `Email` value object and back.

**Structure**: `CastsAttributes` with `get` returning `new Email($value)` and `set` returning `['email' => (string) $value]`.

**Castable**: `Email::castUsing()` returns the cast class, enabling `'email' => Email::class` in `$casts`.

**Storage**: Single `varchar(255)` column.

### Money Cast Pattern

**Purpose**: Cast a stored integer (cents) + currency to a `Money` value object.

**Structure**: `CastsAttributes` with `get` reconstructing `Money` from stored values and `set` returning amount and currency columns.

**Multi-column**: `$casts = ['amount' => 'integer', 'currency_code' => 'string']` plus a custom cast for the combined `Money` attribute.

**JSON storage**: `get` decodes JSON to `Money`, `set` encodes `Money` to JSON.

### Address Cast Pattern

**Purpose**: Cast a JSON column to an `Address` value object.

**Structure**: `get` decodes JSON to `Address`, `set` encodes `Address` to JSON.

**Multi-column**: `get` reads individual columns and constructs `Address`, `set` returns multiple column keys.

### Self-Defining Castable Pattern

**Purpose**: Value object implements `Castable` and returns its own cast class.

**Implementation**: `Money::castUsing()` returns `MoneyCast::class`. The model uses `'price' => Money::class`.

**Benefit**: Every model using Money gets the same cast without repeating cast registration.

---

## Architectural Decisions

- **Email storage**: Always store normalized (lowercase domain, trimmed). Use case-insensitive collation (`utf8mb4_unicode_ci`) or `LOWER()` in queries to prevent duplicates.
- **Money storage: cents vs decimal**: Always use integer cents for exact arithmetic. Floats cause rounding errors. `decimal(10,2)` is acceptable for display but dangerous for arithmetic.
- **Money storage: JSON vs multi-column**: Use multi-column (`amount` + `currency_code`) when querying by amount or currency. Use JSON when the attribute is rarely queried.
- **Address storage**: Use JSON for address unless specific components need indexing or foreign keys. Multi-column addresses are more queryable but harder to maintain.
- **Library vs custom**: Use `brick/money` for Money value object. Write custom `Email` and `Address` for domain-specific needs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Email normalization prevents duplicates | Normalization rules are complex (RFC vs practical) | Over-normalization (e.g., stripping dots in Gmail) can block legitimate variations |
| Money cent-integer arithmetic is precise | Requires conversion for display (cents → decimal) | Display code must convert; missed conversions show wrong amounts |
| Address JSON column is simple | Not queryable by component (city, zip) | Reporting and search require raw JSON queries |
| Multi-column Money is queryable | Complex cast with multi-column return | Partial updates risk currency/amount mismatch |
| Using libraries (brick/money) is battle-tested | Additional dependency; learning curve | Team must understand library API beyond basic usage |

---

## Performance Considerations

- **Email regex validation cost**: `filter_var()` is fast (~1μs). Complex RFC regex is slower (~10-100μs). For bulk imports, validation cost adds up.
- **Money object allocation**: Each `Money` value object construction is lightweight but allocates. Processing 10,000 money amounts creates 10,000 `Money` objects.
- **Address JSON parsing**: JSON decoding/encoding on every read/write adds overhead. For large collections, consider custom SQL queries that extract individual fields.
- **Cent conversion overhead**: Converting between float and integer cents (e.g., `(int) round($float * 100)`) is negligible but must be done correctly. `round()` with wrong mode causes off-by-one errors.
- **Bulk hydration**: 1000 models with Money casts = 1000 `Money` objects = 2000 properties constructed. This is usually fine but measurable in profiling.

---

## Production Considerations

- **Email delivery vs storage**: The `Email` value object validates format, but does not verify deliverability. Separate email verification (sending a confirmation) from value object construction.
- **Money currency consistency**: Ensure that all Money attributes on a model use the same currency or document the expectation. Mixing USD and EUR in the same column causes silent misaggregation.
- **Address internationalization**: Address validation is country-specific. A universal `Address` value object cannot validate all countries equally. Consider separate value objects per region or a flexible schema.
- **Data migration for Money**: Switching from float decimal to integer cents requires a data migration. The cast must handle both formats during transition.
- **GDPR considerations**: Email and Address are personally identifiable information (PII). Consider encryption at rest and access controls for models containing these value objects.

---

## Common Mistakes

- **Not normalizing email before storage**: `User@Example.Com` and `user@example.com` are stored as different values. Queries may find one but not the other.
- **Using float for Money**: `10.00 + 0.01 = 10.009999999999999` in float. Storing as float causes rounding errors in financial calculations.
- **Assuming Money is always the same currency**: Storing only `amount` without `currency_code` makes the model unusable in multi-currency contexts.
- **Address as a single string**: `"123 Main St, Springfield, IL 62701"` cannot be queried by city or ZIP. Always store structured components.
- **Ignoring country-specific address formats**: Japan writes postal code first, then prefecture, then city, then street. A Western-ordered Address value object does not work for Japanese addresses.
- **Not handling null Money**: A nullable `price` column should return `null` from the cast, not `Money::zero()`. `Money::zero()` has business meaning ("free") that differs from null ("price not set").

---

## Failure Modes

- **Email validation rejects valid addresses**: RFC-compliant addresses like `user+tag@example.com` or `"user@name"@example.com` are valid but rejected by simple regex. Real users cannot register.
- **Money arithmetic with different currencies**: `Money::USD(100)->add(Money::EUR(50))` should throw. Without currency checking, this produces incorrect totals silently.
- **Address country code mismatch**: Storing an address with `country = 'USA'` (full name) instead of `US` (ISO code) breaks internationalization and shipping integrations.
- **Cents overflow**: Storing cents in a `smallint` (max 32,767) overflows for amounts >$327.67. Use `integer` or `bigint`.
- **Email normalization change in production**: Changing normalization rules (e.g., adding Gmail dot stripping) after users exist creates duplicate accounts or login failures.

---

## Ecosystem Usage

- **brick/money**: The de facto standard Money value object for PHP. Immutable, ISO currencies, arithmetic, allocation (pro-rata), formatting.
- **brick/math**: Used by brick/money for arbitrary-precision arithmetic.
- **Laravel Cashier (Stripe & Paddle)**: Uses integer cents for all money amounts. Stripe's API uses cents; Cashier stores them as integers.
- **Laravel Jetstream / Fortify**: Handles email as primitive strings (no value object) in default installations. Community packages add email value object support.
- **Spatie Laravel Data**: DTO package supporting Email, Money, and Address as first-class value objects with validation and casting.
- **laravel-address (community)**: Community package for address value objects with Eloquent cast support.
- **commerceguys/addressing**: PHP address library for international address formatting and validation (used by Drupal Commerce, adaptable to Laravel).

---

## Related Knowledge Units

### Prerequisites
- value-object-fundamentals — principles of immutable value objects
- value-object-casting — persisting value objects via Eloquent casts
- immutability-patterns — ensuring value objects cannot be mutated after creation

### Related Topics
- casts-attributes-interface
- castable-interface
- cast-parameters

### Advanced Follow-up Topics
- Internationalization (i18n) for Address
- Financial Arithmetic for Money
- RFC Email Compliance

---

## Research Notes

- Money is the most debated value object in PHP — specifically around float vs integer storage and allocation algorithms (pro-rata rounding).
- Email validation is notoriously complex. PHP's `filter_var()` covers ~99% of practical cases. Full RFC 5322 validation requires a dedicated library (e.g., `egulias/email-validator`).
- Address value objects are the least standardized because address formats vary significantly by country. Most Laravel applications use country-specific address models rather than a universal one.
- brick/money uses an internal `$amount` as a `BigInteger` (from brick/math), making it safe for arbitrary-precision arithmetic but heavier than a simple integer wrapper.
- Laravel's own `$casts` does not natively support Money, Email, or Address — these must be implemented as custom casts or via third-party packages.
- The trend in Laravel applications is toward using value objects with Eloquent casting, but the majority of existing Laravel codebases still use primitive strings and floats for these concepts.
