# Anti-Patterns: Pest Custom Helpers

## Premature Abstraction
**Description:** Creating custom helpers for assertion patterns that have only appeared once or twice.
**Why it happens:** Developers anticipate future need or over-value DRY.
**Consequences:** Indirection without benefit; helpers that are never reused.
**Better approach:** Extract after 3+ repetitions. Inline duplication is temporarily acceptable.

## Monolithic Helper
**Description:** A single helper that authenticates, creates data, and asserts multiple response characteristics.
**Why it happens:** Convenience — one function call does everything needed.
**Consequences:** Test intent is hidden; helper failures don't indicate which assertion failed.
**Better approach:** Each helper has a single responsibility. Compose at test level.

## Poorly Named Helper
**Description:** Helper names like `doSetup()`, `checkResponse()`, or `assertUserStuff()` that don't describe what they do.
**Why it happens:** Developers don't invest in naming for what feels like internal code.
**Consequences:** Tests are harder to read; new team members must read helper internals to understand tests.
**Better approach:** Helper names describe the expected condition: `assertUserCreated()`, `toHaveError()`.

## Untested Helper
**Description:** Custom expectations that are never tested themselves, potentially producing false results.
**Why it happens:** Developers don't think of test infrastructure code as needing tests.
**Consequences:** A bug in a widely-used helper silently corrupts test results across the suite.
**Better approach:** Write tests for custom expectations, especially those used in 5+ test files.

## Global Scope Pollution
**Description:** Registering helpers globally that are only used in specific test files.
**Why it happens:** Convenience — putting everything in Pest.php avoids per-file imports.
**Consequences:** IDE autocomplete shows irrelevant helpers; potential naming conflicts.
**Better approach:** Register globally only what's used across 3+ files. Use traits for narrower scope.
