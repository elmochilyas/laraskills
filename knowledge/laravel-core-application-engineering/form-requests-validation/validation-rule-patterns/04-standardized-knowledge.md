# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Validation Rule Patterns |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Validation rules in Laravel support two syntaxes — pipe-delimited strings and PHP arrays — each with distinct parsing characteristics. Rule objects like `Rule::unique()` and `Rule::exists()` wrap database queries inside validation, while `bail` and `stopOnFirstFailure` control when validation stops. Understanding how the `ValidationRuleParser` transforms human-readable rules into validation constraints is essential for writing correct and performant validators.

---

## Core Concepts

- **String syntax**: `'email' => 'required|email|max:255'` — pipe-delimited, parsed by `ValidationRuleParser`
- **Array syntax**: `'email' => ['required', 'email', 'max:255']` — no string parsing, supports Rule objects
- **Rule objects**: `Rule::unique('users')`, `Rule::exists('roles')` — cannot be represented in string syntax
- **bail rule**: Per-attribute — stops validating that attribute on first failure
- **stopOnFirstFailure**: Per-request — stops validating ALL attributes on first failure
- **Wildcard expansion**: Array data rules expanded automatically: `items.*.name` → per-element rules

---

## When To Use

- **Array syntax**: Always preferred for complex rules; required for Rule objects; enables IDE autocompletion
- **String syntax**: Simple, well-known rules where readability matters and no Rule objects are needed
- **Rule objects**: Database existence/unique checks, complex conditional rules
- **bail**: When an attribute has many rules and early failures should skip remaining checks

## When NOT To Use

- String syntax with Rule objects (Rule objects cannot be represented in strings)
- Bail when all rules should be evaluated for complete error reporting

---

## Best Practices

- **Prefer array syntax** — it's more maintainable, supports Rule objects, and works with IDE autocompletion
- **Use `bail` for performance** when further validation is pointless after a field fails a fundamental check
- **Always use `Rule::unique()->ignore()`** on update requests to exclude the current record
- **Use `Rule::exists()` for foreign key validation** instead of manual DB queries
- **Be explicit with Rule::unique table/column** — don't rely on convention for clarity

---

## Architecture Guidelines

- `ValidationRuleParser::explode()` expands human-friendly rules into validator rules
- `ValidationRuleParser::parse()` extracts rule name and parameters from a single rule
- `Rule::unique()` builds lazy database EXISTS queries — connection not used until validation time
- `Rule::exists()` similarly builds lazy database queries
- `Date` and `Numeric` rule objects are string-cast and re-parsed — use sparingly
- Regular expression rules (`regex:pattern`) preserve the full pattern without splitting on commas

---

## Performance

- String syntax parsing is negligible (~0.01ms per rule)
- Database rules (`unique`, `exists`) add query overhead — each runs a SELECT EXISTS query during validation
- `bail` improves performance by skipping remaining rules on failure
- `stopOnFirstFailure` improves performance by skipping all remaining attribute validation
- Wildcard rules with many array elements can expand to hundreds of individual rules

---

## Security

- `Rule::unique()` is safe from SQL injection — parameterized queries
- `Rule::exists()` similarly parameterized
- Regular expression rules are applied as-is to input values — ensure patterns don't have ReDoS vulnerabilities
- Validation rules should never execute user-controlled callbacks

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| String syntax with Rule objects | Assuming pipe syntax works | Rule object not parsed, validation fails silently | Use array syntax |
| Missing ignore() on update | Using Rule::unique without ignore | Update always fails because own record matches | `Rule::unique('users')->ignore($userId)` |
| No bail on dependent rules | First rule fails, subsequent rules also fail | Multiple error messages for same underlying issue | Add `bail` as first rule |
| Wrong table name in unique | Typo or wrong table | Validation fails or checks wrong table | Double-check table/column names |
| Regex pattern with comma | Pattern contains comma, parsed as parameter separator | Rule breaks | Use array syntax for regex rules |

---

## Anti-Patterns

- **Mixed string and array confusion**: Using string syntax for some rules and array for others inconsistently
- **Over-validation**: Adding `unique:users,email` when the email will be validated again in the service layer
- **Not using Rule::unique for updates**: Manually checking `User::where(...)->exists()` instead
- **Giant rule strings**: `'required|string|min:3|max:255|unique:users,email|regex:/^[a-zA-Z]/'` — hard to read and modify

---

## Examples

**String vs array syntax:**
```php
// String (limited usefulness)
'email' => 'required|email|max:255|unique:users,email'

// Array (preferred — supports all features)
'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')]
```

**Rule::unique with ignore:**
```php
Rule::unique('users', 'email')
    ->ignore($user->id)
    ->where('account_type', 'premium')
```

**Wildcard rule expansion:**
```php
// Single rule for all items
'items.*.name' => ['required', 'string', 'max:255']
// Expands to: items.0.name, items.1.name, etc.
```

**Update-field pattern (`sometimes` + `required`):**
```php
'name' => ['sometimes', 'required', 'string', 'max:255'],
// sometimes = the field may be omitted from the request
// required  = if the field is included, it must not be empty
```

Use for update/PATCH endpoints where some fields are optional to send but must be non-empty when present. Do NOT add `sometimes` to every field — fields that must always be present should use `required` alone.

**bail usage:**
```php
'password' => ['bail', 'required', 'string', 'min:8', 'confirmed']
// If required fails, skip string, min:8, confirmed
```

---

## Related Topics

- custom-validation-rules — Creating reusable validation rules
- conditional-validation — Field-dependent rules
- form-request-fundamentals — FormRequest integration
- manual-validator-usage — Validator::make() outside FormRequests

---

## AI Agent Notes

- `ValidationRuleParser::parseStringRule()` uses `str_getcsv()` for comma separation — except for regex rules
- `Date` and `Numeric` rule objects support verbose string format like `'2024-01-01'`
- Short type names are normalized: `'Int'` → `'Integer'`, `'Bool'` → `'Boolean'`
- `Rule::unique()` builds queries lazily — database connection not used until validation time
- `excludeUnvalidatedArrayKeys` controls whether unvalidated array keys are excluded from validated data

---

## Verification

- [ ] Array syntax used for rules with Rule objects
- [ ] `Rule::unique()->ignore()` on update FormRequests
- [ ] `bail` on attributes with dependent rules
- [ ] Regex rules in array syntax to prevent comma-splitting
- [ ] Wildcard rules correctly expanded for array inputs
- [ ] No `Rule::unique()` in string syntax
- [ ] `stopOnFirstFailure` configured where appropriate
- [ ] Table/column names in Rule::unique/Rule::exists are correct
