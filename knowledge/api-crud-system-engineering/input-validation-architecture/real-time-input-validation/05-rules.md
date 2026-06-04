# Real Time Input Validation — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | real-time-input-validation |

## Rules

### Rule: Validate Server-Side on Submit Regardless of Real-Time Checks
- **Condition:** When implementing real-time validation for any input
- **Action:** Always perform full server-side validation on form submission. Real-time validation is UX enhancement, not an authorization gate.
- **Consequence:** Client-side bypass or manipulation does not circumvent authoritative validation.
- **Enforcement:** Test verifies endpoint rejects invalid data even if real-time validation passed.

### Rule: Use Appropriate Debounce for Validation Type
- **Condition:** When configuring debounce for real-time validation inputs
- **Action:** Set debounce 150-300ms for simple format validation. Set debounce 500-750ms for DB-backed validation. Set debounce 1000ms+ for external API validation.
- **Consequence:** Fast feedback for simple checks; reduced server load for expensive checks.
- **Enforcement:** Review ensures debounce times match validation complexity.

### Rule: Validate DB-Dependent Rules Server-Side Only
- **Condition:** When validating uniqueness, existence, or other DB-backed constraints
- **Action:** Never implement DB-dependent validation client-side. Always round-trip to the server using Livewire or AJAX.
- **Consequence:** DB state is always authoritative; no data leakage about existing records.
- **Enforcement:** Security review flags client-side DB-dependent validation logic.

### Rule: Return Field-Level Errors for Real-Time Validation
- **Condition:** When returning validation errors from real-time server checks
- **Action:** Return errors keyed by field name so the UI can highlight the specific input. Use `$errors->get('field')` in Livewire.
- **Consequence:** Users see which field has the error without searching through a list.
- **Enforcement:** UX review verifies error-to-field mapping.

### Rule: Disable Submit Until All Real-Time Checks Pass
- **Condition:** When real-time validation is the primary UX pattern
- **Action:** Disable the submit button until all real-time validated fields pass their checks. Re-enable on field changes.
- **Consequence:** Prevents submission with known invalid fields; improves UX.
- **Enforcement:** Frontend review verifies submit button state management.
