# Validation Rule Composition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** input-validation-architecture
- **Knowledge Unit:** Validation Rule Composition
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Validation Rule Composition covers how to combine, extend, and organize Laravel validation rules into expressive, maintainable validation logic. Mastery of rule composition enables concise yet powerful validation definitions that are easy to read and extend.

---

## Core Concepts
- **Rule Arrays**: Combining rules with arrays `['required', 'email', 'max:255']` instead of pipe-delimited strings
- **Conditional Rules**: `required_if`, `required_with`, `exclude_if`, `prohibited_if` for context-dependent validation
- **Rule Objects**: Using `new Unique('users', 'email')` or `Rule::unique('users')->ignore($userId)` for parameterized rules
- **Custom Rule Objects**: Implementing `InvokableRule` or `Rule` interface for reusable custom validation
- **Nested Array Validation**: Rules for `items.*.name` using `'items.*.name' => 'required|string|max:255'`
- **Implicit Rules**: Rules that apply even when a field is not present (e.g., `prohibited`, `present`)
- **Rule Groups**: `sometimes`, `nullable`, `bail` modifiers that change rule execution behavior

---

## Mental Models
1. **Rule Pipeline Model**: Each field's rules form a pipeline. Data flows through the rules in order. `bail` stops the pipeline on first failure.
2. **Filter Chain Model**: Rules are like water filters in series — some remove contaminants (validation), others add minerals (normalization).

---

## Internal Mechanics
Laravel's `Validator` processes rules in order. Each rule is resolved (string rules are parsed, rule objects are invoked). The `passes()` method runs the rule. If it fails, the error message is collected. `bail` stops processing remaining rules for that field. `sometimes` checks if the field exists before applying rules.

---

## Patterns

### Pattern 1: Rule Object Organization
**Purpose**: Extract complex rules into dedicated rule classes
**Benefits**: Reusable, testable, self-documenting
**Tradeoffs**: Many small classes; adds indirection

### Pattern 2: Conditional Rule Groups
**Purpose**: Group conditional rules using `$this->isMethod('post')` in form requests
**Benefits**: Shared rules defined once; clear intent
**Tradeoffs**: Conditional logic can make rules() method complex

---

## Architectural Decisions
### When To Use
- Any validation definition beyond simple required + type checks
- APIs with complex business rules affecting validation
- Teams that value reusable, testable validation logic

### When To Avoid
- Trivial validation with 1-2 rules per field
- Prototypes where inline string rules suffice

### Alternatives
- Inline closures in rules() method for one-off custom validation
- Form request extends for shared rule sets
- External validation libraries

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reusable custom rules | Rule class overhead | Balance with inline closures for simple cases |
| Expressive validation | Complex conditions hard to read | Extract complex conditions to helper methods |
| Testable rule logic | Rule object learning curve | Reference existing patterns |
| Type-safe parameters | More files to manage | Use consistent naming conventions |

---

## Performance Considerations
- Rule objects are resolved once per request; negligible overhead
- Custom rule objects with database queries should be optimized (avoid N+1)
- `unique` rule requires a database query — cache the connection if possible
- `exists` rule can be slow on unindexed columns

---

## Production Considerations
- Log rule failures with enough context to identify the invalid field
- Add index hints to `exists` and `unique` rules for large tables
- Monitor custom rule execution time for performance regression
- Test rule combinations with dataset providers

---

## Common Mistakes
**Using string rules when rule objects are clearer**: `'email' => 'unique:users,email,NULL,id,deleted_at,NULL'` is harder to read than `Rule::unique('users', 'email')->whereNull('deleted_at')`.
**Inconsistent rule ordering**: Order rules from cheapest (required, type) to most expensive (database lookup) using `bail`.
**Overusing conditional rules**: Complex `required_if` chains suggest a separate form request is needed.

---

## Failure Modes
**Rule conflict**: Two rules that contradict each other (e.g., `required_with` and `prohibited` on the same field). *Detection:* Validation behaves unexpectedly. *Mitigation:* Review rule logic for contradiction.
**Missing rule context**: A custom rule that needs request context but doesn't receive it. *Detection:* Runtime errors. *Mitigation:* Implement `setValidator()` or pass context via the form request.

---

## Ecosystem Usage
Laravel provides built-in `Rule` facade methods like `unique()`, `exists()`, `in()`, `notIn()`. Custom rules implement `InvokableRule` (PHP 8) or extend `Rule`. The `Illuminate\Validation\Rules` namespace contains all built-in rule objects.

---

## Related Knowledge Units
### Prerequisites
- Form request validation logic
- Laravel validation basics

### Related Topics
- Input sanitization techniques
- Custom rule implementation
- Validation error response design

### Advanced Follow-up Topics
- Rule composition with `sometimes`, `nullable`, `bail`
- Nested and array validation rules
- Dynamic rule generation based on database state

---

## Research Notes
- Rule objects (`Rule::unique()`) are preferred over string rules for readability and IDE support
- PHP 8 named arguments can make rule object construction more readable
- `bail` prevents wasted validation on fields where the first rule already failed
- Rule order optimization: put `required` and `string`/`integer` first, `unique`/`exists` last
