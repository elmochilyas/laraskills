# Decomposition: password validation

## Topic Overview

Laravel's `Password` rule object (`Illuminate\Validation\Rules\Password`) provides configurable password validation beyond simple string length rules. Default rules via `Password::defaults()` enable centralized password policy configuration. Methods: `min()`, `max()`, `letters()`, `mixedCase()`, `numbers()`, `symbols()`, `uncompromised()` (haveibeenpwned API check). The `uncompromised` method checks the password against the Have I Been Pwned password database via k-anonymity (only the first 5...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
password-validation/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### password validation
- **Purpose:** Laravel's `Password` rule object (`Illuminate\Validation\Rules\Password`) provides configurable password validation beyond simple string length rules. Default rules via `Password::defaults()` enable centralized password policy configuration. Methods: `min()`, `max()`, `letters()`, `mixedCase()`, `numbers()`, `symbols()`, `uncompromised()` (haveibeenpwned API check). The `uncompromised` method checks the password against the Have I Been Pwned password database via k-anonymity (only the first 5...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Form Request validation rules, Hash facade (Bcrypt), Related: Fortify password validation configuration, MFA/TOTP (complementary security), Advanced Follow-up: Custom password validation rules (dictionary check, keyboard pattern check), Passwordless authentication (Passkeys as alternative), and Bcrypt cost benchmarking and tuning

## Dependency Graph
**Depends on:** Prerequisites: Form Request validation rules, Hash facade (Bcrypt), Related: Fortify password validation configuration, MFA/TOTP (complementary security), Advanced Follow-up: Custom password validation rules (dictionary check, keyboard pattern check), Passwordless authentication (Passkeys as alternative), and Bcrypt cost benchmarking and tuning
**Depended on by:** Knowledge units that leverage or extend password validation patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for password validation.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization