# Rules: Pest Custom Helpers

## Rule: Register Global Helpers in Pest.php
- **Condition:** When creating helpers used across multiple test files
- **Action:** Register `expect()->extend()` calls and helper functions in `tests/Pest.php`. Use `uses()` in individual files for file-specific helpers.
- **Consequence:** Helpers are available where needed without global namespace pollution.
- **Enforcement:** Review flags helper registration in individual test files when pattern is used across 3+ files.

## Rule: Name Helpers Descriptively
- **Condition:** When naming custom expectations or helpers
- **Action:** Use natural language names that describe the expected condition: `toBeCreated()`, `toHaveValidationError()`, `toHaveHeader()`.
- **Consequence:** Test code reads as executable specification.
- **Enforcement:** Code review enforces descriptive helper naming.

## Rule: Keep Helpers Single-Concern
- **Condition:** When writing custom assertion helpers
- **Action:** Each helper should test one assertion concern. Combine concerns at the test level.
- **Consequence:** Failing helper identifies exactly which assertion failed.
- **Enforcement:** Review flags helpers with multiple assertion types.

## Rule: Extract Helpers After 3+ Repetitions
- **Condition:** When noticing repeated assertion or setup patterns
- **Action:** Extract the pattern into a helper only after it appears 3 or more times across the test suite.
- **Consequence:** Avoids premature abstraction; ensures helpers earn their keep.
- **Enforcement:** Periodic review identifies extraction candidates.

## Rule: Test Custom Helpers
- **Condition:** When creating custom expectations or assertion helpers
- **Action:** Write tests that verify helper behavior — passing case, failing case, and edge cases.
- **Consequence:** Helper bugs don't produce false test results.
- **Enforcement:** Code review requires test coverage for new custom expectations.
