# Rules: Error Code Taxonomy

## Rule: Use CATEGORY_CODE Error Code Format
- **Condition:** When defining error codes for API responses
- **Action:** Use `CATEGORY_CODE` format where CATEGORY is an uppercase prefix and CODE is a 3-digit numeric suffix.
- **Consequence:** Error type is immediately identifiable from the code prefix.
- **Enforcement:** Architecture tests verify all error codes match the `^[A-Z]+_\d{3}$` pattern.

## Rule: Assign Unique Codes Per Error Type
- **Condition:** When adding new error codes to the taxonomy
- **Action:** Each distinct, actionable error scenario gets a unique code. Sequential assignment within categories.
- **Consequence:** Clients can handle each error scenario independently.
- **Enforcement:** Code review ensures new error codes are unique within their category.

## Rule: Document Error Code Taxonomy
- **Condition:** When the error code taxonomy is established or updated
- **Action:** Document every error code with description, associated HTTP status, and example scenario. Keep documentation in sync with code definitions.
- **Consequence:** Consumers can build client-side error handling from documentation.
- **Enforcement:** CI check verifies documentation coverage for all defined error codes.

## Rule: Never Reuse Or Repurpose Error Codes
- **Condition:** When retiring error scenarios
- **Action:** Deprecate the error code but never reassign it to a different scenario. Remove from active use but leave the code slot empty.
- **Consequence:** Existing client error handling doesn't break when old error types are retired.
- **Enforcement:** Automated check prevents redeclaration of previously used error code values.

## Rule: Test Correct Error Code Per Scenario
- **Condition:** When writing API tests
- **Action:** Assert that error responses return the expected error code for each error scenario.
- **Consequence:** Error code assignment is validated in tests; regressions are caught.
- **Enforcement:** Test coverage requirements include error code assertions for all error scenarios.
