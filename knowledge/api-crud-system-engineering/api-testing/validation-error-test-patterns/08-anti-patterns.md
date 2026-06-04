# Anti-Patterns: Validation Error Test Patterns

## Status-Only Validation Testing
**Description:** Asserting only 422 status without verifying error details. The test passes even if the error response format changes completely.
**Why it happens:** Developers think 422 is sufficient to "prove validation works."
**Consequences:** Validation error format can change without test failure; consumers receive non-standard errors.
**Better approach:** Always assert at least one error detail (field name, rule) plus the 422 status.

## One-Rule Testing
**Description:** Testing only the first validation rule (usually `required`) while ignoring format rules like email, unique, min, max.
**Why it happens:** Developers test the most obvious rule and assume others are covered by framework defaults.
**Consequences:** Format validation can break without detection; data corruption enters the system.
**Better approach:** Test every rule defined on the field, not just the most obvious.

## Positive Test Neglect
**Description:** Writing only negative validation tests (what gets rejected) without positive tests (what gets accepted).
**Why it happens:** Developers focus on error handling and forget to verify valid data works.
**Consequences:** Overly strict validation rules that reject valid input go undetected.
**Better approach:** Every validation rule needs a corresponding positive test with valid data.

## Message String Brittleness
**Description:** Asserting exact English validation error messages in tests.
**Why it happens:** Developers copy the error message from the browser during development.
**Consequences:** Localization, copy changes, or Laravel upgrade breaks tests.
**Better approach:** Assert error codes or rule identifiers instead of human-readable messages.

## Frozen Conditional Testing
**Description:** Testing only one branch of conditional validation — always the branch that produces the error.
**Why it happens:** Developers test "does validation catch this?" without testing the inverse.
**Consequences:** The non-error branch may be incorrectly implemented, blocking valid data.
**Better approach:** Test both branches of every conditional validation rule.
