# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Input Sanitization Techniques
**Difficulty:** Intermediate
**Category:** Input Validation
**Last Updated:** 2026-06-03

---

# Overview

Input Sanitization Techniques are the methods for cleaning, normalizing, and securing user input before it enters the application — covering string trimming, HTML stripping, type casting, encoding, and injection prevention. Sanitization exists alongside validation as a complementary concern: validation rejects bad input; sanitization transforms ambiguous or risky input into safe, predictable values.

Engineers must care because unsanitized input is the root cause of the most common security vulnerabilities — XSS, SQL injection, mass assignment, and command injection. While Laravel's Eloquent and Blade provide substantial protection, input sanitization provides defense in depth. Proper sanitization also normalizes data for consistent storage and processing.

---

# Core Concepts

**Trim:** Removing whitespace from the beginning and end of strings. Prevents storage of accidental whitespace and normalizes input.

**Strip Tags:** Removing HTML tags from strings. Prevents XSS in stored text content. Only applies when HTML is not expected.

**Type Casting:** Converting input to expected PHP types — (int), (float), (bool), (string). Prevents type confusion vulnerabilities.

**Encoding:** Converting special characters to HTML entities or URL encoding. Prevents interpretation of special characters as code.

**Normalization:** Converting input to a standard format — lowercase email addresses, standardized phone numbers, canonical file paths.

**Null/Empty Treatment:** Converting empty strings to null for nullable fields, or converting null to default values.

---

# When To Use

- User-generated text content (bios, descriptions, comments)
- Input that will be displayed back in web views (XSS prevention)
- Input that will be used in database queries (defense in depth)
- File upload metadata (names, paths)
- Input from third-party integrations (untrusted data sources)

---

# When NOT To Use

- Input validated through Form Requests with strict rules (type casting is sufficient)
- Machine-generated or system-internal data (already trusted)
- Binary data or file contents (different sanitization approach needed)

---

# Best Practices

**Sanitize in input preparation, not after validation.** Use `prepareForValidation()` in Form Requests or DTO constructors to clean input before rules are evaluated.

**Use Laravel's Str class for string operations.** `Str::trim()`, `Str::of($input)->trim()->lower()` provide fluent, testable sanitization.

**Cast inputs to expected types.** `(int) $input['age']` prevents type juggling vulnerabilities. Use PHP type declarations where possible.

**Strip HTML only when HTML is not expected.** For rich text content, use an HTML sanitizer (HTMLPurifier) instead of `strip_tags()`.

**Normalize before storing.** Email addresses should be lowercased and trimmed. Phone numbers should be stored in a consistent format.

**Encode output at the presentation layer.** Blade's `{{ }}` auto-escapes. Sanitize for storage, encode for display.

---

# Architecture Guidelines

**Sanitization happens in the input preparation phase** — before validation rules execute. This ensures validators receive clean, normalized data.

**Form Request input preparation** is the primary location for sanitization. The `prepareForValidation()` method modifies `$this->merge()` with sanitized values.

**DTO constructors** are the secondary location. DTOs receive raw input and sanitize during construction, ensuring clean data throughout the domain.

**Sanitization should not be done in controllers or actions.** Input cleaning is a cross-cutting concern that should happen before business logic.

**Database-level sanitization is defense in depth, not primary.** MySQL strict mode and column types provide backup protection but should not be relied on as primary sanitization.

---

# Performance Considerations

**String operations are fast** — trimming, casing, and basic sanitization add <0.01ms per field.

**HTML sanitization (HTMLPurifier) is expensive** — 10-100ms for large HTML inputs. Only sanitize HTML content that will be rendered in web views.

**Type casting is free** — PHP type juggling has negligible overhead.

---

# Security Considerations

**Sanitization is not a substitute for validation.** Sanitization normalizes input; validation rejects invalid input. Both are needed.

**Strip HTML tags or encode for storage, not just for display.** Stored XSS can execute when data is retrieved from the database and rendered.

**Email normalization (lowercase) prevents duplicate accounts.** Users with "User@Example.com" and "user@example.com" should be recognized as the same account.

**SQL injection prevention is primarily through parameterized queries and Eloquent.** Sanitization is supplementary, not primary protection.

**File upload sanitization.** Strip path traversal sequences (`../`), normalize filenames, validate MIME types server-side.

---

# Common Mistakes

**Sanitizing after validation.** Validation rules see unsanitized input, potentially rejecting valid-but-untrimmed strings.

**Over-sanitization.** Stripping characters that are valid in context — removing punctuation from names, stripping special characters from passwords.

**Under-sanitization.** Not trimming whitespace, allowing leading/trailing spaces that cause data inconsistency.

**Sanitization in the wrong layer.** Cleaning input in controllers or views instead of the input preparation phase.

**Confusing sanitization with validation.** Sanitization transforms input; validation rejects input. They are complementary, not interchangeable.

---

# Anti-Patterns

**Output Sanitization Only:** Sanitizing only at the display layer and storing raw input. If the display layer changes (API output, export), unsanitized data is exposed.
**Better approach:** Sanitize for storage, encode for display. Defense in depth at both layers.

**Type Confusion:** Accepting strings where integers are expected and relying on coercion rather than explicit casting.
**Better approach:** Explicitly cast inputs to expected types in `prepareForValidation()`.

**HTML Allowed Everywhere:** Allowing HTML in string fields "just in case" without sanitizing or stripping tags.
**Better approach:** If HTML is not explicitly required, strip it. If HTML is required, use a proper HTML sanitizer.

---

# Examples

**Form Request input preparation:**
```
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => Str::of($this->email)->trim()->lower()->toString(),
        'name' => Str::of($this->name)->trim()->toString(),
        'bio' => $this->bio ? strip_tags($this->bio) : null,
        'age' => (int) $this->age,
        'is_active' => (bool) $this->is_active,
    ]);
}
```

---

# Related Topics

**Prerequisites:**
- Laravel Form Request Input Preparation
- PHP Type System

**Closely Related Topics:**
- Input Preparation — broader input handling patterns
- Validation Error Shape Design — validation response format
- Form Request Validation Logic — validation after sanitization

**Advanced Follow-Up Topics:**
- HTML Purifier Integration — safe HTML content handling
- File Upload Validation and Sanitization

**Cross-Domain Connections:**
- XSS Prevention — sanitization for stored content
- Mass Assignment Protection — preventing mass assignment through sanitized input
