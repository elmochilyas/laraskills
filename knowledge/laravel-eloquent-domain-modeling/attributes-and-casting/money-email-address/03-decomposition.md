# money-email-address Decomposition

## Topic Overview

Money, Email, and Address are the three most common Laravel value objects. This KU provides concrete implementation patterns, storage strategies, validation rules, and Eloquent casting integration for each.

---

## Decomposition Strategy

This topic is kept as a single KU rather than split into three because:

- The three value objects share the same architectural context (Laravel Eloquent casting).
- They are often taught and discussed together as the "canonical three" value objects.
- The patterns for each (validation, storage, serialization, casting) are structurally similar, making comparison and contrast valuable.
- Each individual value object is too shallow to warrant a standalone KU — the interest is in the comparison and the full spectrum of complexity (simple → composite → complex composite).

However, a split could be justified in the future if any single value object accumulates enough depth (e.g., Money with advanced allocation algorithms, or Address with internationalization).

---

## Proposed Folder Structure

```
attributes-and-casting/
├── money-email-address/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| money-email-address | Concrete implementations of Money, Email, and Address value objects with Eloquent casting integration | Intermediate | value-object-fundamentals, value-object-casting, immutability-patterns |

---

## Dependency Graph

```
value-object-fundamentals → immutability-patterns → value-object-casting
                                                          ↓
                                                  money-email-address
```

---

## Boundary Analysis

**In scope:**
- Email: validation, normalization, storage, casing, duplicate prevention
- Money: cent storage, currency handling, arithmetic, allocation, formatting
- Address: components, JSON vs multi-column, country-specific validation
- Eloquent cast patterns for each (single-column, multi-column, JSON)
- Self-defining Castable implementations
- Castable interface integration
- Null handling (nullable money, nullable email, nullable address)

**Out of scope:**
- Email deliverability verification (SMTP, MX lookup) — separate infrastructure
- Money exchange rates and currency conversion — separate KU in financial domain
- Address geocoding (latitude/longitude) — separate GIS topic
- Full RFC 5322 email compliance — niche topic, use a library
- Multi-tenant Money (different currencies per tenant) — advanced multi-tenant topic

---

## Future Expansion Opportunities

- **Money allocation algorithms**: Pro-rata distribution, rounding strategies (banker's rounding, ceiling, floor).
- **International address formatting**: Country-specific address schemas and formatters.
- **Email deliverability for Laravel**: Integration with email verification services, disposable email detection.
- **Money formatting for Blade**: Locale-aware money formatting helpers and Blade components.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization