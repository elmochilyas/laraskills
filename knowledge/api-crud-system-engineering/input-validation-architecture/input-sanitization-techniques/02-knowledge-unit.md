# Input Sanitization Techniques

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** input-validation-architecture
- **Knowledge Unit:** Input Sanitization Techniques
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Input Sanitization Techniques ensure that incoming API data is cleaned, normalized, and safe before being processed by the application. Proper sanitization prevents injection attacks, data corruption, and inconsistency while preserving the original input where appropriate.

---

## Core Concepts
- **Sanitization vs Validation**: Validation rejects bad data; sanitization cleans it. Both are needed.
- **Strip vs Escape vs Encode**: Stripping removes harmful content, escaping makes it safe, encoding changes representation
- **HTML/JS Injection Prevention**: `strip_tags()`, `htmlspecialchars()`, `e()` for XSS prevention in string input
- **SQL Injection Prevention**: Using Eloquent parameter binding (never raw concatenation)
- **Data Normalization**: Trimming whitespace, normalizing line endings, removing BOM characters
- **Type Casting**: Casting input to expected types (`int $id`, `(float) $price`)
- **Allowlist vs Blocklist**: Allowlist (permit safe characters) is more secure than blocklist (remove dangerous characters)

---

## Mental Models
1. **Water Purification Model**: Input data flows through a filtration system that removes contaminants (injections, bad encoding) while preserving the water's usability.
2. **Customs Inspection Model**: Every piece of input data passes through customs. Some items are rejected (validation), some are cleaned (sanitization), and some pass through unchanged.

---

## Internal Mechanics
Sanitization should happen at the boundary — before the data enters your domain. Form requests can sanitize in `prepareForValidation()` by modifying `$this->merge()` with cleaned values. Middleware can apply global sanitization. Eloquent's accessors and mutators can sanitize at the model level.

---

## Patterns

### Pattern 1: Form Request Sanitization
**Purpose**: Sanitize input in `prepareForValidation()` before rules are applied
**Benefits**: Validation receives clean data; sanitization is co-located with validation
**Tradeoffs**: Mixes sanitization with validation concerns

### Pattern 2: Middleware Sanitization
**Purpose**: A global middleware that sanitizes all incoming request data
**Benefits**: Consistent sanitization across all endpoints
**Tradeoffs**: Can be too aggressive for some endpoints

### Pattern 3: Accessor/Mutator Sanitization
**Purpose**: Sanitize at the model level via Eloquent accessors and mutators
**Benefits**: Data is always clean regardless of how it enters the model
**Tradeoffs**: Data is already dirty in the request/validation layer

---

## Architectural Decisions
### When To Use
- Any API that accepts user input (all write endpoints)
- APIs handling rich text, Markdown, or HTML content
- APIs where data enters from multiple sources (API, admin, imports)

### When To Avoid
- Internal-only APIs where all input comes from trusted sources
- Read-only endpoints with no user input
- Endpoints where preserving exact input is critical (version history, audit)

### Alternatives
- Validation-only approach (reject dangerous input instead of cleaning it)
- Escaping at output time only (presentation-layer sanitization)
- Using a dedicated sanitization library (HTML Purifier, antiXSS)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Prevents injection attacks | Aggressive sanitization can corrupt legit input | Use allowlist approach, not blocklist |
| Data normalization | Sanitization adds processing overhead | Apply sanitization at the right layer |
| Consistent data quality | Sanitization can hide input issues | Log sanitization actions for debugging |

---

## Performance Considerations
- HTML sanitization (e.g., HTML Purifier) is CPU-intensive
- Regex-based sanitization on every request can add latency
- Cache sanitization rules; don't recompile patterns per request
- Batch sanitization is more efficient than per-field sanitization

---

## Production Considerations
- Log when sanitization modifies input for auditability
- Don't sanitize passwords or secrets (these should be validated, not cleaned)
- Test sanitization behavior with known malicious inputs
- Ensure sanitization doesn't break multilingual/Unicode content
- Apply sanitization in the correct order (trim → strip dangerous → type cast → validate)

---

## Common Mistakes
**Over-relying on client-side sanitization**: Client sanitization is easily bypassed. Always sanitize server-side.
**Sanitizing stored data on output instead of input**: Sanitize on input so stored data is clean. Output escaping is separate.
**Using blocklist approach**: `preg_replace('/[<>]/', ...)` misses many injection vectors. Use allowlist: `preg_match('/^[a-zA-Z0-9 ]+$/', ...)`.

---

## Failure Modes
**Double sanitization**: Data sanitized twice corrupts legitimate content (e.g., `&amp;` becomes `&amp;amp;`). *Detection:* Content display bugs. *Mitigation:* Sanitize once at the boundary, escape at output.
**Encoding mismatch**: Input in one encoding sanitized with rules designed for another. *Detection:* Unicode display issues. *Mitigation:* Normalize encoding to UTF-8 before sanitization.

---

## Ecosystem Usage
Laravel's `Str` class provides `Stringable` methods like `trim()`, `stripTags()`, `slug()`. The `e()` helper does HTML escaping. Eloquent mutators (`set{Field}Attribute`) can sanitize model-level. `Request::merge()` can replace sanitized values.

---

## Related Knowledge Units
### Prerequisites
- Input validation basics
- XSS and injection attack vectors

### Related Topics
- Form request validation logic
- Validation rule composition
- Security best practices

### Advanced Follow-up Topics
- HTML Purifier integration for rich text
- SQL injection prevention deep dive
- File upload sanitization and validation

---

## Research Notes
- OWASP recommends allowlist-based input validation as the primary defense
- Input sanitization is defense-in-depth; never rely on it alone for security
- Eloquent's parameter binding automatically prevents SQL injection; raw `DB::statement()` with user input is dangerous
- Laravel's `Request::all()` returns raw data; sanitize before use
