# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Validation Rule Composition
**Difficulty:** Intermediate
**Category:** Input Validation
**Last Updated:** 2026-06-03

---

# Overview

Validation Rule Composition is the practice of combining, extending, and organizing Laravel validation rules effectively — using rule arrays, rule objects, custom rules, conditional rules, and rule inheritance to build maintainable validation logic. It exists because API endpoints frequently share validation rules across fields and endpoints, and naive duplication creates maintenance burden.

Engineers must care because validation rules are the specification for what data the API accepts. Composed well, they are expressive, maintainable, and self-documenting. Composed poorly, they are duplicated, inconsistent, and fragile. Rule composition patterns — from simple arrays to custom rule objects — determine whether validation logic scales with application complexity.

---

# Core Concepts

**Rule Arrays:** `['required', 'string', 'max:255']` — the most common composition pattern. Arrays are more extensible than pipe-delimited strings.

**Rule Objects:** `new Rule::unique('users')->ignore($id)`. Encapsulate rules with parameters that can't be expressed as strings.

**Custom Rule Classes:** `class ValidatedEmail implements ValidationRule`. Dedicated classes for complex or reusable validation logic.

**Conditional Rules:** `Rule::when($condition, ['required', ...], ['nullable', ...])`. Rules that change based on application state.

**Rule Inheritance:** Base Form Request with shared rules, extended by specific request classes.

**Implicit Rules:** Rules that are always true but have side effects — `Rule::forEach()` for array validation, `Rule::prohibitedIf()` for conditional prohibition.

**Pipeline Validation:** Composing multiple rules to form a validation pipeline that runs sequentially, with early termination on first failure.

---

# When To Use

- Any Form Request with multiple validation rules per field
- Shared validation rules across multiple endpoints
- Custom validation logic that doesn't fit built-in rules
- Complex conditional validation patterns
- API validation that needs to be reused across contexts

---

# When NOT To Use

- Simple, one-off validation with built-in rules (array syntax suffices)
- Validation that duplicates database constraints (enforce at database level)
- Validation rules that are truly unique to a single field and never reused

---

# Best Practices

**Prefer array syntax over pipe syntax.** `['required', 'email']` is easier to extend, combine, and maintain than `'required|email'`.

**Use Rule objects for database-dependent rules.** `Rule::unique()`, `Rule::exists()`, and `Rule::in()` are more expressive and safer than string equivalents.

**Create custom rule classes for complex logic.** A `ValidatedEmail` rule class encapsulates email validation that includes DNS check, disposable domain check, and format verification.

**Use conditional rules explicitly.** `Rule::when()` is clearer than inline if statements in the rules array.

**Compose rules at the field level, not the form level.** Each field defines its composition independently. Don't create monolithic rule arrays that span multiple fields.

**Keep custom rules focused on one validation concern.** One rule = one validation check. Compose multiple rules at the field level.

---

# Architecture Guidelines

**Custom rule classes live in `App\Rules`.** Name by what they validate: `ValidatedEmail`, `StrongPassword`, `ValidTimezone`.

**Rule composition happens in Form Request `rules()` methods.** This is the composition boundary — rules are defined there, not in controllers or models.

**Shared rule definitions are extracted to constants or methods.** `private function baseUserRules(): array` returns the common rule set.

**Custom rule classes should implement `ValidationRule` interface** (Laravel 10+) for type safety. Avoid the older `Rule` contract.

**Rules that depend on other fields or request state** receive the request or validator in their constructor.

---

# Performance Considerations

**Rule objects and custom rule classes have negligible overhead** compared to string definitions.

**Database-dependent rules (`unique`, `exists`) add query overhead.** Each use of these rules triggers a database query.

**Custom rule objects are resolved once per validation run** — no per-field performance penalty.

**Rule composition (multiple rules per field) doesn't affect performance** — each rule is checked independently.

---

# Security Considerations

**Custom rules must not leak information.** A "valid email" rule that reveals which emails exist in the system is an enumeration vulnerability.

**Rule composition must not introduce injection vectors.** Custom rules that run queries must use parameterized queries.

**Implicit rules (forEach, prohibitedIf) should be used carefully.** Incorrect composition can accidentally skip validation.

---

# Common Mistakes

**Mixing string and array syntax.** `'required|string|max:255'` and `['required', 'string', 'max:255']` in the same project create inconsistency.

**Duplicating rule arrays across Form Requests.** Changing `max:255` to `max:500` requires updating every duplicated definition.

**Inline conditional logic in rules arrays.** Complex ternary operators in the rules array are hard to read and test.

**Over-using custom rules.** A custom rule for `max:255` is unnecessary — use the built-in rule.

**Not composing for reuse.** Every Form Request defines its own field rules independently, even for the same field across endpoints.

---

# Anti-Patterns

**String-Only Rules:** Exclusively using pipe-delimited string syntax for all validation rules.
**Better approach:** Use array syntax. Add Rule objects and custom rules as composition needs grow.

**Rule Fragmentation:** Repeating the same 5 rules for "email" across 10 Form Requests.
**Better approach:** Extract shared email rules to a method or custom rule class.

**God Custom Rule:** A single custom rule that checks everything about a field (format, uniqueness, business logic).
**Better approach:** One rule per concern. Compose at the Form Request level.

**Conditional Rule Maze:** Deeply nested conditional rules that are impossible to reason about.
**Better approach:** Break complex conditionals into separate Form Requests or use Rule::when() with clear conditions.

---

# Examples

**Rule composition with array syntax:**
```
public function rules(): array
{
    return [
        'email' => [
            'required',
            'string',
            'email',
            new ValidatedEmail(),
            Rule::unique('users')->ignore($this->user?->id),
        ],
        'password' => [
            'required',
            'string',
            'confirmed',
            new StrongPassword(),
            Rule::when($this->is_admin, ['min:12'], ['min:8']),
        ],
    ];
}
```

---

# Related Topics

**Prerequisites:**
- Laravel Validation Basics
- Form Request Design

**Closely Related Topics:**
- Custom Validation Rules — creating rule classes
- Conditional Validation Patterns — Rule::when() and friends
- Form Request Validation Logic — rules in Form Requests

**Advanced Follow-Up Topics:**
- Validation Rule Inheritance
- Reusable Rule Traits

**Cross-Domain Connections:**
- DTO Integration — validated data flow
- Error Code Taxonomy — mapping rules to error codes
